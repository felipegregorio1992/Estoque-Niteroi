import PageHeader from "@/components/PageHeader";
import ImportarClient from "./ImportarClient";

export const dynamic = "force-dynamic";

export default function ImportarPage() {
  return (
    <>
      <PageHeader
        eyebrow="BASE"
        title="Importar planilha"
        subtitle="Substitua a base por uma planilha Excel ou aplique um PDF de contagem."
      />
      <ImportarClient />
    </>
  );
}
