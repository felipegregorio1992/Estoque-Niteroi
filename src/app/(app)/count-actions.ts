"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mergeItems, normalizeLoc, normalizeSku } from "@/lib/stock";
import type { CountItem } from "@/lib/types";

export interface ApplyResult {
  ok: boolean;
  message: string;
  applied?: number;
}

// Aplica uma contagem: consolida itens, atualiza posicoes por sku+local
// e grava a sessao no historico. Codigo unico impede aplicar duas vezes.
export async function applyCount(
  items: CountItem[],
  code: string
): Promise<ApplyResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sessão expirada. Faça login novamente." };

  const lines = mergeItems(items);
  if (!lines.length) return { ok: false, message: "Nenhum item válido na contagem." };

  // Codigo ja aplicado?
  const { data: existing } = await supabase
    .from("count_sessions")
    .select("id")
    .eq("code", code)
    .maybeSingle();
  if (existing) {
    return { ok: false, message: "Esta contagem já foi aplicada." };
  }

  const appliedAt = new Date().toISOString();

  // Atualiza cada posicao (upsert por sku+local).
  for (const x of lines) {
    const sku = normalizeSku(x.sku);
    const location = normalizeLoc(x.location);

    const { data: found } = await supabase
      .from("positions")
      .select("id, description")
      .eq("sku", sku)
      .eq("location", location)
      .maybeSingle();

    if (found) {
      await supabase
        .from("positions")
        .update({
          quantity: x.quantity,
          description: x.description ?? found.description ?? null,
          last_counted_at: appliedAt,
        })
        .eq("id", found.id);
    } else {
      await supabase.from("positions").insert({
        sku,
        location,
        quantity: x.quantity,
        description: x.description ?? null,
        last_counted_at: appliedAt,
      });
    }
  }

  const { error: sessionError } = await supabase.from("count_sessions").insert({
    code,
    applied_at: appliedAt,
    applied_by: user.id,
    items: lines,
  });
  if (sessionError) {
    return { ok: false, message: "Falha ao registrar a contagem no histórico." };
  }

  revalidatePath("/");
  revalidatePath("/alertas");
  revalidatePath("/historico");
  revalidatePath("/consultar");

  // Dispara verificacao de alertas por email (se configurado). Nao bloqueia.
  return { ok: true, message: "Estoque atualizado.", applied: lines.length };
}
