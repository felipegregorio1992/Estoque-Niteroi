"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizeLoc, normalizeSku } from "@/lib/stock";
import type { CountItem } from "@/lib/types";

interface ImportRow {
  sku: string;
  description: string | null;
  location: string;
  quantity: number;
  last_counted_at: string | null;
}

// Substitui a base inteira pelas posicoes vindas da planilha.
export async function replaceBase(
  rows: ImportRow[]
): Promise<{ ok: boolean; message: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada." };

  const clean = rows
    .map((r) => ({
      sku: normalizeSku(r.sku),
      description: r.description || null,
      location: normalizeLoc(r.location),
      quantity: Math.max(0, Math.trunc(Number(r.quantity) || 0)),
      last_counted_at: r.last_counted_at || null,
    }))
    .filter((r) => r.sku && r.location);

  if (!clean.length) {
    return { ok: false, message: "Nenhuma posição válida encontrada." };
  }

  // Apaga tudo e insere de novo (base local substituida).
  const { error: delErr } = await supabase
    .from("positions")
    .delete()
    .not("id", "is", null);
  if (delErr) return { ok: false, message: "Falha ao limpar a base atual." };

  // Insere em lotes para nao estourar payload.
  const BATCH = 500;
  for (let i = 0; i < clean.length; i += BATCH) {
    const slice = clean.slice(i, i + BATCH);
    const { error } = await supabase.from("positions").upsert(slice, {
      onConflict: "sku,location",
    });
    if (error) {
      return { ok: false, message: "Falha ao inserir posições: " + error.message };
    }
  }

  revalidatePath("/");
  revalidatePath("/alertas");
  revalidatePath("/consultar");
  return {
    ok: true,
    message: `Base atualizada com ${clean.length} posições.`,
  };
}

// Aplica um PDF de contagem gerado pelo app (mesma logica do apply de contagem).
export async function applyPdfCount(
  items: CountItem[],
  code: string
): Promise<{ ok: boolean; message: string }> {
  const { applyCount } = await import("@/app/(app)/count-actions");
  const res = await applyCount(items, code);
  return { ok: res.ok, message: res.message };
}
