"use client";

import { useState } from "react";
import type { Profile, Role } from "@/lib/types";
import { dateText } from "@/lib/stock";
import { useToast } from "@/components/Toast";

export default function UsuariosClient({
  initialUsers,
  meId,
}: {
  initialUsers: Profile[];
  meId: string;
}) {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>(initialUsers);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [busy, setBusy] = useState(false);

  function genPassword() {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    const pwd = Array.from(arr, (n) => chars[n % chars.length]).join("");
    setPassword(pwd);
    setConfirmPwd(pwd);
    toast("Senha forte gerada. Copie e envie ao usuário.");
  }

  async function refresh() {
    const res = await fetch("/api/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast("A senha deve ter ao menos 6 caracteres.", true);
      return;
    }
    if (password !== confirmPwd) {
      toast("As senhas não conferem.", true);
      return;
    }
    setBusy(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao criar usuário.", true);
      setBusy(false);
      return;
    }
    toast("Usuário criado.");
    setEmail("");
    setFullName("");
    setPassword("");
    setConfirmPwd("");
    setRole("user");
    await refresh();
    setBusy(false);
  }

  async function removeUser(id: string) {
    if (!confirm("Remover este usuário? A conta perde o acesso imediatamente."))
      return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(json.error || "Falha ao remover usuário.", true);
      return;
    }
    toast("Usuário removido.");
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  return (
    <section className="grid grid-cols-[.9fr_1.1fr] gap-5 max-md:grid-cols-1">
      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <h2 className="text-xl m-0">Criar usuário</h2>
        <p className="text-[#6f7d71] leading-relaxed">
          O novo usuário entra com o e-mail e a senha definidos aqui.
        </p>
        <form onSubmit={createUser} className="grid gap-4 mt-4">
          <label className="grid gap-2 text-[13px] font-extrabold">
            Nome
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Nome do operador"
            />
          </label>
          <label className="grid gap-2 text-[13px] font-extrabold">
            E-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="operador@empresa.com"
            />
          </label>
          <label className="grid gap-2 text-[13px] font-extrabold">
            <span className="flex items-center justify-between">
              Senha (mín. 6 caracteres)
              <button
                type="button"
                onClick={genPassword}
                className="text-[#31563b] font-bold underline"
              >
                Gerar senha forte
              </button>
            </span>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="senha inicial"
            />
          </label>
          <label className="grid gap-2 text-[13px] font-extrabold">
            Confirmar senha
            <input
              type="text"
              required
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              className="input"
              placeholder="repita a senha"
            />
          </label>
          <label className="grid gap-2 text-[13px] font-extrabold">
            Papel
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="input"
            >
              <option value="user">Operador</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="rounded-[10px] bg-greenx text-white font-extrabold text-[13px] px-3.5 py-3 disabled:opacity-50"
            >
              {busy ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-line rounded-2xl shadow-card p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl m-0">Contas ativas</h2>
          <span className="bg-[#e8f3e8] text-[#315a3b] rounded-full px-2 py-1.5 text-xs font-extrabold">
            {users.length}
          </span>
        </div>
        <div className="grid gap-2 mt-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2.5 border border-line rounded-xl p-3"
            >
              <div className="min-w-0">
                <b className="truncate block">{u.full_name || u.email}</b>
                <small className="block text-[#758277] mt-0.5 truncate">
                  {u.email} · {u.role === "admin" ? "Administrador" : "Operador"} ·{" "}
                  {dateText(u.created_at)}
                </small>
              </div>
              {u.id !== meId ? (
                <button
                  onClick={() => removeUser(u.id)}
                  className="rounded-[10px] bg-[#f9ece5] text-danger font-extrabold text-[13px] px-3 py-2 whitespace-nowrap"
                >
                  Remover
                </button>
              ) : (
                <span className="text-xs text-[#829083] font-bold whitespace-nowrap">
                  você
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
