"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const items = role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // Fecha o menu ao trocar de rota (navegação no mobile).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Evita rolar o corpo enquanto o drawer está aberto no mobile.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const brand = (
    <div className="flex gap-2.5 items-center px-2 pb-6 border-b border-white/10">
      <div className="w-[34px] h-[34px] rounded-xl bg-gold text-deep grid place-items-center font-black">
        EN
      </div>
      <div>
        <strong className="text-[15px]">Estoque Niterói</strong>
        <small className="block text-[#aac1ae] text-[10px] tracking-widest mt-0.5">
          {role === "admin" ? "ADMINISTRADOR" : "OPERADOR"}
        </small>
      </div>
    </div>
  );

  const nav = (
    <nav className="pt-5 grid gap-1.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-3 rounded-[10px] text-sm font-bold transition-colors ${
              active
                ? "bg-[#f4f7f1] text-deep"
                : "text-[#cce0ce] hover:bg-[#f4f7f1] hover:text-deep"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const footer = (
    <div className="mt-auto border-t border-white/10 pt-4 px-2 text-xs text-[#aac1ae]">
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
  );

  return (
    <>
      {/* Topbar mobile: aparece só em telas pequenas */}
      <header className="hidden max-md:flex items-center gap-3 bg-deep text-[#e9f3e9] px-4 py-3 sticky top-0 z-40">
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="w-10 h-10 grid place-items-center rounded-lg hover:bg-white/10"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-[30px] h-[30px] rounded-lg bg-gold text-deep grid place-items-center font-black text-sm">
          EN
        </div>
        <strong className="text-[15px]">Estoque Niterói</strong>
      </header>

      {/* Sidebar fixa: desktop/tablet largo */}
      <aside className="w-[265px] flex-none bg-deep text-[#e9f3e9] p-4 pt-6 flex flex-col max-md:hidden">
        {brand}
        {nav}
        {footer}
      </aside>

      {/* Overlay do drawer mobile */}
      {open && (
        <div
          className="hidden max-md:block fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer mobile deslizante */}
      <aside
        className={`hidden max-md:flex fixed inset-y-0 left-0 w-[265px] max-w-[80%] bg-deep text-[#e9f3e9] p-4 pt-6 flex-col z-50 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-lg hover:bg-white/10"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {brand}
        {nav}
        {footer}
      </aside>
    </>
  );
}
