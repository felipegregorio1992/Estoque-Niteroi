import PageHeader from "@/components/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import UsuariosClient from "./UsuariosClient";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const me = await requireAdmin();
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRAÇÃO"
        title="Usuários"
        subtitle="Somente o administrador cria e remove contas de acesso."
      />
      <UsuariosClient initialUsers={(data as Profile[]) ?? []} meId={me.id} />
    </>
  );
}
