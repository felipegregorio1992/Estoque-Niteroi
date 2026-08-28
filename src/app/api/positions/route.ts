import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthApi } from "@/lib/api-auth";
import { normalizeLoc, normalizeSku } from "@/lib/stock";
import { parseBody, positionSchema, positionUpdateSchema } from "@/lib/validation";

// POST: cria uma nova posicao (item novo em um local).
export async function POST(request: Request) {
  const guard = await requireAuthApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sessão expirada." }, { status: guard.status });

  const json = await request.json().catch(() => null);
  const parsed = parseBody(positionSchema, json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const sku = normalizeSku(body.sku);
  const location = normalizeLoc(body.location);
  const supabase = createClient();

  const { error: insErr } = await supabase.from("positions").insert({
    sku,
    location,
    description: body.description ?? null,
    quantity: body.quantity ?? 0,
    min_alert: body.min_alert ?? null,
    last_counted_at: new Date().toISOString(),
  });

  if (insErr) {
    if (insErr.code === "23505")
      return NextResponse.json(
        { error: "Já existe uma posição com esse SKU e local." },
        { status: 409 }
      );
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// PUT: edita uma posicao existente pelo id.
export async function PUT(request: Request) {
  const guard = await requireAuthApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sessão expirada." }, { status: guard.status });

  const json = await request.json().catch(() => null);
  const parsed = parseBody(positionUpdateSchema, json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const update: Record<string, unknown> = {};
  if (body.sku !== undefined) update.sku = normalizeSku(body.sku);
  if (body.location !== undefined) update.location = normalizeLoc(body.location);
  if (body.description !== undefined) update.description = body.description ?? null;
  if (body.quantity !== undefined) update.quantity = body.quantity;
  if (body.min_alert !== undefined) update.min_alert = body.min_alert ?? null;

  const supabase = createClient();
  const { error: upErr } = await supabase
    .from("positions")
    .update(update)
    .eq("id", body.id);
  if (upErr) {
    if (upErr.code === "23505")
      return NextResponse.json(
        { error: "Já existe uma posição com esse SKU e local." },
        { status: 409 }
      );
    return NextResponse.json({ error: upErr.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE: remove uma posicao pelo id (?id=...).
export async function DELETE(request: Request) {
  const guard = await requireAuthApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sessão expirada." }, { status: guard.status });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  const supabase = createClient();
  const { error } = await supabase.from("positions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
