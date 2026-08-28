import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import ConfiguracoesClient from "./ConfiguracoesClient";
import type { Position } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  await requireAdmin();
  const supabase = createClient();

  // Limites por SKU: um representante por SKU (min_alert é igual em todas as
  // posições do mesmo SKU porque o update aplica por SKU).
  const { data: positions } = await supabase
    .from("positions")
    .select("sku, description, min_alert")
    .order("sku", { ascending: true });

  const bySku = new Map<
    string,
    { sku: string; description: string | null; min_alert: number | null }
  >();
  ((positions as Pick<Position, "sku" | "description" | "min_alert">[]) ?? []).forEach(
    (p) => {
      if (!bySku.has(p.sku))
        bySku.set(p.sku, {
          sku: p.sku,
          description: p.description,
          min_alert: p.min_alert,
        });
    }
  );

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRAÇÃO"
        title="Configurações"
        subtitle="Limite de alerta, envio de e-mail e limites por SKU."
      />
      <ConfiguracoesClient skuLimits={[...bySku.values()]} />
    </>
  );
}
