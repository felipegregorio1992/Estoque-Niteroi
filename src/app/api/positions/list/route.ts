import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuthApi } from "@/lib/api-auth";
import type { Position } from "@/lib/types";

// GET: lista paginada e filtrada de posicoes.
// Query params: q (busca), loc (localizacao), page, pageSize, alert=1 (só alertas)
export async function GET(request: Request) {
  const guard = await requireAuthApi();
  if (!guard.ok)
    return NextResponse.json({ error: "Sessão expirada." }, { status: guard.status });

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const loc = url.searchParams.get("loc")?.trim() ?? "";
  const onlyAlert = url.searchParams.get("alert") === "1";
  const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
  const pageSize = Math.min(
    100,
    Math.max(10, Number(url.searchParams.get("pageSize")) || 25)
  );

  const supabase = createClient();

  // Limite global (para o filtro de alerta client-side depois da paginacao base).
  const { data: settings } = await supabase
    .from("settings_public")
    .select("default_min_alert")
    .single();
  const globalMin = settings?.default_min_alert ?? 10;

  let query = supabase.from("positions").select("*", { count: "exact" });

  if (q) {
    // busca por sku OU descricao
    query = query.or(`sku.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (loc) {
    query = query.ilike("location", `%${loc}%`);
  }

  query = query
    .order("sku", { ascending: true })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let rows = (data as Position[]) ?? [];
  // Filtro de alerta aplicado sobre a pagina (usa min_alert ou global).
  if (onlyAlert) {
    rows = rows.filter((p) => p.quantity <= (p.min_alert ?? globalMin));
  }

  return NextResponse.json({
    rows,
    total: count ?? 0,
    page,
    pageSize,
    globalMin,
  });
}
