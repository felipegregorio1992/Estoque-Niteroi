import PageHeader from "@/components/PageHeader";
import HistoricoClient from "./HistoricoClient";
import { getSessions } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const sessions = await getSessions();
  return (
    <>
      <PageHeader
        eyebrow="RASTREABILIDADE"
        title="Histórico de contagens"
        subtitle="Contagens aplicadas à base. Clique para ver os itens."
      />
      <HistoricoClient sessions={sessions} />
    </>
  );
}
