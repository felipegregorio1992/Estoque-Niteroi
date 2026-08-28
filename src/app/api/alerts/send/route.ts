import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/api-auth";
import { sendLowStockEmail } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Dispara o envio do e-mail de alerta de estoque baixo.
// Autorizado de duas formas:
//  1) Admin logado (botao "Testar envio" na tela de Configuracoes).
//  2) Header Authorization: Bearer <CRON_SECRET> (cron da Vercel).
async function authorize(request: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth === `Bearer ${secret}`) return true;
  }
  const guard = await requireAdminApi();
  return guard.ok;
}

export async function POST(request: Request) {
  // Rate limit: no maximo 10 envios por minuto por IP.
  const rl = rateLimit(`alerts:${clientIp(request)}`, 10, 60_000);
  if (!rl.ok)
    return NextResponse.json(
      { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` },
      { status: 429 }
    );

  if (!(await authorize(request)))
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const result = await sendLowStockEmail();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

// GET usado pelo cron da Vercel (chamadas de cron sao GET).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Sem permissão." }, { status: 401 });

  const result = await sendLowStockEmail();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
