// components/Result.tsx
"use client";

import type { OptimizeResponse, Algorithm } from "@/services/api";

interface ResultProps {
  result: OptimizeResponse | null;
  error: string | null;
}

// Métadonnées des algorithmes — couleur signature + libellé propre
const ALGO_META: Record<Algorithm, { label: string; color: string }> = {
  antcolony:    { label: "Ant Colony",    color: "#F59E0B" },
  genetic:      { label: "Genetic",       color: "#A78BFA" },
  local_search: { label: "2-opt",         color: "#34D399" },
  hybrid:       { label: "Hybrid",        color: "#38BDF8" },
};

export default function Result({ result, error }: ResultProps) {
  // ── ERROR ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/[0.06] to-red-500/[0.02] p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 ring-1 ring-red-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-300">Erreur API</h3>
            <p className="mt-1 font-mono text-xs text-red-300/70 whitespace-pre-wrap break-words">
              {error}
            </p>
            {(error.toLowerCase().includes("hamiltonien") || error.toLowerCase().includes("connexe")) && (
              <p className="mt-3 text-xs text-amber-300/80 leading-relaxed">
                Vérifiez que votre graphe de connexions permet de relier toutes les villes (graphe connexe).
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── EMPTY ─────────────────────────────────────────────
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.07] bg-[#0F1521] p-10 text-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600 mb-4">
          <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z"/>
          <path d="M9 7v13"/><path d="M15 4v13"/>
        </svg>
        <p className="text-sm text-slate-500">
          En attente d'optimisation
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Les résultats apparaîtront ici
        </p>
      </div>
    );
  }

  // ── Extraction sécurisée ──────────────────────────────
  const optimal_path        = result.optimal_path        ?? [];
  const total_distance      = Number(result.total_distance      ?? 0);
  const random_path         = result.random_path         ?? [];
  const random_distance     = Number(result.random_distance     ?? 0);
  const improvement_percent = Number(result.improvement_percent ?? 0);
  const algorithm_used      = result.algorithm_used      ?? "unknown";
  const execution_time_ms   = Number(result.execution_time_ms   ?? 0);
  const breakdown           = result.breakdown           ?? [];

  const isInvalidTour = !isFinite(total_distance) || (total_distance === 0 && optimal_path.length > 1);

  // ── INVALID ───────────────────────────────────────────
  if (isInvalidTour) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-amber-300">Tour invalide</h3>
            <p className="mt-1 text-xs text-amber-300/70 leading-relaxed">
              Aucun cycle hamiltonien trouvé avec les connexions définies. Le graphe n'est pas assez connexe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── BREAKDOWN PREP ────────────────────────────────────
  const sortedBreakdown = [...breakdown].sort((a, b) => a.distance - b.distance);
  const bestDist  = sortedBreakdown[0]?.distance ?? total_distance;
  const worstDist = sortedBreakdown[sortedBreakdown.length - 1]?.distance ?? total_distance;
  const range     = Math.max(worstDist - bestDist, 0.0001);

  // ── SUCCESS ───────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1521] to-[#0B121F] shadow-[0_4px_32px_rgba(0,0,0,0.5)]">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-400/10 ring-1 ring-emerald-400/20">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Résultat de l'optimisation
          </h2>
        </div>
        <span className="font-mono text-xs text-slate-500">
          {optimal_path.length} arrêts
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* KPI principal */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 rounded-xl border border-sky-400/15 bg-gradient-to-br from-sky-400/[0.06] to-transparent p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Distance optimale</p>
            <p className="font-mono text-3xl font-bold text-sky-300 tabular-nums">
              {total_distance.toFixed(2)}
              <span className="ml-1.5 text-sm font-normal text-slate-500">km</span>
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="rounded border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-mono text-slate-400">
                {ALGO_META[algorithm_used as Algorithm]?.label ?? algorithm_used}
              </span>
              <span className="font-mono text-slate-500">{execution_time_ms.toFixed(0)} ms</span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/[0.06] to-transparent p-4 flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Gain</p>
            <p className={`font-mono text-2xl font-bold tabular-nums ${improvement_percent >= 0 ? "text-emerald-300" : "text-red-400"}`}>
              {improvement_percent >= 0 ? "+" : ""}{improvement_percent.toFixed(1)}<span className="text-sm font-normal text-slate-500">%</span>
            </p>
            <p className="mt-1 font-mono text-[10px] text-slate-500">vs aléatoire</p>
          </div>
        </div>

        {/* Départ */}
        <div className="flex items-center gap-2 text-[11px]">
          {result.start_city ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/[0.06] px-2.5 py-1 text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Départ : {result.start_city}
            </span>
          ) : (
            <span className="font-mono text-slate-500">Départ automatique</span>
          )}
        </div>

        {/* BREAKDOWN PAR ALGORITHME */}
        {breakdown.length > 0 && (
          <div>
            <div className="mb-2.5 flex items-baseline justify-between">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Performance par algorithme
              </p>
              <span className="font-mono text-[9px] text-slate-600">
                meilleur → pire
              </span>
            </div>
            <div className="space-y-1.5">
              {sortedBreakdown.map(b => {
                const meta     = ALGO_META[b.name as Algorithm];
                const isWinner = b.name === algorithm_used;
                const fillPct  = 100 - ((b.distance - bestDist) / range) * 100;
                return (
                  <div key={b.name}
                    className={`group relative overflow-hidden rounded-lg border transition ${
                      isWinner
                        ? "border-emerald-400/25 bg-emerald-400/[0.04]"
                        : "border-white/[0.05] bg-white/[0.015] hover:border-white/[0.10]"
                    }`}
                  >
                    {/* Barre de remplissage relative */}
                    <div
                      className="absolute inset-y-0 left-0 transition-[width] duration-700"
                      style={{
                        width: `${fillPct}%`,
                        background: isWinner
                          ? "linear-gradient(90deg, rgba(52,211,153,0.18) 0%, rgba(52,211,153,0.03) 100%)"
                          : `linear-gradient(90deg, ${meta?.color ?? "#38BDF8"}1a 0%, transparent 100%)`,
                      }}
                    />
                    <div className="relative flex items-center gap-3 px-3 py-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: meta?.color ?? "#38BDF8", boxShadow: `0 0 6px ${meta?.color ?? "#38BDF8"}` }}
                      />
                      <span className={`flex-1 text-xs ${isWinner ? "text-emerald-200 font-semibold" : "text-slate-300"}`}>
                        {meta?.label ?? b.name}
                        {isWinner && (
                          <span className="ml-2 inline-flex items-center rounded bg-emerald-400/15 px-1.5 py-px text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-300">
                            best
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-xs tabular-nums text-slate-300">
                        {b.distance.toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] tabular-nums text-slate-600 w-12 text-right">
                        {b.time_ms.toFixed(0)}ms
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CHEMIN OPTIMAL */}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Itinéraire optimal</p>
            <span className="font-mono text-[10px] text-slate-600">
              aléatoire : {random_distance.toFixed(0)} km
            </span>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
            {optimal_path.map((city, i) => (
              <div key={`${city}-${i}`}
                className="flex items-center gap-3 rounded-lg bg-white/[0.02] px-3 py-1.5 text-sm transition hover:bg-white/[0.04]"
              >
                <span className="font-mono text-[10px] font-bold text-sky-400 w-6 text-center shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-slate-200 flex-1">{city}</span>
                {i === 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-400">départ</span>
                )}
                {i === optimal_path.length - 1 && i !== 0 && (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">retour</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chemin aléatoire — discret */}
        {random_path.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-400 transition list-none flex items-center gap-1.5">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition group-open:rotate-90">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              Voir le chemin aléatoire de comparaison
            </summary>
            <p className="mt-2 font-mono text-[10px] text-red-400/60 break-words leading-relaxed">
              {random_path.join(" → ")}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
