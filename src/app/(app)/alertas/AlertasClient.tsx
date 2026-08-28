"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CountItem, Position } from "@/lib/types";
import { fmt, generateCode, mergeItems } from "@/lib/stock";
import { createCountPdf, downloadBlob } from "@/lib/pdf";
import { applyCount } from "@/app/(app)/count-actions";
import { useToast } from "@/components/Toast";

type AlertRow = Position & { _min: number };
interface RandomRow extends Position {
  found: number;
}

export default function AlertasClient({
  alerts,
  positions,
}: {
  alerts: AlertRow[];
  positions: Position[];
}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [random, setRandom] = useState<RandomRow[]>([]);

  function generateRandom() {
    const pool = [...positions].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const list: RandomRow[] = [];
    for (const p of pool) {
      if (seen.has(p.sku)) continue;
      seen.add(p.sku);
      list.push({ ...p, found: p.quantity });
      if (list.length === 10) break;
    }
    setRandom(list);
    toast("Lista aleatória criada.");
  }

  function setFound(i: number, v: string) {
    setRandom((prev) =>
      prev.map((r, idx) =>
        idx === i ? { ...r, found: Math.max(0, Math.trunc(Number(v) || 0)) } : r
      )
    );
  }

  function finishRandom() {
    if (!random.length) return;
    const code = generateCode();
    const items: CountItem[] = random.map((p) => ({
      sku: p.sku,
      location: p.location,
      quantity: p.found,
      description: p.description,
      expiry: null,
    }));
    const merged = mergeItems(items);
    startTransition(async () => {
      const res = await applyCount(merged, code);
      if (!res.ok) {
        toast(res.message, true);
        return;
      }
      downloadBlob(
        createCountPdf({ code, createdAt: new Date().toISOString(), items: merged }),
        `contagem-${code}.pdf`
      );
      setRandom([]);
      toast("Lista aplicada e estoque atualizado.");
      router.refresh();
    });
  }

  return (
    <section className="grid grid-cols-[1fr_1fr] gap-5 max-md:grid-cols-1">
      <div className="bg-goldbg border border-[#eeddb9] rounded-2xl p-6">
        <span className="inline-block rounded-full bg-[#f5e5bf] text-[#755425] text-[11px] font-extrabold px-2.5 py-1.5">
          CONFERÊNCIA URGENTE
        </span>
        <h2 className="mt-3.5 text-xl">Itens no limite de alerta</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          A quantidade está no limite configurado ou abaixo dele.
        </p>
        <div className="grid gap-2.5 mt-4 max-h-[520px] overflow-auto scroll-area">
          {alerts.length ? (
            alerts.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 justify-between bg-white border border-[#eddcc2] p-3 rounded-xl"
              >
                <div>
                  <code className="font-extrabold text-[#68491f] text-[13px]">
                    {p.sku}
                  </code>
                  <small className="block text-[#68766b] mt-0.5">
                    {p.location}
                    {p.description ? " · " + p.description : ""} · limite {p._min}
                  </small>
                </div>
                <span className="bg-[#fff3da] text-[#7b5622] rounded-full px-2 py-1.5 text-xs font-extrabold whitespace-nowrap">
                  {fmt(p.quantity)} un.
                </span>
              </div>
            ))
          ) : (
            <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
              Nenhum alerta no momento.
            </div>
          )}
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <div className="flex justify-between items-start gap-3">
          <div>
            <span className="inline-block rounded-full bg-[#e7f1e6] text-[#315a3b] text-[11px] font-extrabold px-2.5 py-1.5">
              AMOSTRAGEM
            </span>
            <h2 className="mt-3.5 text-xl">Lista aleatória para contagem</h2>
            <p className="text-[#6f7d71] leading-relaxed">
              Gere 10 SKUs distintos, confira as quantidades e finalize.
            </p>
          </div>
          <button
            onClick={generateRandom}
            className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3 whitespace-nowrap"
          >
            Criar lista
          </button>
        </div>

        {random.length ? (
          <>
            <div className="mt-4 border border-line rounded-xl overflow-auto">
              <div className="min-w-[560px] grid grid-cols-[1.2fr_1fr_.7fr_.9fr] gap-3 items-center px-3.5 py-3 bg-[#f2f6f0] text-[#718073] text-[11px] tracking-wide font-extrabold">
                <span>SKU</span>
                <span>LOCAL</span>
                <span className="text-right">DISPONÍVEL</span>
                <span className="text-right">ENCONTRADO</span>
              </div>
              {random.map((p, i) => (
                <div
                  key={p.id}
                  className="min-w-[560px] grid grid-cols-[1.2fr_1fr_.7fr_.9fr] gap-3 items-center px-3.5 py-3 border-t border-[#edf1ec]"
                >
                  <div>
                    <code className="font-extrabold text-[#245137]">{p.sku}</code>
                    <small className="block text-[#829083] mt-0.5">
                      {p.description || "Sem descrição"}
                    </small>
                  </div>
                  <div>{p.location}</div>
                  <div className="text-right">{fmt(p.quantity)}</div>
                  <div>
                    <input
                      type="number"
                      min={0}
                      value={p.found}
                      onChange={(e) => setFound(i, e.target.value)}
                      className="w-full h-9 border border-line rounded-lg text-right px-2"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2.5 mt-4">
              <button
                onClick={() => setRandom([])}
                className="rounded-[10px] bg-[#f0f5ee] text-[#31563b] border border-line font-extrabold text-[13px] px-3.5 py-3"
              >
                Descartar
              </button>
              <button
                onClick={finishRandom}
                disabled={pending}
                className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3 disabled:opacity-50"
              >
                {pending ? "Aplicando..." : "Finalizar e atualizar estoque"}
              </button>
            </div>
          </>
        ) : (
          <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center mt-4">
            Nenhuma lista ativa. Crie uma amostra com 10 SKUs distintos.
          </div>
        )}
      </div>
    </section>
  );
}
