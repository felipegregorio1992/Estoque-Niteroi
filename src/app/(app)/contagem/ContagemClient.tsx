"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { CountItem } from "@/lib/types";
import {
  fmt,
  generateCode,
  mergeItems,
  normalizeLoc,
  normalizeSku,
} from "@/lib/stock";
import { createCountPdf, downloadBlob } from "@/lib/pdf";
import { applyCount } from "@/app/(app)/count-actions";
import { useToast } from "@/components/Toast";
import BarcodeScanner from "@/components/BarcodeScanner";

interface Known {
  sku: string;
  location: string;
  description: string | null;
}

export default function ContagemClient({ known }: { known: Known[] }) {
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [sku, setSku] = useState("");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiry, setExpiry] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<CountItem[]>([]);
  const [scanning, setScanning] = useState(false);

  const totalUnits = items.reduce((s, x) => s + x.quantity, 0);

  function addItem() {
    const s = normalizeSku(sku);
    const l = normalizeLoc(location);
    const q = Math.max(0, Math.trunc(Number(quantity) || 0));
    if (!s || !l) {
      toast("Preencha SKU e local.", true);
      return;
    }
    const match = known.find((k) => k.sku === s && k.location === l);
    setItems((prev) => [
      {
        sku: s,
        location: l,
        quantity: q,
        expiry: expiry || null,
        description: description.trim() || match?.description || null,
      },
      ...prev,
    ]);
    setSku("");
    setLocation("");
    setQuantity("1");
    setExpiry("");
    setDescription("");
  }

  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function finish() {
    if (!items.length) return;
    const code = generateCode();
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
      setItems([]);
      toast("Estoque atualizado e PDF baixado.");
      router.refresh();
    });
  }

  return (
    <>
    <BarcodeScanner
      open={scanning}
      onClose={() => setScanning(false)}
      onDetected={(v) => setSku(v)}
    />
    <section className="grid grid-cols-[.8fr_1.2fr] gap-5 max-md:grid-cols-1">
      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <h2 className="text-xl m-0">Registrar posição física</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          Adicione os itens e finalize para atualizar a base por SKU e
          localização.
        </p>
        <div className="grid grid-cols-2 gap-4 mt-4 max-md:grid-cols-1">
          <Field label="SKU">
            <div className="flex gap-2">
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Digite, cole ou escaneie"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => setScanning(true)}
                title="Ler código de barras"
                className="rounded-lg bg-[#f0f5ee] border border-line px-3 text-lg"
              >
                📷
              </button>
            </div>
          </Field>
          <Field label="Local">
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex.: CAIXA 1"
              className="input"
            />
          </Field>
          <Field label="Quantidade encontrada">
            <input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Validade (opcional)">
            <input
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              className="input"
            />
          </Field>
          <div className="col-span-2 max-md:col-span-1">
            <Field label="Descrição (opcional)">
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Preenchida automaticamente se o SKU já existir"
                className="input"
              />
            </Field>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={addItem}
            className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3"
          >
            Adicionar à contagem
          </button>
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl m-0">Resumo da contagem</h2>
          <span className="bg-[#fff3da] text-[#7b5622] rounded-full px-2 py-1.5 text-xs font-extrabold">
            {fmt(totalUnits)} un.
          </span>
        </div>
        <div className="grid gap-2 mt-4">
          {items.length ? (
            items.map((x, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2.5 border border-line rounded-xl p-3"
              >
                <div>
                  <code className="font-extrabold text-[#245137]">{x.sku}</code>
                  <small className="block text-[#758277] mt-0.5">
                    {x.location}
                    {x.expiry ? " · Val. " + x.expiry : ""}
                  </small>
                </div>
                <div className="flex items-center gap-2.5">
                  <b>{fmt(x.quantity)}</b>
                  <button
                    onClick={() => removeItem(i)}
                    className="rounded-[10px] bg-[#f9ece5] text-danger font-extrabold text-[13px] px-3 py-2"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
              Nenhum item adicionado.
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={finish}
            disabled={!items.length || pending}
            className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3 disabled:opacity-50"
          >
            {pending ? "Aplicando..." : "Finalizar, atualizar estoque e gerar PDF"}
          </button>
        </div>
        <p className="text-xs text-[#7b897c] leading-relaxed mt-3">
          O PDF é um comprovante. A base é atualizada no momento da finalização.
        </p>
      </div>
    </section>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-[13px] font-extrabold">
      {label}
      {children}
    </label>
  );
}
