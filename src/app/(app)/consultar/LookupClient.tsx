"use client";

import { useMemo, useState } from "react";
import type { Position } from "@/lib/types";
import { dateText, fmt, normalizeSku } from "@/lib/stock";
import { useToast } from "@/components/Toast";
import BarcodeScanner from "@/components/BarcodeScanner";

export default function LookupClient({ positions }: { positions: Position[] }) {
  const toast = useToast();
  const [input, setInput] = useState("");
  const [sku, setSku] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const rows = useMemo(
    () => (sku ? positions.filter((p) => p.sku === sku) : []),
    [sku, positions]
  );
  const total = rows.reduce((s, p) => s + Number(p.quantity || 0), 0);

  function search() {
    const v = normalizeSku(input);
    if (!v) {
      toast("Digite um SKU para consultar.", true);
      return;
    }
    setSku(v);
  }

  function scanned(v: string) {
    setInput(v);
    setSku(normalizeSku(v));
  }

  return (
    <section className="grid grid-cols-[.8fr_1.2fr] gap-5 max-md:grid-cols-1">
      <BarcodeScanner
        open={scanning}
        onClose={() => setScanning(false)}
        onDetected={scanned}
      />
      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <h2 className="text-xl m-0">Consulta por SKU</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          Cole, digite ou escaneie o SKU. A busca mostra a quantidade
          consolidada e todos os locais.
        </p>
        <div className="flex gap-2 mt-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Ex.: 100008940"
            className="flex-1 h-11 border border-line rounded-xl px-3 font-mono"
          />
          <button
            onClick={() => setScanning(true)}
            title="Ler código de barras"
            className="rounded-[10px] bg-[#f0f5ee] border border-line px-3 text-lg"
          >
            📷
          </button>
          <button
            onClick={search}
            className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5"
          >
            Consultar
          </button>
        </div>
      </div>

      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        {!sku ? (
          <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
            Pronto para consultar um produto.
          </div>
        ) : rows.length === 0 ? (
          <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
            SKU <b>{sku}</b> não localizado.
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-3 border-b border-[#e7ece6] pb-4">
              <div>
                <span className="inline-block rounded-full bg-[#f5e5bf] text-[#755425] text-[11px] font-extrabold px-2.5 py-1.5">
                  SKU {sku}
                </span>
                <h2 className="mt-3 text-xl">
                  {rows[0].description || "Produto sem descrição"}
                </h2>
              </div>
              <div className="px-3 py-2.5 rounded-xl text-white bg-deep text-right">
                <small>SALDO</small>
                <b className="text-2xl block">{fmt(total)}</b>
              </div>
            </div>
            <div className="grid gap-2 mt-4">
              {rows.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between border border-line p-3 rounded-[10px]"
                >
                  <div>
                    <b>{p.location}</b>
                    <small className="block text-[#809083] mt-0.5">
                      Última contagem: {dateText(p.last_counted_at)}
                    </small>
                  </div>
                  <b>{fmt(p.quantity)} un.</b>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
