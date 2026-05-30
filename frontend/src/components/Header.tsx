"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useKarma } from "@/state/karma";
import { useDemo } from "@/components/GuidedDemo";

const NAV = [
  { href: "/", label: "Marketplace" },
  { href: "/crear", label: "Crear / Vender" },
  { href: "/contexto", label: "Tu Contexto" },
  { href: "/procedencia", label: "Procedencia" },
  { href: "/muro", label: "Muro de Vetados" },
  { href: "/registrar", label: "Registrar" },
];

export function Header() {
  const pathname = usePathname();
  const { wallet, skulls } = useKarma();
  const { start } = useDemo();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="flex h-20 shrink-0 items-center gap-9 border-b border-line px-10">
      {/* Wordmark */}
      <Link href="/" className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-monad/50 bg-monad/15 text-monad shadow-[0_0_18px_rgba(124,58,237,0.35)]">
          ◎
        </span>
        <span className="font-serif text-3xl font-bold tracking-tight text-white">
          Karma<span className="text-acc">.</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1.5">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors ${
              isActive(n.href)
                ? "border border-monad/40 bg-monad/15 text-white"
                : "text-muted hover:bg-white/5 hover:text-txt"
            }`}
          >
            {n.label}
            {n.href === "/muro" && skulls.length > 0 && (
              <span className="ml-1.5 rounded-full bg-bad/20 px-1.5 py-0.5 font-mono text-[10px] text-bad">
                {skulls.length}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Red + wallet */}
      <div className="ml-auto flex items-center gap-3.5">
        <button
          onClick={start}
          className="flex items-center gap-2 rounded-xl border border-acc/45 bg-gradient-to-b from-acc/20 to-monad/15 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:brightness-110 active:scale-95"
          title="Recorrido narrado de 3 minutos que maneja la app en vivo"
        >
          ▶ Demo guiada
        </button>
        <span className="flex items-center gap-2 rounded-full border border-monad/35 bg-monad/10 px-3.5 py-2 font-mono text-[13px] tracking-wide text-acc">
          <span className="h-2 w-2 rounded-full bg-acc shadow-[0_0_10px_var(--color-acc)]" />
          {wallet.network.toUpperCase()}
        </span>
        <span className="flex items-center gap-2.5 rounded-[10px] border border-line bg-panel px-3.5 py-2 font-mono text-sm text-txt">
          <span className="font-semibold text-acc-2">
            {wallet.balanceUSDC.toLocaleString("es")} USDC
          </span>
          <span className="h-5 w-5 rounded-md bg-gradient-to-br from-monad to-cyan" />
        </span>
      </div>
    </header>
  );
}
