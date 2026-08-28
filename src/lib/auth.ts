import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

// Retorna o profile do usuario logado ou redireciona para /login.
export async function requireProfile(): Promise<Profile> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Perfil ainda nao criado pelo trigger (edge case): usa dados minimos.
    return {
      id: user.id,
      email: user.email ?? null,
      full_name: null,
      role: "user",
      created_at: new Date().toISOString(),
    };
  }

  return profile as Profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/");
  return profile;
}
