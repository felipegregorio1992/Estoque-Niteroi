"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { normalizeLoc, normalizeSku } from "@/lib/stock";
import { useToast } from "@/components/Toast";
import { replaceBase, applyPdfCount } from "./import-actions";

// Decodifica o payload embutido no PDF (base64url).
function decodePayload(t: string) {
  const base = t.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function ImportarClient() {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const ws =
        wb.Sheets["LOCALIZAÇÃO ITENS LOJA NITERÓI"] ||
        wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
        defval: null,
        raw: true,
      });
      const positions: {
        sku: string;
        description: string | null;
        location: string;
        quantity: number;
        last_counted_at: string | null;
      }[] = [];

      rows.forEach((r) => {
        const sku = normalizeSku(r.SKU ?? r["Código"] ?? r["CÓDIGO"]);
        if (!sku) return;
        const descRaw = r["DESCRIÇÃO"] ?? r["Descrição"];
        const desc = typeof descRaw === "string" ? descRaw.trim() : null;
        const dRaw = r["DATA DE CONTAGEM"];
        const d = dRaw instanceof Date ? dRaw.toISOString() : null;
        for (let i = 1; i <= 6; i++) {
          const loc = r[`LOCAL ${i}`];
          const q = r[i === 1 ? "QTD" : `QTD${i}`];
          if (loc !== null && loc !== undefined && String(loc).trim()) {
            positions.push({
              sku,
              description: desc,
              location: normalizeLoc(loc),
              quantity: Math.max(0, Math.trunc(Number(q) || 0)),
              last_counted_at: d,
            });
          }
        }
      });

      if (!positions.length) {
        toast("Nenhuma posição válida encontrada na planilha.", true);
        return;
      }
      if (
        !confirm(
          `Substituir a base por ${positions.length} posições? Isto apaga os dados atuais.`
        )
      )
        return;

      startTransition(async () => {
        const res = await replaceBase(positions);
        toast(res.message, !res.ok);
        if (res.ok) router.refresh();
      });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Falha ao importar a planilha.",
        true
      );
    }
  }

  async function onPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = new TextDecoder("latin1").decode(
        new Uint8Array(await file.arrayBuffer())
      );
      const marker = text.match(/CTGPAYLOAD:([A-Za-z0-9_-]+)/)?.[1];
      if (!marker)
        throw new Error("O PDF não possui um código de contagem deste app.");
      const payload = decodePayload(marker);
      if (!payload?.code || !Array.isArray(payload.items))
        throw new Error("Conteúdo de contagem inválido.");
      startTransition(async () => {
        const res = await applyPdfCount(payload.items, payload.code);
        toast(res.message, !res.ok);
        if (res.ok) router.refresh();
      });
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Não foi possível aplicar o PDF.",
        true
      );
    }
  }

  return (
    <section className="grid grid-cols-[1fr_1fr] gap-5 max-md:grid-cols-1">
      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <h2 className="text-xl m-0">Importar base por Excel</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          Substitui a base pela planilha no padrão SKU, LOCAL 1–6, QTD–QTD6 e
          DATA DE CONTAGEM.
        </p>
        <label className="block mt-4 border-2 border-dashed border-[#cbd9cb] rounded-2xl p-8 text-center bg-[#f9fcf8] cursor-pointer">
          <b>Escolher planilha Excel</b>
          <small className="block mt-1.5 text-[#829083]">.xlsx ou .xls</small>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onExcel}
            disabled={pending}
            className="hidden"
          />
        </label>
      </div>

      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <h2 className="text-xl m-0">Aplicar contagem por PDF</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          Envie um PDF de contagem gerado por este app. O estoque é atualizado
          por local e o mesmo código não pode ser aplicado duas vezes.
        </p>
        <label className="block mt-4 border-2 border-dashed border-[#cbd9cb] rounded-2xl p-8 text-center bg-[#f9fcf8] cursor-pointer">
          <b>Enviar PDF de contagem</b>
          <small className="block mt-1.5 text-[#829083]">
            não permite aplicar o mesmo código duas vezes
          </small>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={onPdf}
            disabled={pending}
            className="hidden"
          />
        </label>
      </div>
    </section>
  );
}
