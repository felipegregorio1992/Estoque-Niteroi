"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/Toast";

interface SkuLimit {
  sku: string;
  description: string | null;
  min_alert: number | null;
}

interface SettingsData {
  default_min_alert: number;
  email_enabled: boolean;
  alert_from: string;
  alert_emails: string[];
  has_key: boolean;
}

export default function ConfiguracoesClient({
  skuLimits,
}: {
  skuLimits: SkuLimit[];
}) {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [defaultMin, setDefaultMin] = useState("10");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [alertFrom, setAlertFrom] = useState("");
  const [emails, setEmails] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: SettingsData) => {
        setSettings(d);
        setDefaultMin(String(d.default_min_alert));
        setEmailEnabled(d.email_enabled);
        setAlertFrom(d.alert_from || "");
        setEmails((d.alert_emails || []).join(", "));
      })
      .catch(() => toast("Falha ao carregar configurações.", true));
  }, [toast]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      default_min_alert: Number(defaultMin),
      email_enabled: emailEnabled,
      alert_from: alertFrom,
      alert_emails: emails
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    };
    if (apiKey.trim()) payload.resend_api_key = apiKey.trim();

    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao salvar.", true);
      setSaving(false);
      return;
    }
    toast("Configurações salvas.");
    setApiKey("");
    setSettings((s) => (s ? { ...s, has_key: s.has_key || Boolean(payload.resend_api_key) } : s));
    setSaving(false);
  }

  async function testEmail() {
    setSending(true);
    const res = await fetch("/api/alerts/send", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    toast(json.message || (res.ok ? "Enviado." : "Falha no envio."), !res.ok);
    setSending(false);
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-md:grid-cols-1">
        <form
          onSubmit={saveSettings}
          className="bg-card border border-line rounded-2xl shadow-card p-6 grid gap-4"
        >
          <div>
            <h2 className="text-xl m-0">Limite de alerta</h2>
            <p className="text-[#6f7d71] leading-relaxed">
              Padrão aplicado aos itens sem limite próprio. Avisa quando a
              quantidade fica igual ou abaixo.
            </p>
          </div>
          <label className="grid gap-2 text-[13px] font-extrabold max-w-[200px]">
            Limite global padrão
            <input
              type="number"
              min={0}
              value={defaultMin}
              onChange={(e) => setDefaultMin(e.target.value)}
              className="input"
            />
          </label>

          <hr className="border-line" />

          <div>
            <h2 className="text-xl m-0">Aviso por e-mail</h2>
            <p className="text-[#6f7d71] leading-relaxed">
              Cadastre a chave do Resend e os destinatários. O alerta em tela
              funciona sempre; o e-mail é opcional.
            </p>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-bold">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="w-4 h-4"
            />
            Ativar envio por e-mail
          </label>

          <label className="grid gap-2 text-[13px] font-extrabold">
            Remetente (from) — precisa ser de um domínio verificado no Resend
            <input
              value={alertFrom}
              onChange={(e) => setAlertFrom(e.target.value)}
              className="input"
              placeholder="Estoque Niterói <alertas@seudominio.com>"
            />
          </label>

          <label className="grid gap-2 text-[13px] font-extrabold">
            Destinatários (separe por vírgula)
            <input
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              className="input"
              placeholder="gerente@empresa.com, estoque@empresa.com"
            />
          </label>

          <label className="grid gap-2 text-[13px] font-extrabold">
            Chave da API do Resend{" "}
            {settings?.has_key && (
              <span className="text-[#315a3b] font-bold">
                (uma chave já está salva — preencha só para trocar)
              </span>
            )}
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input"
              placeholder="re_..."
              autoComplete="off"
            />
          </label>

          <div className="flex justify-between items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={testEmail}
              disabled={sending}
              className="rounded-[10px] bg-[#f0f5ee] text-[#31563b] border border-line font-extrabold text-[13px] px-3.5 py-3 disabled:opacity-50"
            >
              {sending ? "Enviando..." : "Testar envio agora"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3 disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </form>

        <SkuLimitsPanel skuLimits={skuLimits} />
      </div>
    </div>
  );
}

function SkuLimitsPanel({ skuLimits }: { skuLimits: SkuLimit[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<SkuLimit[]>(skuLimits);
  const [savingSku, setSavingSku] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter(
          (r) =>
            r.sku.toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q)
        )
      : rows;
    return base.slice(0, 60);
  }, [query, rows]);

  async function saveSku(sku: string, value: string) {
    setSavingSku(sku);
    const res = await fetch("/api/limits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, min_alert: value === "" ? null : Number(value) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao salvar limite.", true);
    } else {
      toast(`Limite do SKU ${sku} atualizado.`);
      setRows((prev) =>
        prev.map((r) =>
          r.sku === sku
            ? { ...r, min_alert: value === "" ? null : Number(value) }
            : r
        )
      );
    }
    setSavingSku(null);
  }

  return (
    <div className="bg-card border border-line rounded-2xl shadow-card p-6">
      <h2 className="text-xl m-0">Limite por SKU</h2>
      <p className="text-[#6f7d71] leading-relaxed">
        Deixe vazio para usar o padrão global. O valor vale para todos os locais
        do SKU.
      </p>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por SKU ou descrição"
        className="input w-full mt-3"
      />
      <div className="grid gap-2 mt-4 max-h-[520px] overflow-auto scroll-area">
        {filtered.map((r) => (
          <div
            key={r.sku}
            className="flex items-center justify-between gap-2.5 border border-line rounded-xl p-3"
          >
            <div className="min-w-0">
              <code className="font-extrabold text-[#245137]">{r.sku}</code>
              <small className="block text-[#758277] mt-0.5 truncate">
                {r.description || "Sem descrição"}
              </small>
            </div>
            <input
              type="number"
              min={0}
              defaultValue={r.min_alert ?? ""}
              placeholder="padrão"
              disabled={savingSku === r.sku}
              onBlur={(e) => {
                const v = e.target.value;
                const current = r.min_alert ?? "";
                if (String(current) !== v) saveSku(r.sku, v);
              }}
              className="w-24 h-9 border border-line rounded-lg text-right px-2 disabled:opacity-50"
            />
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
            Nenhum SKU encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
