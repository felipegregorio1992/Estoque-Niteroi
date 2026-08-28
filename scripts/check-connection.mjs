// Testa conexao com o Supabase e o estado do schema.
// Uso: node scripts/check-connection.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const secret = get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, secret, {
  auth: { persistSession: false },
});

const tables = ["profiles", "positions", "count_sessions", "app_settings"];
for (const t of tables) {
  const { data, error } = await supabase.from(t).select("*").limit(2);
  if (error) console.log(`[${t}] ERRO: ${error.message}`);
  else console.log(`[${t}] OK - amostra: ${JSON.stringify(data)}`);
}

const { data: v, error: vErr } = await supabase
  .from("settings_public")
  .select("*")
  .single();
console.log(
  `[settings_public] ${vErr ? "ERRO: " + vErr.message : "OK " + JSON.stringify(v)}`
);
