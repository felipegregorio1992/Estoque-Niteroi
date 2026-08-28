"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setError("E-mail ou senha inválidos.");
      setLoading(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid place-items-center bg-deep px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gold text-deep grid place-items-center font-black text-lg">
            EN
          </div>
          <div className="text-white">
            <strong className="block text-lg leading-tight">Estoque Niterói</strong>
            <small className="text-[11px] tracking-widest text-[#aac1ae]">
              ACESSO RESTRITO
            </small>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-card p-7 grid gap-4"
        >
          <div>
            <h1 className="font-serif text-2xl text-ink m-0">Entrar</h1>
            <p className="text-sm text-muted mt-1">
              Use as credenciais fornecidas pelo administrador.
            </p>
          </div>

          <label className="grid gap-2 text-sm font-bold">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 border border-line rounded-lg px-3 font-normal bg-[#fbfdf9]"
              placeholder="voce@empresa.com"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Senha
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 border border-line rounded-lg px-3 font-normal bg-[#fbfdf9]"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <div className="text-sm text-danger bg-[#f9ece5] rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-lg bg-greenx text-white font-bold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <p className="text-xs text-muted text-center leading-relaxed">
            Novas contas são criadas apenas pelo administrador.
          </p>
        </form>
      </div>
    </div>
  );
}
