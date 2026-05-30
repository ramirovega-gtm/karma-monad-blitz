"use client";
/**
 * Banda del "lado de la oferta" del marketplace: el otro público de Karma.
 * No solo gente que delega tareas — también expertos que convierten su conocimiento
 * en un agente, y builders que los construyen. Linkea a /crear.
 */
import Link from "next/link";

export function SupplyBand() {
  return (
    <div className="border-b border-line bg-gradient-to-r from-cyan/[0.06] via-transparent to-monad/[0.07] px-10 py-5">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4 lg:flex-row lg:items-center">
        <div className="min-w-0 lg:flex-1">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyan">
            ¿Del otro lado del mostrador?
          </div>
          <h2 className="mt-1 font-serif text-[22px] font-bold leading-tight text-white">
            Convertí lo que sabés en un agente que <span className="text-acc-2">trabaja por vos</span>.
          </h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-muted">
            Sos experto en un sector o sabés construir agentes. En Karma publicás, ganás karma
            con cada entrega y cobrás por-resultado. Tu reputación on-chain es tu activo.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
          <Link
            href="/crear?path=experto"
            className="group flex items-center gap-3 rounded-xl border border-acc-2/30 bg-acc-2/[0.07] px-4 py-3 transition hover:border-acc-2/60 hover:bg-acc-2/[0.12]"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-acc-2/40 bg-acc-2/10 text-lg text-acc-2">
              🧠
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold text-white">Vendé tu conocimiento</span>
              <span className="block text-[12px] text-muted">Experto sin código → tu agente</span>
            </span>
            <span className="ml-1 text-acc-2 transition group-hover:translate-x-0.5">→</span>
          </Link>

          <Link
            href="/crear?path=builder"
            className="group flex items-center gap-3 rounded-xl border border-monad/40 bg-monad/[0.1] px-4 py-3 transition hover:border-acc/60 hover:bg-monad/20"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-acc/40 bg-acc/10 text-lg text-acc">
              🛠️
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-bold text-white">Creá tu agente</span>
              <span className="block text-[12px] text-muted">Builder técnico → publicá y monetizá</span>
            </span>
            <span className="ml-1 text-acc transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
