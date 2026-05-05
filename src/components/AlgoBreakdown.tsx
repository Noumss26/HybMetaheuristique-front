// components/AlgoBreakdown.tsx
"use client";

import type { OptimizeResponse, Algorithm } from "@/services/api";

interface Props {
  result: OptimizeResponse | null;
}

const ALGO_LABEL: Record<Algorithm, string> = {
  antcolony:    "Ant Colony",
  genetic:      "Genetic",
  local_search: "2-opt",
  hybrid:       "Hybrid",
};

const ALGO_DESC: Record<Algorithm, string> = {
  antcolony:    "Optimisation par colonie de fourmis",
  genetic:      "Algorithme génétique avec OX + inversion",
  local_search: "Recherche locale 2-opt avec delta O(1)",
  hybrid:       "Pipeline ACO → GA → 2-opt",
};

/**
 * Tableau comparatif des 4 algorithmes en pleine largeur.
 * Disposition pro : grille horizontale avec barre de progression
 * relative et hiérarchie typographique au lieu de couleurs distinctes.
 */
export default function AlgoBreakdown({ result }: Props) {
  if (!result?.breakdown || result.breakdown.length === 0) return null;

  const sorted    = [...result.breakdown].sort((a, b) => a.distance - b.distance);
  const bestDist  = sorted[0].distance;
  const worstDist = sorted[sorted.length - 1].distance;
  const range     = Math.max(worstDist - bestDist, 0.0001);
  const winner    = result.algorithm_used;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1521] to-[#0B121F] shadow-[0_4px_32px_rgba(0,0,0,0.5)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-3">
        <h3 className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 ring-1 ring-sky-400/20">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </span>
          Comparaison des algorithmes
        </h3>
        <span className="font-mono text-[10px] text-slate-600 tracking-wider">
          {sorted.length} algorithmes · meilleur → pire
        </span>
      </div>

      {/* Table */}
      <div className="divide-y divide-white/[0.03]">
        {sorted.map((b, idx) => {
          const isWinner = b.name === winner;
          // Progression relative (0% = pire, 100% = meilleur)
          const fillPct  = 100 - ((b.distance - bestDist) / range) * 100;
          const gapVsBest = ((b.distance - bestDist) / bestDist) * 100;

          return (
            <div key={b.name}
              className={`relative px-5 py-3.5 transition ${
                isWinner ? "bg-emerald-400/[0.025]" : "hover:bg-white/[0.015]"
              }`}
            >
              {/* Barre de remplissage discrète, monochrome */}
              <div
                className="absolute inset-y-0 left-0 transition-[width] duration-700 ease-out"
                style={{
                  width: `${fillPct}%`,
                  background: isWinner
                    ? "linear-gradient(90deg, rgba(52,211,153,0.10) 0%, rgba(52,211,153,0.01) 100%)"
                    : "linear-gradient(90deg, rgba(56,189,248,0.06) 0%, rgba(56,189,248,0.005) 100%)",
                }}
              />

              <div className="relative grid grid-cols-12 items-center gap-3">
                {/* Rang */}
                <span className="col-span-1 font-mono text-[10px] text-slate-600 tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Nom + description */}
                <div className="col-span-5 sm:col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${isWinner ? "text-emerald-200" : "text-slate-200"}`}>
                      {ALGO_LABEL[b.name as Algorithm] ?? b.name}
                    </span>
                    {isWinner && (
                      <span className="inline-flex items-center rounded bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                        best
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500 truncate">
                    {ALGO_DESC[b.name as Algorithm] ?? ""}
                  </p>
                </div>

                {/* Distance */}
                <div className="col-span-3 sm:col-span-3 text-right sm:text-left">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Distance</p>
                  <p className="font-mono text-sm font-semibold text-slate-200 tabular-nums">
                    {b.distance.toFixed(2)}
                  </p>
                </div>

                {/* Écart vs best */}
                <div className="hidden sm:block col-span-2 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Écart</p>
                  <p className={`font-mono text-sm font-semibold tabular-nums ${
                    isWinner ? "text-emerald-300" : "text-slate-400"
                  }`}>
                    {isWinner ? "—" : `+${gapVsBest.toFixed(2)}%`}
                  </p>
                </div>

                {/* Temps */}
                <div className="col-span-3 sm:col-span-2 text-right">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-slate-600">Temps</p>
                  <p className="font-mono text-sm font-semibold text-slate-300 tabular-nums">
                    {b.time_ms.toFixed(0)}
                    <span className="ml-1 text-[10px] font-normal text-slate-600">ms</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
