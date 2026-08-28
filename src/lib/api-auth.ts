import { createClient } from "@/lib/supabase/server";

export interface AuthContext {
  ok: boolean;
  status: number;
  userId?: string;
  role?: "user" | "admin";
}

export async function getAuthContext(): Promise<AuthContext> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    ok: true,
    status: 200,
    userId: user.id,
    role: (profile?.role as "user" | "admin") ?? "user",
  };
}

export async function requireAuthApi(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  return ctx;
}

export async function requireAdminApi(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx.ok) return ctx;
  if (ctx.role !== "admin") return { ok: false, status: 403 };
  return ctx;
}
