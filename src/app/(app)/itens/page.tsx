import PageHeader from "@/components/PageHeader";
import ItensClient from "./ItensClient";
import { getPublicSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const settings = await getPublicSettings();
  return (
    <>
      <PageHeader
        eyebrow="BASE"
        title="Itens da base"
        subtitle="Busque, filtre, edite, cadastre e exporte posições do estoque."
      />
      <ItensClient globalMin={settings.default_min_alert} />
    </>
  );
}
