import { createAdminClient } from "@/lib/supabase/admin";
import type { Position } from "@/lib/types";
import { alertItems, effectiveMin } from "@/lib/stock";

// Envia o alerta de estoque baixo por email via Resend, se estiver configurado.
// Le a chave do banco (nunca do cliente). Retorna um resumo do que aconteceu.
export async function sendLowStockEmail(): Promise<{
  ok: boolean;
  message: string;
}> {
  const admin = createAdminClient();

  const { data: settings } = await admin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!settings) return { ok: false, message: "Configurações não encontradas." };
  if (!settings.email_enabled)
    return { ok: false, message: "Envio de e-mail desativado." };
  if (!settings.resend_api_key)
    return { ok: false, message: "Chave do Resend não configurada." };
  if (!settings.alert_from)
    return { ok: false, message: "Remetente (alert_from) não configurado." };
  if (!settings.alert_emails?.length)
    return { ok: false, message: "Nenhum destinatário configurado." };

  const { data: positions } = await admin.from("positions").select("*");
  const list = alertItems(
    (positions as Position[]) ?? [],
    settings.default_min_alert
  );

  if (!list.length)
    return { ok: true, message: "Sem itens em alerta. Nada a enviar." };

  const rows = list
    .slice(0, 200)
    .map(
      (p) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${p.sku}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee">${p.location}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${p.quantity}</td>` +
        `<td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${effectiveMin(
          p,
          settings.default_min_alert
        )}</td></tr>`
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#163324">
      <h2>Estoque Niterói — Alerta de estoque baixo</h2>
      <p>${list.length} posição(ões) no limite de alerta ou abaixo.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <thead>
          <tr style="background:#f2f6f0">
            <th style="padding:6px 10px;text-align:left">SKU</th>
            <th style="padding:6px 10px;text-align:left">Local</th>
            <th style="padding:6px 10px;text-align:right">Qtd</th>
            <th style="padding:6px 10px;text-align:right">Limite</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.resend_api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: settings.alert_from,
      to: settings.alert_emails,
      subject: `Estoque Niterói: ${list.length} item(ns) em alerta`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      message: `Falha no envio (Resend): ${res.status} ${detail.slice(0, 200)}`,
    };
  }

  return { ok: true, message: `E-mail enviado para ${settings.alert_emails.length} destinatário(s).` };
}
