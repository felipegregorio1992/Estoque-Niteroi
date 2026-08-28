import type { CountItem, Position } from "@/lib/types";

export function fmt(n: number | string | null | undefined): string {
  return new Intl.NumberFormat("pt-BR").format(Number(n || 0));
}

export function dateText(v: string | null | undefined): string {
  if (!v) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(v));
}

export function normalizeSku(v: unknown): string {
  return String(v ?? "").trim().replace(/\s+/g, "");
}

export function normalizeLoc(v: unknown): string {
  return String(v ?? "").trim().replace(/\s+/g, " ").toUpperCase();
}

// Limite efetivo de um item: o proprio min_alert ou o padrao global.
export function effectiveMin(p: Position, globalDefault: number): number {
  return p.min_alert ?? globalDefault;
}

// Um item esta em alerta se a quantidade <= limite efetivo.
export function isAlert(p: Position, globalDefault: number): boolean {
  return Number(p.quantity) <= effectiveMin(p, globalDefault);
}

// Filtra e ordena posicoes em alerta.
export function alertItems(
  positions: Position[],
  globalDefault: number
): Position[] {
  return positions
    .filter((p) => isAlert(p, globalDefault))
    .sort(
      (a, b) =>
        Number(a.quantity) - Number(b.quantity) || a.sku.localeCompare(b.sku)
    );
}

export interface Stats {
  skus: number;
  positions: number;
  units: number;
  alerts: number;
}

export function computeStats(
  positions: Position[],
  globalDefault: number
): Stats {
  return {
    skus: new Set(positions.map((x) => x.sku)).size,
    positions: positions.length,
    units: positions.reduce((s, x) => s + Number(x.quantity || 0), 0),
    alerts: alertItems(positions, globalDefault).length,
  };
}

// Consolida itens de contagem por sku+local+validade.
export function mergeItems(items: CountItem[]): CountItem[] {
  const m = new Map<string, CountItem>();
  for (const raw of items) {
    const sku = normalizeSku(raw.sku);
    const location = normalizeLoc(raw.location);
    const expiry = raw.expiry || null;
    if (!sku || !location) continue;
    const key = [sku, location, expiry || ""].join("|");
    const prev = m.get(key);
    m.set(key, {
      sku,
      location,
      quantity:
        (prev?.quantity || 0) + Math.max(0, Math.trunc(Number(raw.quantity) || 0)),
      expiry,
      description: raw.description || prev?.description || null,
    });
  }
  return [...m.values()];
}

export function generateCode(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `CTG-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(
    d.getDate()
  )}-${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
}
