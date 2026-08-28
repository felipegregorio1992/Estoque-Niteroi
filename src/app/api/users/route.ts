import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/api-auth";
import { createUserSchema, parseBody } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// GET: lista usuarios (admin)
export async function GET() {
  const guard = await requireAdminApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sem permissão." }, { status: guard.status });

  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  return NextResponse.json({ users: data ?? [] });
}

// POST: cria usuario (admin). Cadastro so por admin.
export async function POST(request: Request) {
  const guard = await requireAdminApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sem permissão." }, { status: guard.status });

  // Rate limit: no maximo 20 criacoes por minuto por IP.
  const rl = rateLimit(`users:${clientIp(request)}`, 20, 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` },
      { status: 429 }
    );

  const json = await request.json().catch(() => null);
  const parsed = parseBody(createUserSchema, json);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const admin = createAdminClient();
  const { data, error: createErr } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { full_name: body.full_name, role: body.role },
  });

  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 });
  }

  if (data.user) {
    await admin
      .from("profiles")
      .update({ role: body.role, full_name: body.full_name, email: body.email })
      .eq("id", data.user.id);
  }

  return NextResponse.json({ ok: true });
}
