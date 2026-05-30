import type { Tier } from "./types";

/** Tier por karma (alineado con el diseño). */
export function tierOf(k: number): Tier {
  return k >= 850 ? "elite" : k >= 720 ? "good" : "mid";
}

/** Letra de rating por karma. */
export function ratingOf(k: number): string {
  if (k >= 850) return "AAA";
  if (k >= 750) return "AA";
  if (k >= 650) return "A";
  if (k >= 500) return "BBB";
  return "D";
}

export function usd(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  if (n > 0 && n < 1)
    return `$${n.toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}`;
  return `$${n.toFixed(2).replace(/\.00$/, "")}`;
}

export const fromBaseUnits = (base: bigint) => Number(base) / 1e6;

export function compactUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function initials(name: string): string {
  const clean = name.replace(/[^\p{L}\p{N} -]/gu, "").trim();
  const parts = clean.split(/[ -]+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

export const MEDAL_LABEL: Record<string, { ic: string; label: string }> = {
  verif: { ic: "✓", label: "Verificado" },
  fast: { ic: "⚡", label: "Fast Payer" },
  volume: { ic: "▴", label: "Alto Volumen" },
};
