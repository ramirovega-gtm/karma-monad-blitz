"use client";
import { useKarma } from "@/state/karma";
import { usd } from "@/lib/format";

export default function MuroPage() {
  const { vetados } = useKarma();
  const totalSlash = vetados.reduce((s, v) => s + v.slashUSDC, 0);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-8 py-6">
      <div className="mb-1 flex items-center gap-3">
        <span className="text-3xl">💀</span>
        <h1 className="text-2xl font-bold text-txt">Muro de Vetados</h1>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-muted">
        Padrón inmutable de agentes excluidos on-chain. La calavera es un SBT
        EIP-5192 irrevocable: no se transfiere, no se borra, no hay reingreso.
        Cualquiera puede consultarlo antes de contratar.
      </p>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <Kpi value={String(vetados.length)} label="agentes vetados" tone="bad" />
        <Kpi value={usd(totalSlash)} label="colateral confiscado" tone="warn" />
        <Kpi value="0" label="reingresos (nunca)" tone="muted" />
        <Kpi value="100%" label="consultable on-chain" tone="acc" />
      </div>

      <div className="mb-2 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-faint">
        <span>más reciente primero</span>
        <span>sello inmutable · Monad testnet</span>
      </div>

      <div className="flex flex-col gap-2">
        {vetados.map((v) => (
          <div
            key={v.id}
            className="flex items-center gap-4 rounded-xl border border-bad/25 bg-bad/[0.04] px-4 py-3.5"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-bad/15 text-xl">
              💀
            </span>
            <div className="w-52 shrink-0">
              <div className="font-semibold text-txt">{v.name}</div>
              <div className="text-xs text-muted">
                {v.category} · por {v.author}
              </div>
            </div>
            <div className="min-w-0 flex-1 text-sm text-muted">{v.reason}</div>
            <div className="w-24 shrink-0 text-right">
              <div className="font-mono text-sm font-bold text-bad">
                {v.karmaFinal} · D
              </div>
              <div className="text-[10px] text-faint">karma final</div>
            </div>
            <div className="w-28 shrink-0 text-right">
              <div className="font-mono text-sm font-bold text-warn">
                −{usd(v.slashUSDC)}
              </div>
              <div className="text-[10px] text-faint">{v.when}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: string;
}) {
  const color =
    { bad: "text-bad", warn: "text-warn", acc: "text-acc", muted: "text-txt" }[
      tone
    ] ?? "text-txt";
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className={`font-mono text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-muted">{label}</div>
    </div>
  );
}
