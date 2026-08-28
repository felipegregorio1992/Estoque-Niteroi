import PageHeader from "@/components/PageHeader";
import ContagemClient from "./ContagemClient";
import { getPositions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ContagemPage() {
  const positions = await getPositions();
  // Mapa leve sku+local -> descricao, para autopreencher.
  const known = positions.map((p) => ({
    sku: p.sku,
    location: p.location,
    description: p.description,
  }));
  return (
    <>
      <PageHeader
        eyebrow="CONTAGEM FÍSICA"
        title="Registrar nova contagem"
        subtitle="A finalização atualiza a quantidade por SKU e local."
      />
      <ContagemClient known={known} />
    </>
  );
}
