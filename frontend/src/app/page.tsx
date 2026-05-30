"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentCard } from "@/components/AgentCard";
import { CATEGORIES, SKULL_AGENT_ID } from "@/lib/catalog";
import type { CategoryId } from "@/lib/types";
import { useKarma } from "@/state/karma";

type PriceModel = "all" | "mes" | "tarea";
type RiskFilter = "all" | "low" | "high";
type Sort = "featured" | "karma" | "rating" | "used" | "price";

export default function MarketplacePage() {
  const router = useRouter();
  const { agents, vetar, skulls, hireAtlas } = useKarma();
  const [cat, setCat] = useState<CategoryId>("all");
  const [q, setQ] = useState("");
  const [priceModel, setPriceModel] = useState<PriceModel>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [officialOnly, setOfficialOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("featured");

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: agents.length };
    for (const a of agents) m[a.category] = (m[a.category] ?? 0) + 1;
    return m;
  }, [agents]);

  const list = useMemo(() => {
    let l = agents.filter((a) => (cat === "all" ? true : a.category === cat));
    if (q.trim()) {
      const s = q.toLowerCase();
      l = l.filter(
        (a) =>
          a.name.toLowerCase().includes(s) ||
          a.svc.toLowerCase().includes(s) ||
          a.author.toLowerCase().includes(s),
      );
    }
    if (priceModel !== "all") l = l.filter((a) => a.unit === priceModel);
    if (risk === "low") l = l.filter((a) => a.risk <= 2);
    if (risk === "high") l = l.filter((a) => a.risk >= 4);
    if (officialOnly) l = l.filter((a) => a.official);
    if (sort === "karma") l = [...l].sort((a, b) => b.karma - a.karma);
    else if (sort === "rating") l = [...l].sort((a, b) => b.stars - a.stars);
    else if (sort === "used") l = [...l].sort((a, b) => b.deals - a.deals);
    else if (sort === "price") l = [...l].sort((a, b) => a.price - b.price);
    return l;
  }, [agents, cat, q, priceModel, risk, officialOnly, sort]);

  const onDelegar = () => {
    hireAtlas();
    router.push("/procedencia");
  };
  const designerVetado = skulls.includes(SKULL_AGENT_ID);

  return (
    <div className="h-full overflow-y-auto">
      {/* Hero band */}
      <div className="border-b border-line px-10 pb-7 pt-7">
        <div className="mx-auto max-w-[1500px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Tareas recurrentes, en automático · para siempre
          </div>
          <h1 className="mt-2 text-[40px] font-bold leading-none tracking-tight text-white">
            Delegá lo que <span className="text-acc">odiás</span>.
          </h1>
          <div className="mt-5 flex max-w-3xl items-center gap-2.5 rounded-2xl border border-line bg-panel px-2 py-2 pl-5 transition focus-within:border-acc focus-within:shadow-[0_0_0_4px_rgba(124,58,237,0.14)]">
            <span className="text-muted">⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué querés dejar de hacer?"
              className="flex-1 bg-transparent text-[16px] text-txt outline-none placeholder:text-faint"
            />
            <button
              onClick={onDelegar}
              className="rounded-xl bg-gradient-to-b from-acc to-monad px-6 py-2.5 text-[15px] font-semibold text-white transition hover:brightness-110 active:scale-95"
              title="Atlas orquesta la tarea contratando agentes por vos"
            >
              Delegar
            </button>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="mx-auto flex max-w-[1500px] gap-0">
        {/* Sidebar de filtros (Apify) */}
        <aside className="w-[272px] shrink-0 border-r border-line px-6 py-7">
          <FilterSec title="Categorías">
            <ul className="flex flex-col gap-0.5">
              {CATEGORIES.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => setCat(c.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                      cat === c.id
                        ? "border border-monad/35 bg-monad/14 text-white"
                        : "border border-transparent text-muted hover:bg-white/[0.04] hover:text-txt"
                    }`}
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-[13px]" style={{ color: c.color }}>
                      {c.icon}
                    </span>
                    <span className="flex-1 text-left">{c.label}</span>
                    <span className={`font-mono text-[12px] ${cat === c.id ? "text-acc" : "text-faint"}`}>
                      {counts[c.id] ?? 0}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </FilterSec>

          <FilterSec title="Modelo de precio">
            <Chips
              value={priceModel}
              onChange={(v) => setPriceModel(v as PriceModel)}
              options={[["all", "Todos"], ["tarea", "Por tarea"], ["mes", "Suscripción"]]}
            />
          </FilterSec>

          <FilterSec title="Nivel de riesgo">
            <Chips
              value={risk}
              onChange={(v) => setRisk(v as RiskFilter)}
              options={[["all", "Todos"], ["low", "Bajo"], ["high", "Maneja plata"]]}
            />
          </FilterSec>

          <label className="mt-2 flex cursor-pointer items-center gap-2.5">
            <button
              type="button"
              onClick={() => setOfficialOnly((v) => !v)}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${officialOnly ? "bg-acc-2" : "bg-line"}`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${officialOnly ? "translate-x-5" : ""}`}
              />
            </button>
            <span className="text-sm text-muted">Solo oficiales</span>
          </label>
        </aside>

        {/* Content */}
        <section className="min-w-0 flex-1 px-8 pb-28 pt-6">
          <div className="flex items-baseline justify-between">
            <div className="font-mono text-sm text-muted">
              <b className="text-white">{list.length}</b> agentes disponibles
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              Ordenar por
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border border-line bg-panel px-3 py-2 font-semibold text-white outline-none hover:border-acc"
              >
                <option value="featured">Destacados</option>
                <option value="karma">Karma Score</option>
                <option value="rating">Mejor calificados</option>
                <option value="used">Más usados</option>
                <option value="price">Menor precio</option>
              </select>
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-[18px] lg:grid-cols-2 2xl:grid-cols-3">
            {list.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </section>
      </div>

      {/* Trigger demo (veto) */}
      {!designerVetado && (
        <button
          onClick={() => vetar(SKULL_AGENT_ID)}
          className="fixed bottom-7 right-10 z-20 flex items-center gap-2.5 rounded-xl border border-bad/50 bg-gradient-to-b from-bad/25 to-bad/10 px-5 py-3.5 font-mono text-sm font-semibold text-white shadow-[0_14px_40px_rgba(0,0,0,0.5)] transition hover:bg-bad/30 hover:shadow-[0_0_26px_rgba(239,68,68,0.3)]"
          title="Demo: Degen-4 vacía la cartera de un cliente → calavera + slash on-chain"
        >
          <span className="text-base">⚡</span> Simular fallo de entrega
        </button>
      )}
    </div>
  );
}

function FilterSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-7">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-wider text-faint">
        {title}
      </div>
      {children}
    </div>
  );
}

function Chips({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, l]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`rounded-lg border px-3 py-1.5 text-[13px] transition ${
            value === v
              ? "border-monad bg-monad text-white"
              : "border-line bg-ink text-muted hover:border-acc hover:text-txt"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
