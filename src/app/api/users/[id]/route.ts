import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/api-auth";

// DELETE: remove um usuario (admin). Nao permite remover a si mesmo.
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sem permissão." }, { status: guard.status });

  if (params.id === guard.userId) {
    return NextResponse.json(
      { error: "Você não pode remover a própria conta." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
