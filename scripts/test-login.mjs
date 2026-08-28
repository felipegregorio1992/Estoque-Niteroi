// Simula o fluxo do app: login com a publishable key e leitura respeitando RLS.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const supabase = createClient(
  get("NEXT_PUBLIC_SUPABASE_URL"),
  get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  { auth: { persistSession: false } }
);

const [email, password] = process.argv.slice(2);

const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email,
  password,
});
if (authErr) {
  console.error("LOGIN FALHOU:", authErr.message);
  process.exit(1);
}
console.log("Login OK. user:", auth.user.email);

const { data: prof } = await supabase
  .from("profiles")
  .select("role, full_name")
  .eq("id", auth.user.id)
  .single();
console.log("Profile:", JSON.stringify(prof));

const { data: pos, error: posErr, count } = await supabase
  .from("positions")
  .select("sku", { count: "exact", head: true });
console.log(
  posErr ? "positions ERRO: " + posErr.message : `positions visiveis (RLS): ${count}`
);

const { data: pub } = await supabase.from("settings_public").select("*").single();
console.log("settings_public:", JSON.stringify(pub));

// tenta ler app_settings (deve ser permitido pois e admin)
const { data: st, error: stErr } = await supabase
  .from("app_settings")
  .select("default_min_alert")
  .single();
console.log(
  stErr ? "app_settings (admin) ERRO: " + stErr.message : "app_settings (admin) OK"
);
