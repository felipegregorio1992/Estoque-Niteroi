import { createClient } from "@/lib/supabase/server";
import type { Position, PublicSettings, CountSession } from "@/lib/types";

export async function getPositions(): Promise<Position[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("positions")
    .select("*")
    .order("sku", { ascending: true });
  return (data as Position[]) ?? [];
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const supabase = createClient();
  const { data } = await supabase.from("settings_public").select("*").single();
  return (
    (data as PublicSettings) ?? { default_min_alert: 10, email_enabled: false }
  );
}

export async function getSessions(limit = 40): Promise<CountSession[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("count_sessions")
    .select("*")
    .order("applied_at", { ascending: false })
    .limit(limit);
  return (data as CountSession[]) ?? [];
}
