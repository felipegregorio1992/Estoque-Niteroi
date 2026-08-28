import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getPositions, getPublicSettings, getSessions } from "@/lib/data";
import { alertItems, computeStats, effectiveMin, fmt } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [positions, settings, sessions] = await Promise.all([
    getPositions(),
    getPublicSettings(),
    getSessions(5),
  ]);
  const stats = computeStats(positions, settings.default_min_alert);
  const alerts = alertItems(positions, settings.default_min_alert).slice(0, 6);

  // Distribuicao de unidades por localizacao (top 8).
  const byLoc = new Map<string, number>();
  for (const p of positions) {
    byLoc.set(p.location, (byLoc.get(p.location) ?? 0) + Number(p.quantity || 0));
  }
  const topLoc = [...byLoc.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxLoc = topLoc[0]?.[1] || 1;

  const metrics = [
    { label: "SKUS CADASTRADOS", value: stats.skus, hint: "itens na base" },
    { label: "POSIÇÕES ATIVAS", value: stats.positions, hint: "locais mapeados" },
    { label: "UNIDADES DISPONÍVEIS", value: stats.units, hint: "saldo consolidado" },
    { label: "ALERTAS", value: stats.alerts, hint: "no limite ou abaixo" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="PAINEL"
        title="Visão geral do estoque"
        subtitle="Base sincronizada no Supabase, acessível a toda a equipe."
      />

      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="bg-card border border-line rounded-2xl shadow-card p-5"
          >
            <label className="text-[11px] tracking-wider text-[#738174] font-extrabold">
              {m.label}
            </label>
            <b className="text-[32px] block mt-2 max-md:text-[25px]">
              {fmt(m.value)}
            </b>
            <span className="text-[#849185] text-xs">{m.hint}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[.8fr_1.2fr] gap-5 mt-5 max-md:grid-cols-1">
        <section className="bg-goldbg border border-[#eeddb9] rounded-2xl p-6">
          <span className="inline-block rounded-full bg-[#f5e5bf] text-[#755425] text-[11px] font-extrabold px-2.5 py-1.5 tracking-wide">
            PRIORIDADE DE CONTAGEM
          </span>
          <h2 className="text-xl mt-3.5 mb-0">Itens no limite de alerta</h2>
          <p className="text-[#6f7d71] leading-relaxed">
            Configure o limite por item ou o padrão global na tela de
            Configurações.
          </p>
          <Link
            href="/alertas"
            className="inline-block mt-2 rounded-[10px] bg-gold text-[#33250f] font-extrabold text-[13px] px-3.5 py-3"
          >
            Ver alertas e lista aleatória
          </Link>
        </section>

        <section className="bg-card border border-line rounded-2xl shadow-card p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl m-0">Ações urgentes</h2>
            <span className="bg-[#fff3da] text-[#7b5622] rounded-full px-2 py-1.5 text-xs font-extrabold">
              {fmt(stats.alerts)}
            </span>
          </div>
          <div className="grid gap-2.5 mt-4 max-h-[410px] overflow-auto scroll-area">
            {alerts.length ? (
              alerts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 justify-between bg-white border border-[#eddcc2] p-3 rounded-xl"
                >
                  <div>
                    <code className="font-extrabold text-[#68491f] text-[13px]">
                      {p.sku}
                    </code>
                    <small className="block text-[#68766b] mt-0.5">
                      {p.location} · limite {effectiveMin(p, settings.default_min_alert)}
                    </small>
                  </div>
                  <span className="bg-[#fff3da] text-[#7b5622] rounded-full px-2 py-1.5 text-xs font-extrabold">
                    {fmt(p.quantity)} un.
                  </span>
                </div>
              ))
            ) : (
              <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-9 text-center">
                Nenhum alerta no momento.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[1.2fr_.8fr] gap-5 mt-5 max-md:grid-cols-1">
        <section className="bg-card border border-line rounded-2xl shadow-card p-6">
          <h2 className="text-xl m-0">Unidades por localização</h2>
          <p className="text-[#6f7d71] leading-relaxed">
            As 8 localizações com maior saldo consolidado.
          </p>
          <div className="grid gap-2.5 mt-4">
            {topLoc.length ? (
              topLoc.map(([loc, qty]) => (
                <div key={loc} className="grid grid-cols-[110px_1fr_60px] items-center gap-3">
                  <span className="text-sm font-bold truncate">{loc}</span>
                  <div className="h-3 rounded-full bg-[#eef3ec] overflow-hidden">
                    <div
                      className="h-full bg-greenx rounded-full"
                      style={{ width: `${Math.max(4, (qty / maxLoc) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right text-sm font-bold text-[#4a5a4d]">
                    {fmt(qty)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[#829083]">Sem dados.</div>
            )}
          </div>
        </section>

        <section className="bg-card border border-line rounded-2xl shadow-card p-6">
          <h2 className="text-xl m-0">Últimas contagens</h2>
          <p className="text-[#6f7d71] leading-relaxed">
            Atividade recente na base.
          </p>
          <div className="grid gap-2 mt-4">
            {sessions.length ? (
              sessions.map((s) => (
                <Link
                  key={s.id}
                  href="/historico"
                  className="flex justify-between gap-2.5 border border-line rounded-xl p-3 hover:bg-[#f7faf6]"
                >
                  <div className="min-w-0">
                    <code className="font-extrabold text-greenx text-[13px]">
                      {s.code}
                    </code>
                    <small className="block text-[#7b897c] mt-0.5">
                      {fmt(s.items.length)} posição(ões)
                    </small>
                  </div>
                </Link>
              ))
            ) : (
              <div className="border border-dashed border-[#d5e0d5] rounded-xl text-[#829083] p-6 text-center">
                Nenhuma contagem ainda.
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
