import PageHeader from "@/components/PageHeader";
import LookupClient from "./LookupClient";
import { getPositions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ConsultarPage() {
  const positions = await getPositions();
  return (
    <>
      <PageHeader
        eyebrow="CONSULTA RÁPIDA"
        title="Localizar produto"
        subtitle="Digite ou cole o SKU e pressione Enter."
      />
      <LookupClient positions={positions} />
    </>
  );
}
