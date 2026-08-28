// Gera o arquivo supabase/seed.sql a partir de scripts/initial-positions.json
// Uso: node scripts/generate-seed.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const positions = JSON.parse(
  readFileSync(join(__dirname, "initial-positions.json"), "utf8")
);

function sqlStr(v) {
  if (v === null || v === undefined || v === "") return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}
function sqlNum(v) {
  const n = Math.max(0, Math.trunc(Number(v) || 0));
  return String(n);
}
function sqlTs(v) {
  if (!v) return "NULL";
  return "'" + new Date(v).toISOString() + "'";
}

// Deduplica por (sku, location): mantem a ultima ocorrencia, somando a quantidade
// se aparecer repetida (mesma logica de consolidacao do app).
const byKey = new Map();
for (const p of positions) {
  const sku = String(p.sku || "").trim().replace(/\s+/g, "");
  const location = String(p.location || "").trim().replace(/\s+/g, " ").toUpperCase();
  if (!sku || !location) continue;
  const key = sku + "|" + location;
  const prev = byKey.get(key);
  if (prev) {
    // mesma posicao repetida: soma quantidades e mantem descricao/data mais recente
    prev.quantity += Math.max(0, Math.trunc(Number(p.quantity) || 0));
    if (p.description) prev.description = p.description;
    if (p.lastCountedAt) prev.lastCountedAt = p.lastCountedAt;
  } else {
    byKey.set(key, {
      sku,
      location,
      description: p.description ?? null,
      quantity: Math.max(0, Math.trunc(Number(p.quantity) || 0)),
      lastCountedAt: p.lastCountedAt ?? null,
    });
  }
}

const values = [...byKey.values()].map(
  (p) =>
    `  (${sqlStr(p.sku)}, ${sqlStr(p.description)}, ${sqlStr(p.location)}, ${sqlNum(p.quantity)}, ${sqlTs(p.lastCountedAt)})`
);

const header = `-- Gerado automaticamente por scripts/generate-seed.mjs
-- Base inicial migrada do arquivo Controle_Estoque_Niteroi.html
-- Rode este arquivo DEPOIS de schema.sql, no SQL Editor do Supabase.

insert into public.positions (sku, description, location, quantity, last_counted_at)
values
${values.join(",\n")}
on conflict (sku, location) do update
  set description = excluded.description,
      quantity = excluded.quantity,
      last_counted_at = excluded.last_counted_at;
`;

writeFileSync(join(root, "supabase", "seed.sql"), header, "utf8");
console.log(`seed.sql gerado com ${values.length} posicoes.`);
