import type { Position } from "@/lib/types";

// Exporta posicoes para .xlsx no mesmo padrao aceito pela importacao:
// uma linha por SKU, com LOCAL 1..6 e QTD/QTD2..6. Carrega xlsx sob demanda.
export async function exportPositionsToExcel(positions: Position[]) {
  const XLSX = await import("xlsx");

  // Agrupa por SKU.
  const bySku = new Map<
    string,
    { description: string | null; date: string | null; locs: [string, number][] }
  >();
  for (const p of positions) {
    const entry =
      bySku.get(p.sku) ??
      { description: p.description, date: p.last_counted_at, locs: [] };
    if (!entry.description && p.description) entry.description = p.description;
    if (p.last_counted_at && (!entry.date || p.last_counted_at > entry.date))
      entry.date = p.last_counted_at;
    entry.locs.push([p.location, p.quantity]);
    bySku.set(p.sku, entry);
  }

  const rows = [...bySku.entries()].map(([sku, e]) => {
    const row: Record<string, unknown> = {
      SKU: sku,
      "DESCRIÇÃO": e.description ?? "",
    };
    e.locs.slice(0, 6).forEach(([loc, qty], i) => {
      row[`LOCAL ${i + 1}`] = loc;
      row[i === 0 ? "QTD" : `QTD${i + 1}`] = qty;
    });
    row["DATA DE CONTAGEM"] = e.date ? new Date(e.date) : "";
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LOCALIZAÇÃO ITENS LOJA NITERÓI");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `estoque-niteroi-${stamp}.xlsx`);
}
