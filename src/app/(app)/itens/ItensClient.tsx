"use client";

import { useCallback, useEffect, useState } from "react";
import type { Position } from "@/lib/types";
import { fmt } from "@/lib/stock";
import { exportPositionsToExcel } from "@/lib/export";
import { useToast } from "@/components/Toast";

interface Draft {
  id?: string;
  sku: string;
  location: string;
  description: string;
  quantity: string;
  min_alert: string;
}

const emptyDraft: Draft = {
  sku: "",
  location: "",
  description: "",
  quantity: "0",
  min_alert: "",
};

export default function ItensClient({ globalMin }: { globalMin: number }) {
  const toast = useToast();
  const [rows, setRows] = useState<Position[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [onlyAlert, setOnlyAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      q,
      loc,
      page: String(page),
      pageSize: String(pageSize),
      alert: onlyAlert ? "1" : "0",
    });
    const res = await fetch(`/api/positions/list?${params}`);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setRows(json.rows);
      setTotal(json.total);
    } else {
      toast(json.error || "Falha ao carregar itens.", true);
    }
    setLoading(false);
  }, [q, loc, page, pageSize, onlyAlert, toast]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function save() {
    if (!draft) return;
    const isEdit = Boolean(draft.id);
    const body = {
      id: draft.id,
      sku: draft.sku,
      location: draft.location,
      description: draft.description || null,
      quantity: Number(draft.quantity) || 0,
      min_alert: draft.min_alert === "" ? null : Number(draft.min_alert),
    };
    const res = await fetch("/api/positions", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao salvar.", true);
      return;
    }
    toast(isEdit ? "Posição atualizada." : "Posição criada.");
    setDraft(null);
    load();
  }

  async function remove(p: Position) {
    if (!confirm(`Excluir a posição ${p.sku} em ${p.location}?`)) return;
    const res = await fetch(`/api/positions?id=${p.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao excluir.", true);
      return;
    }
    toast("Posição excluída.");
    load();
  }

  async function exportAll() {
    setExporting(true);
    try {
      // Busca todas as posicoes (sem paginacao) para exportar a base inteira.
      const all: Position[] = [];
      let p = 0;
      for (;;) {
        const params = new URLSearchParams({
          page: String(p),
          pageSize: "100",
        });
        const res = await fetch(`/api/positions/list?${params}`);
        const json = await res.json();
        all.push(...json.rows);
        if (all.length >= json.total || json.rows.length === 0) break;
        p += 1;
      }
      await exportPositionsToExcel(all);
      toast(`Exportadas ${all.length} posições.`);
    } catch {
      toast("Falha ao exportar.", true);
    }
    setExporting(false);
  }

  return (
    <div className="grid gap-4">
      {/* Barra de filtros/acoes */}
      <div className="bg-card border border-line rounded-2xl shadow-card p-4 flex flex-wrap gap-3 items-center">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Buscar por SKU ou descrição"
          className="input flex-1 min-w-[200px]"
        />
        <input
          value={loc}
          onChange={(e) => {
            setLoc(e.target.value);
            setPage(0);
          }}
          placeholder="Filtrar por local"
          className="input w-44"
        />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={onlyAlert}
            onChange={(e) => {
              setOnlyAlert(e.target.checked);
              setPage(0);
            }}
            className="w-4 h-4"
          />
          Só alertas
        </label>
        <button
          onClick={() => setDraft({ ...emptyDraft })}
          className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-2.5"
        >
          Novo item
        </button>
        <button
          onClick={exportAll}
          disabled={exporting}
          className="rounded-[10px] bg-[#f0f5ee] text-[#31563b] border border-line font-extrabold text-[13px] px-3.5 py-2.5 disabled:opacity-50"
        >
          {exporting ? "Exportando..." : "Exportar Excel"}
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-line rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-auto scroll-area">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1fr_1.4fr_.8fr_.7fr_.7fr_.9fr] gap-3 items-center px-4 py-3 bg-[#f2f6f0] text-[#718073] text-[11px] tracking-wide font-extrabold">
              <span>SKU</span>
              <span>DESCRIÇÃO</span>
              <span>LOCAL</span>
              <span className="text-right">QTD</span>
              <span className="text-right">LIMITE</span>
              <span className="text-right">AÇÕES</span>
            </div>
            {loading ? (
              <div className="p-9 text-center text-[#829083]">Carregando...</div>
            ) : rows.length ? (
              rows.map((p) => {
                const min = p.min_alert ?? globalMin;
                const alert = p.quantity <= min;
                return (
                  <div
                    key={p.id}
                    className="grid grid-cols-[1fr_1.4fr_.8fr_.7fr_.7fr_.9fr] gap-3 items-center px-4 py-3 border-t border-[#edf1ec]"
                  >
                    <code className="font-extrabold text-[#245137]">{p.sku}</code>
                    <span className="truncate text-sm text-[#4a5a4d]">
                      {p.description || "—"}
                    </span>
                    <span className="text-sm">{p.location}</span>
                    <span
                      className={`text-right font-bold ${
                        alert ? "text-danger" : ""
                      }`}
                    >
                      {fmt(p.quantity)}
                    </span>
                    <span className="text-right text-[#758277]">
                      {p.min_alert ?? `${globalMin}*`}
                    </span>
                    <span className="flex justify-end gap-2">
                      <button
                        onClick={() =>
                          setDraft({
                            id: p.id,
                            sku: p.sku,
                            location: p.location,
                            description: p.description ?? "",
                            quantity: String(p.quantity),
                            min_alert: p.min_alert === null ? "" : String(p.min_alert),
                          })
                        }
                        className="rounded-lg bg-[#f0f5ee] text-[#31563b] border border-line font-bold text-xs px-2.5 py-1.5"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remove(p)}
                        className="rounded-lg bg-[#f9ece5] text-danger font-bold text-xs px-2.5 py-1.5"
                      >
                        Excluir
                      </button>
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="p-9 text-center text-[#829083]">
                Nenhuma posição encontrada.
              </div>
            )}
          </div>
        </div>
        {/* Paginacao */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-line text-sm">
          <span className="text-[#758277]">
            {fmt(total)} posição(ões) · limite com * usa o padrão global
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-line px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="font-bold">
              {page + 1} / {totalPages}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-line px-3 py-1.5 font-bold disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modal criar/editar */}
      {draft && (
        <div
          className="fixed inset-0 bg-black/40 grid place-items-center z-40 p-4"
          onClick={() => setDraft(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-card p-6 w-full max-w-md grid gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl m-0">
              {draft.id ? "Editar posição" : "Nova posição"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="SKU">
                <input
                  value={draft.sku}
                  onChange={(e) => setDraft({ ...draft, sku: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Local">
                <input
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  className="input"
                />
              </Field>
              <div className="col-span-2">
                <Field label="Descrição">
                  <input
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Quantidade">
                <input
                  type="number"
                  min={0}
                  value={draft.quantity}
                  onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Limite (vazio = global)">
                <input
                  type="number"
                  min={0}
                  value={draft.min_alert}
                  onChange={(e) => setDraft({ ...draft, min_alert: e.target.value })}
                  className="input"
                  placeholder="padrão"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDraft(null)}
                className="rounded-[10px] bg-[#f0f5ee] text-[#31563b] border border-line font-extrabold text-[13px] px-3.5 py-3"
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
