import { describe, expect, it } from "vitest";
import {
  alertItems,
  computeStats,
  effectiveMin,
  generateCode,
  isAlert,
  mergeItems,
  normalizeLoc,
  normalizeSku,
} from "@/lib/stock";
import type { Position } from "@/lib/types";

function pos(p: Partial<Position>): Position {
  return {
    id: p.id ?? Math.random().toString(),
    sku: p.sku ?? "100000000",
    description: p.description ?? null,
    location: p.location ?? "P01-A",
    quantity: p.quantity ?? 0,
    min_alert: p.min_alert ?? null,
    last_counted_at: p.last_counted_at ?? null,
    updated_at: p.updated_at ?? new Date().toISOString(),
  };
}

describe("normalizadores", () => {
  it("remove espacos do SKU", () => {
    expect(normalizeSku("  100 008 940 ")).toBe("100008940");
  });
  it("normaliza local para maiusculo e espaco unico", () => {
    expect(normalizeLoc("  caixa   1 ")).toBe("CAIXA 1");
  });
});

describe("effectiveMin / isAlert", () => {
  it("usa min_alert proprio quando definido", () => {
    expect(effectiveMin(pos({ min_alert: 3 }), 10)).toBe(3);
  });
  it("usa o padrao global quando min_alert e null", () => {
    expect(effectiveMin(pos({ min_alert: null }), 10)).toBe(10);
  });
  it("dispara alerta quando quantidade <= limite", () => {
    expect(isAlert(pos({ quantity: 10, min_alert: null }), 10)).toBe(true);
    expect(isAlert(pos({ quantity: 11, min_alert: null }), 10)).toBe(false);
    expect(isAlert(pos({ quantity: 2, min_alert: 5 }), 10)).toBe(true);
  });
});

describe("alertItems", () => {
  it("filtra e ordena por menor quantidade", () => {
    const list = [
      pos({ sku: "A", quantity: 8, min_alert: null }),
      pos({ sku: "B", quantity: 20, min_alert: null }),
      pos({ sku: "C", quantity: 1, min_alert: null }),
    ];
    const res = alertItems(list, 10);
    expect(res.map((p) => p.sku)).toEqual(["C", "A"]);
  });
});

describe("computeStats", () => {
  it("conta skus distintos, posicoes, unidades e alertas", () => {
    const list = [
      pos({ sku: "A", location: "L1", quantity: 5 }),
      pos({ sku: "A", location: "L2", quantity: 5 }),
      pos({ sku: "B", location: "L1", quantity: 50 }),
    ];
    const s = computeStats(list, 10);
    expect(s.skus).toBe(2);
    expect(s.positions).toBe(3);
    expect(s.units).toBe(60);
    expect(s.alerts).toBe(2); // as duas posicoes de A (5 <= 10)
  });
});

describe("mergeItems", () => {
  it("consolida por sku+local+validade somando quantidades", () => {
    const merged = mergeItems([
      { sku: "100 1", location: "caixa 1", quantity: 2 },
      { sku: "1001", location: "CAIXA 1", quantity: 3 },
      { sku: "1001", location: "CAIXA 2", quantity: 1 },
    ]);
    const c1 = merged.find((m) => m.location === "CAIXA 1");
    expect(c1?.quantity).toBe(5);
    expect(merged).toHaveLength(2);
  });
  it("ignora itens sem sku ou local", () => {
    const merged = mergeItems([{ sku: "", location: "X", quantity: 1 }]);
    expect(merged).toHaveLength(0);
  });
});

describe("generateCode", () => {
  it("gera codigo no formato CTG-AAAAMMDD-XXXX", () => {
    expect(generateCode()).toMatch(/^CTG-\d{8}-[A-Z0-9]+$/);
  });
});
