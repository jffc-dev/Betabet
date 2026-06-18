"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Menu, Trophy, X } from "lucide-react";

const links = [
  { href: "/", label: "Predicciones", icon: ListChecks },
  { href: "/leaderboard", label: "Tabla de posiciones", icon: Trophy },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Bloquear el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="-ml-1.5 rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
      >
        <Menu className="size-5" />
      </button>

      {/* Capa de fondo */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 max-w-[80%] flex-col border-r border-neutral-800 bg-neutral-950 transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-neutral-800/80 px-4">
          <span className="text-lg font-bold tracking-tight text-emerald-400">
            BetaBet
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="-mr-1.5 rounded-lg p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-neutral-800 text-emerald-400"
                    : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
