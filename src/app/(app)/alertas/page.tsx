import PageHeader from "@/components/PageHeader";
import AlertasClient from "./AlertasClient";
import { getPositions, getPublicSettings } from "@/lib/data";
import { alertItems, effectiveMin } from "@/lib/stock";

export const dynamic = "force-dynamic";

export default async function AlertasPage() {
  const [positions, settings] = await Promise.all([
    getPositions(),
    getPublicSettings(),
  ]);
  const alerts = alertItems(positions, settings.default_min_alert).map((p) => ({
    ...p,
    _min: effectiveMin(p, settings.default_min_alert),
  }));

  return (
    <>
      <PageHeader
        eyebrow="PRIORIDADES"
        title="Alertas e lista aleatória"
        subtitle="Itens no limite de alerta e amostra aleatória para conferência."
      />
      <AlertasClient alerts={alerts} positions={positions} />
    </>
  );
}
