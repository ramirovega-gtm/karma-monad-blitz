"use client";
/**
 * /crear — el lado de la OFERTA de Karma. Dos públicos:
 *  - Experto no-técnico: convierte su conocimiento vertical en un agente (con tutoriales,
 *    matchmaking con un builder, o que Atlas le arme el borrador).
 *  - Builder técnico: publica su agente directo.
 * Publicar es simulado client-side (publishAgent) → el agente aparece en el marketplace.
 */
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AgentCard } from "@/components/AgentCard";
import { AGENTS, CATEGORIES } from "@/lib/catalog";
import { ratingOf, tierOf, usd } from "@/lib/format";
import type { Agent, CategoryId, PriceUnit } from "@/lib/types";
import { useKarma, type PublishDraft } from "@/state/karma";

const COLLATERAL_BY_RISK: Record<number, number> = { 1: 480, 2: 1400, 3: 2400, 4: 9500, 5: 18000 };
const VERTICALS = CATEGORIES.filter((c) => c.id !== "all");

const ACADEMY = [
  { ic: "①", title: "Armá tu primer agente", desc: "De cero a publicado en 20 min. Sin escribir código.", min: "20 min" },
  { ic: "②", title: "Empaquetá tu conocimiento vertical", desc: "Cómo convertir lo que sabés en instrucciones que un agente ejecuta.", min: "35 min" },
  { ic: "③", title: "Colateral y reputación 101", desc: "Por qué bondeás, cómo sube tu karma y qué pasa si fallás.", min: "15 min" },
];

const BUILD_OPTS = [
  { id: "tutoriales", ic: "📚", title: "Con tutoriales", desc: "Seguís la Academia y lo armás vos, paso a paso." },
  { id: "matchmaking", ic: "🤝", title: "Con un builder", desc: "Te matcheamos con alguien técnico que lo construye por vos." },
  { id: "atlas", ic: "✦", title: "Atlas te arma el borrador", desc: "Describís el objetivo y Atlas propone una primera versión." },
] as const;

function previewAgent(d: PublishDraft): Agent {
  const karma = 600;
  return {
    id: -1, slug: "preview", onchain: false, kind: "agent",
    name: d.name.trim() || "Mi Agente", author: d.author.trim() || "vos.eth",
    verified: false, star: true, tagline: "Tu agente",
    category: d.category === "all" ? "ventas" : d.category,
    svc: d.svc.trim() || "Tarea recurrente automatizada.",
    price: d.price > 0 ? d.price : 5, unit: d.unit, recurring: d.unit === "mes",
    stars: 5.0, users: 0, success: 100, deals: 0, karma,
    collateral: COLLATERAL_BY_RISK[d.risk] ?? 1400, risk: d.risk,
    riskLabel: d.risk >= 5 ? "Maneja tu plata" : d.risk >= 4 ? "Toca tu cartera" : null,
    medals: [], tier: tierOf(karma), rating: ratingOf(karma),
  };
}

export default function CrearPage() {
  return (
    <Suspense fallback={null}>
      <CrearInner />
    </Suspense>
  );
}

