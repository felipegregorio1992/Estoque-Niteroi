import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/api-auth";
import { parseBody, settingsSchema } from "@/lib/validation";

// GET: retorna settings (admin). Nunca devolve a chave em texto puro,
// apenas se ela existe (has_key).
export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sem permissão." }, { status: guard.status });

  const admin = createAdminClient();
  const { data } = await admin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return NextResponse.json({
    default_min_alert: data?.default_min_alert ?? 10,
    email_enabled: data?.email_enabled ?? false,
    alert_from: data?.alert_from ?? "",
    alert_emails: data?.alert_emails ?? [],
    has_key: Boolean(data?.resend_api_key),
  });
}

// PUT: atualiza settings (admin). A chave so e sobrescrita se enviada.
export async function PUT(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sem permissão." }, { status: guard.status });

  const json = await request.json().catch(() => null);
  const parsed = parseBody(settingsSchema, json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const update: Record<string, unknown> = {};
  if (body.default_min_alert !== undefined)
    update.default_min_alert = body.default_min_alert;
  if (body.email_enabled !== undefined) update.email_enabled = body.email_enabled;
  if (body.alert_from !== undefined)
    update.alert_from = body.alert_from?.trim() || null;
  if (body.alert_emails !== undefined)
    update.alert_emails = body.alert_emails.map((e) => e.trim()).filter(Boolean);
  // Chave: so grava se veio uma string nao vazia.
  if (body.resend_api_key && body.resend_api_key.trim())
    update.resend_api_key = body.resend_api_key.trim();

  const admin = createAdminClient();
  const { error: upErr } = await admin
    .from("app_settings")
    .update(update)
    .eq("id", 1);
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
