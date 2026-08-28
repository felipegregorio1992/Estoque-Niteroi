import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthApi } from "@/lib/api-auth";
import { normalizeSku } from "@/lib/stock";
import { limitSchema, parseBody } from "@/lib/validation";

// PUT: define o limite de alerta (min_alert) para todas as posicoes de um SKU.
// min_alert null = volta a usar o padrao global. Qualquer usuario autenticado.
export async function PUT(request: Request) {
  const guard = await requireAuthApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sessão expirada." }, { status: guard.status });

  const json = await request.json().catch(() => null);
  const parsed = parseBody(limitSchema, json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const sku = normalizeSku(body.sku);
  const supabase = createClient();
  const { error: upErr } = await supabase
    .from("positions")
    .update({ min_alert: body.min_alert })
    .eq("sku", sku);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