function CrearInner() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<"experto" | "builder">(
    sp.get("path") === "builder" ? "builder" : "experto",
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-line bg-gradient-to-r from-cyan/[0.06] to-monad/[0.07] px-10 py-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan">
            El otro lado del mercado
          </div>
          <h1 className="mt-2 font-serif text-[38px] font-bold leading-none text-white">
            Convertí tu conocimiento en un <span className="text-acc-2">agente</span>.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-muted">
            No hace falta saber programar. Si sos experto en algo, lo empaquetás como un agente
            que trabaja por-resultado, gana karma con cada entrega y te genera ingresos.
          </p>

          <div className="mt-6 inline-flex rounded-xl border border-line bg-panel p-1">
            <TabBtn active={tab === "experto"} onClick={() => setTab("experto")}>
              🧠 Soy experto (sin código)
            </TabBtn>
            <TabBtn active={tab === "builder"} onClick={() => setTab("builder")}>
              🛠️ Soy builder (técnico)
            </TabBtn>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-10 py-8">
        {tab === "experto" ? <ExpertoWizard /> : <BuilderForm />}
        <Academy />
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-gradient-to-b from-acc to-monad text-white" : "text-muted hover:text-txt"
      }`}
    >
      {children}
    </button>
  );
}

// ───────────────────────── Experto (wizard) ─────────────────────────

function ExpertoWizard() {
  const { publishAgent } = useKarma();
  const [wstep, setWstep] = useState(0);
  const [published, setPublished] = useState<Agent | null>(null);
  const [draft, setDraft] = useState<PublishDraft>({
    name: "", author: "", category: "impuestos", svc: "", price: 8, unit: "mes", risk: 1, builtBy: "tutoriales",
  });
  const up = (p: Partial<PublishDraft>) => setDraft((d) => ({ ...d, ...p }));

  if (published) return <PublishedPanel agent={published} />;

  const STEPS = ["Tu vertical", "Qué resolvés", "Cómo lo armás", "Publicar"];

  return (
    <div>
      <Stepper steps={STEPS} current={wstep} />

      {wstep === 0 && (
        <Section title="¿En qué sos experto?" hint="Elegí el sector donde tu conocimiento vale.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VERTICALS.map((c) => (
              <button
                key={c.id}
                onClick={() => { up({ category: c.id as CategoryId }); setWstep(1); }}
                className={`flex items-center gap-3 rounded-xl border px-4 py-4 text-left transition ${
                  draft.category === c.id ? "border-acc bg-acc/10" : "border-line bg-panel hover:border-acc/50"
                }`}
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-base" style={{ color: c.color }}>
                  {c.icon}
                </span>
                <span className="text-sm font-semibold text-white">{c.label}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {wstep === 1 && (
        <Section title="¿Qué tarea resuelve tu agente?" hint="Describilo como se lo explicarías a un cliente.">
          <div className="grid gap-3">
            <input className="input" placeholder="Nombre del agente (ej. Contador-Pyme)" value={draft.name} onChange={(e) => up({ name: e.target.value })} />
            <input className="input" placeholder="Tu nombre / autor (ej. estudio-lopez.eth)" value={draft.author} onChange={(e) => up({ author: e.target.value })} />
            <textarea className="input min-h-[90px]" placeholder="Qué hace, por vos, todos los meses…" value={draft.svc} onChange={(e) => up({ svc: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-muted">
                Precio (USDC)
                <input type="number" className="input mt-1" value={draft.price} onChange={(e) => up({ price: Number(e.target.value) })} />
              </label>
              <label className="text-sm text-muted">
                Modelo
                <select className="input mt-1" value={draft.unit} onChange={(e) => up({ unit: e.target.value as PriceUnit })}>
                  <option value="mes">Suscripción / mes</option>
                  <option value="tarea">Por tarea</option>
                </select>
              </label>
            </div>
            <label className="text-sm text-muted">
              Riesgo de la tarea (define tu colateral)
              <select className="input mt-1" value={draft.risk} onChange={(e) => up({ risk: Number(e.target.value) })}>
                <option value={1}>1 · No toca plata</option>
                <option value={2}>2 · Datos / outreach</option>
                <option value={3}>3 · Compliance</option>
                <option value={4}>4 · Toca tu cartera</option>
                <option value={5}>5 · Maneja tu plata</option>
              </select>
              <span className="mt-1 block font-mono text-[12px] text-acc-2">
                🔒 Colateral inicial: {usd(COLLATERAL_BY_RISK[draft.risk] ?? 1400)}
              </span>
            </label>
          </div>
          <NavRow onBack={() => setWstep(0)} onNext={() => setWstep(2)} />
        </Section>
      )}

      {wstep === 2 && (
        <Section title="¿Cómo lo construimos?" hint="No estás solo: tres caminos según cuánto querés meter mano.">
          <div className="grid gap-3 sm:grid-cols-3">
            {BUILD_OPTS.map((o) => (
              <button
                key={o.id}
                onClick={() => up({ builtBy: o.id })}
                className={`flex flex-col gap-2 rounded-xl border p-4 text-left transition ${
                  draft.builtBy === o.id ? "border-acc bg-acc/10" : "border-line bg-panel hover:border-acc/50"
                }`}
              >
                <span className="text-2xl">{o.ic}</span>
                <span className="text-[15px] font-bold text-white">{o.title}</span>
                <span className="text-[12.5px] text-muted">{o.desc}</span>
              </button>
            ))}
          </div>

          {draft.builtBy === "matchmaking" && <Matchmaking />}

          <NavRow onBack={() => setWstep(1)} onNext={() => setWstep(3)} />
        </Section>
      )}

      {wstep === 3 && (
        <Section title="Así se va a ver en el marketplace" hint="Tu agente arranca en karma 600 (A) y sube transaccionando.">
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            <div className="pointer-events-none max-w-[380px]">
              <AgentCard agent={previewAgent(draft)} />
            </div>
            <div className="flex flex-col gap-3">
              <Fact k="Construido con" v={BUILD_OPTS.find((o) => o.id === draft.builtBy)?.title ?? "—"} />
              <Fact k="Vertical" v={VERTICALS.find((c) => c.id === draft.category)?.label ?? "—"} />
              <Fact k="Colateral bloqueado" v={usd(COLLATERAL_BY_RISK[draft.risk] ?? 1400)} />
              <Fact k="Karma inicial" v="600 · A" />
              <button
                onClick={() => setPublished(publishAgent(draft))}
                className="mt-2 rounded-xl bg-gradient-to-b from-acc-2 to-green px-5 py-3.5 text-[15px] font-bold text-[#04110b] transition hover:brightness-110 active:scale-95"
              >
                Publicar agente →
              </button>
              <button onClick={() => setWstep(2)} className="text-sm text-muted hover:text-txt">
                ← volver
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

function Matchmaking() {
  const builders = useMemo(
    () => AGENTS.filter((a) => a.kind === "agent" && a.verified).slice(0, 3),
    [],
  );
  return (
    <div className="mt-4 rounded-xl border border-cyan/30 bg-cyan/[0.06] p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-cyan">
        Te matcheamos con un builder
      </div>
      <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
        {builders.map((b) => (
          <div key={b.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gradient-to-br from-monad to-cyan text-[11px] font-bold text-white">
              {b.author.slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-white">{b.author}</span>
              <span className="block font-mono text-[11px] text-acc-2">karma {b.karma}</span>
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[12.5px] text-muted">
        Le pasás tu conocimiento, ellos lo convierten en el agente. Comparten karma de cada entrega.
      </p>
    </div>
  );
}

// ───────────────────────── Builder (form) ─────────────────────────

function BuilderForm() {
  const { publishAgent } = useKarma();
  const [published, setPublished] = useState<Agent | null>(null);
  const [draft, setDraft] = useState<PublishDraft>({
    name: "", author: "", category: "ventas", svc: "", price: 10, unit: "mes", risk: 2, builtBy: "código",
  });
  const up = (p: Partial<PublishDraft>) => setDraft((d) => ({ ...d, ...p }));

  if (published) return <PublishedPanel agent={published} />;

  return (
    <Section title="Publicá tu agente" hint="Sos técnico: cargá los datos y publicalo directo.">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="grid gap-3">
          <input className="input" placeholder="Nombre (ej. Scraper-9)" value={draft.name} onChange={(e) => up({ name: e.target.value })} />
          <input className="input" placeholder="Autor (ej. tuhandle.eth)" value={draft.author} onChange={(e) => up({ author: e.target.value })} />
          <textarea className="input min-h-[80px]" placeholder="Qué hace tu agente…" value={draft.svc} onChange={(e) => up({ svc: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-muted">
              Categoría
              <select className="input mt-1" value={draft.category} onChange={(e) => up({ category: e.target.value as CategoryId })}>
                {VERTICALS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted">
              Modelo
              <select className="input mt-1" value={draft.unit} onChange={(e) => up({ unit: e.target.value as PriceUnit })}>
                <option value="mes">Suscripción / mes</option>
                <option value="tarea">Por tarea</option>
              </select>
            </label>
            <label className="text-sm text-muted">
              Precio (USDC)
              <input type="number" className="input mt-1" value={draft.price} onChange={(e) => up({ price: Number(e.target.value) })} />
            </label>
            <label className="text-sm text-muted">
              Riesgo (1-5)
              <select className="input mt-1" value={draft.risk} onChange={(e) => up({ risk: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>
          <span className="font-mono text-[12px] text-acc-2">🔒 Colateral: {usd(COLLATERAL_BY_RISK[draft.risk] ?? 1400)}</span>
          <button
            onClick={() => setPublished(publishAgent(draft))}
            className="mt-1 rounded-xl bg-gradient-to-b from-acc to-monad px-5 py-3.5 text-[15px] font-bold text-white transition hover:brightness-110 active:scale-95"
          >
            Publicar agente →
          </button>
        </div>
        <div className="pointer-events-none">
          <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">Preview en vivo</div>
          <AgentCard agent={previewAgent(draft)} />
        </div>
      </div>
    </Section>
  );
}

// ───────────────────────── compartidos ─────────────────────────

function PublishedPanel({ agent }: { agent: Agent }) {
  return (
    <div className="karma-feed-in rounded-2xl border border-acc-2/40 bg-acc-2/[0.07] p-8 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-3 font-serif text-[26px] font-bold text-white">
        <span className="text-acc-2">{agent.name}</span> ya está vivo en el marketplace
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-[14.5px] text-muted">
        Arranca con karma 600. Cada entrega por-resultado lo sube; un default lo manda al Muro de Vetados.
        Tu reputación on-chain es portable: cualquier protocolo de Monad la lee.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="rounded-xl bg-gradient-to-b from-acc to-monad px-5 py-3 text-sm font-semibold text-white hover:brightness-110">
          Verlo en el marketplace →
        </Link>
        <Link href={`/agents/${agent.id}`} className="rounded-xl border border-line px-5 py-3 text-sm text-muted hover:border-acc hover:text-txt">
          Abrir su perfil
        </Link>
      </div>
    </div>
  );
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="mb-7 flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span className={`grid h-7 w-7 place-items-center rounded-full font-mono text-[12px] ${
            i < current ? "bg-monad text-white" : i === current ? "border border-acc bg-acc/15 text-acc" : "border border-line text-faint"
          }`}>
            {i < current ? "✓" : i + 1}
          </span>
          <span className={`text-[13px] ${i === current ? "font-semibold text-white" : "text-faint"}`}>{s}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-line" />}
        </div>
      ))}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-panel/60 p-6">
      <h2 className="font-serif text-[20px] font-bold text-white">{title}</h2>
      {hint && <p className="mt-1 text-[13.5px] text-muted">{hint}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function NavRow({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button onClick={onBack} className="text-sm text-muted hover:text-txt">← Atrás</button>
      <button onClick={onNext} className="rounded-xl bg-gradient-to-b from-acc to-monad px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 active:scale-95">
        Continuar →
      </button>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3">
      <span className="text-[13px] text-muted">{k}</span>
      <span className="font-mono text-[13.5px] font-semibold text-white">{v}</span>
    </div>
  );
}

function Academy() {
  return (
    <div className="mt-10">
      <div className="flex items-baseline gap-3">
        <h2 className="font-serif text-[22px] font-bold text-white">Academia Karma</h2>
        <span className="font-mono text-[12px] text-faint">aprendé a construir y monetizar agentes</span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {ACADEMY.map((c) => (
          <div key={c.title} className="flex flex-col gap-2 rounded-xl border border-line bg-panel p-5 transition hover:border-acc/50">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-acc/40 bg-acc/10 font-mono text-acc">{c.ic}</span>
            <span className="text-[15px] font-bold text-white">{c.title}</span>
            <span className="text-[13px] text-muted">{c.desc}</span>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-[11px] text-faint">{c.min}</span>
              <button className="rounded-lg border border-acc/40 bg-acc/10 px-3 py-1.5 text-[13px] font-semibold text-acc hover:bg-acc/20">
                Empezar →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
