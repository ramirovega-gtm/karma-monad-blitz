"use client";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ratingOf } from "@/lib/format";

export type AgentNodeData = {
  name: string;
  role: string;
  score: number;
  vetado: boolean;
  orchestrator: boolean;
  paid: boolean;
};

export function AgentNode({ data }: NodeProps) {
  const d = data as AgentNodeData;
  const tone = d.vetado
    ? "border-bad bg-bad/10"
    : d.orchestrator
      ? "border-monad bg-monad/10"
      : "border-acc/60 bg-acc/5";

  return (
    <div
      className={`${tone} ${d.vetado ? "karma-skull-pulse" : ""} w-[190px] rounded-xl border-2 px-3.5 py-3 backdrop-blur`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-1.5 !w-1.5 !border-0 !bg-faint"
      />
      <div className="flex items-center gap-2.5">
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base font-bold ${
            d.vetado
              ? "bg-bad/20 text-bad"
              : d.orchestrator
                ? "bg-monad/25 text-monad"
                : "bg-acc/20 text-acc"
          }`}
        >
          {d.vetado ? "💀" : d.orchestrator ? "☯" : "◆"}
        </div>
        <div className="min-w-0">
          <div
            className={`truncate text-sm font-semibold ${d.vetado ? "text-bad line-through" : "text-txt"}`}
          >
            {d.name}
          </div>
          <div className="truncate font-mono text-[10px] text-muted">
            {d.role}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2">
        {d.vetado ? (
          <span className="font-mono text-[11px] font-bold text-bad">
            VETADO · 118 D
          </span>
        ) : (
          <span className="font-mono text-[11px] text-acc-2">
            Karma {Math.round(d.score)} · {ratingOf(d.score)}
          </span>
        )}
        {!d.orchestrator && !d.vetado && d.paid && (
          <span className="rounded bg-acc-2/20 px-1.5 py-0.5 font-mono text-[9px] text-acc-2">
            GoodPayer
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-1.5 !w-1.5 !border-0 !bg-faint"
      />
    </div>
  );
}
