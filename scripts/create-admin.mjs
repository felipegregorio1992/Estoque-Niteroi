// Cria (ou atualiza) um usuario admin.
// Uso: node scripts/create-admin.mjs email senha "Nome"
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = readFileSync(join(__dirname, "..", ".env.local"), "utf8");
const get = (k) => env.match(new RegExp(`^${k}=(.*)$`, "m"))?.[1]?.trim();

const [email, password, name] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: node scripts/create-admin.mjs email senha "Nome"');
  process.exit(1);
}

const supabase = createClient(
  get("NEXT_PUBLIC_SUPABASE_URL"),
  get("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

// cria usuario ja confirmado
const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: name || "Administrador", role: "admin" },
});

let userId = data?.user?.id;

if (error) {
  if (/already/i.test(error.message)) {
    console.log("Usuario ja existe, buscando id...");
    const { data: list } = await supabase.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
  } else {
    console.error("ERRO ao criar:", error.message);
    process.exit(1);
  }
}

if (!userId) {
  console.error("Nao foi possivel obter o id do usuario.");
  process.exit(1);
}

const { error: upErr } = await supabase
  .from("profiles")
  .update({ role: "admin", full_name: name || "Administrador", email })
  .eq("id", userId);

if (upErr) {
  console.error("ERRO ao promover:", upErr.message);
  process.exit(1);
}

console.log(`Admin pronto: ${email} (id ${userId})`);
