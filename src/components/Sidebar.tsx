"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";
import { signOut } from "@/app/(app)/actions";

const NAV = [
  { href: "/", label: "Visão geral", letter: "V" },
  { href: "/itens", label: "Itens da base", letter: "B" },
  { href: "/consultar", label: "Consultar SKU", letter: "C" },
  { href: "/contagem", label: "Nova contagem", letter: "N" },
  { href: "/alertas", label: "Alertas e lista", letter: "A" },
  { href: "/importar", label: "Importar base", letter: "I" },
  { href: "/historico", label: "Histórico", letter: "H" },
];

const ADMIN_NAV = [
  { href: "/usuarios", label: "Usuários", letter: "U" },
  { href: "/configuracoes", label: "Configurações", letter: "G" },
];

export default function Sidebar({
  role,
  email,
}: {
  role: Role;
  email: string | null;
}) {
  const pathname = usePathname();
  const items = role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-[265px] flex-none bg-deep text-[#e9f3e9] p-4 pt-6 flex flex-col max-md:w-[68px] max-md:px-2">
      <div className="flex gap-2.5 items-center px-2 pb-6 border-b border-white/10">
        <div className="w-[34px] h-[34px] rounded-xl bg-gold text-deep grid place-items-center font-black">
          EN
        </div>
        <div className="max-md:hidden">
          <strong className="text-[15px]">Estoque Niterói</strong>
          <small className="block text-[#aac1ae] text-[10px] tracking-widest mt-0.5">
            {role === "admin" ? "ADMINISTRADOR" : "OPERADOR"}
          </small>
        </div>
      </div>

      <nav className="pt-5 grid gap-1.5">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-3 rounded-[10px] text-sm font-bold transition-colors max-md:text-center max-md:px-1 ${
                active
                  ? "bg-[#f4f7f1] text-deep"
                  : "text-[#cce0ce] hover:bg-[#f4f7f1] hover:text-deep"
              }`}
            >
              <span className="max-md:hidden">{item.label}</span>
              <span className="hidden max-md:inline">{item.letter}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4 px-2 text-xs text-[#aac1ae] max-md:hidden">
        <strong className="text-white block truncate">{email}</strong>
        <form action={signOut}>
          <button
            type="submit"
            className="mt-3 text-[#ffd9c7] hover:text-white font-bold"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
