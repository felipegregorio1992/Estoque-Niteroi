"use client";

import { useState } from "react";
import type { CountSession } from "@/lib/types";
import { dateText, fmt } from "@/lib/stock";

export default function HistoricoClient({
  sessions,
}: {
  sessions: CountSession[];
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section className="bg-card border border-line rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl m-0">Contagens aplicadas</h2>
        <span className="bg-[#fff3da] text-[#7b5622] rounded-full px-2 py-1.5 text-xs font-extrabold">
          {sessions.length}
        </span>
      </div>
      <div className="grid gap-2 mt-4">
        {sessions.length ? (
          sessions.map((x) => {
            const isOpen = open === x.id;
            return (
              <div key={x.id} className="border border-line rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : x.id)}
                  className="w-full flex justify-between gap-2.5 items-center p-3 text-left hover:bg-[#f7faf6]"
                >
                  <div>
                    <code className="font-extrabold text-greenx">{x.code}</code>
                    <small className="block text-[#7b897c] mt-0.5">
                      {dateText(x.applied_at)} · {fmt(x.items.length)} posição(ões)
                    </small>
                  </div>
                  <span className="text-[#758277] text-sm font-bold">
                    {isOpen ? "Fechar ▲" : "Ver itens ▼"}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-line bg-[#fafcf9] p-3">
                    <div className="grid grid-cols-[1fr_1fr_.5fr] gap-3 text-[11px] font-extrabold text-[#718073] px-1 pb-2">
                      <span>SKU</span>
                      <span>LOCAL</span>
                      <span className="text-right">QTD</span>
                    </div>
                    <div className="grid gap-1 max-h-72 overflow-auto scroll-area">
                      {x.items.map((it, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_1fr_.5fr] gap-3 items-center px-1 py-1.5 border-t border-[#edf1ec] text-sm"
                        >
                          <code className="font-bold text-[#245137]">{it.sku}</code>
                          <span>{it.location}</span>
                          <span className="text-right font-bold">
                            {fmt(it.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
            Nenhuma contagem aplicada ainda.
          </div>
        )}
      </div>
    </section>
  );
}
