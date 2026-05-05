// components/Result.tsx
"use client";

import type { OptimizeResponse, Algorithm } from "@/services/api";

interface ResultProps {
  result: OptimizeResponse | null;
  error: string | null;
}

const ALGO_LABEL: Record<Algorithm, string> = {
  antcolony:    "Ant Colony",
  genetic:      "Genetic",
  local_search: "2-opt",
  hybrid:       "Hybrid",
};

export default function Result({ result, error }: ResultProps) {
  // ── ERROR ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/20 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-red-300">Erreur d'optimisation</h3>
            <p className="mt-1 font-mono text-[11px] text-red-300/70 break-words leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── EMPTY ─────────────────────────────────────────────
  if (!result) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.02] ring-1 ring-white/[0.04]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
            <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z"/>
            <path d="M9 7v13"/><path d="M15 4v13"/>
          </svg>
        </span>
        <div>
          <p className="text-sm text-slate-400">En attente d'optimisation</p>
          <p className="mt-0.5 text-[11px] text-slate-600">Configurez vos paramètres et lancez l'optimisation</p>
        </div>
      </div>
    );
  }

  const optimal_path        = result.optimal_path        ?? [];
  const total_distance      = Number(result.total_distance      ?? 0);
  const random_distance     = Number(result.random_distance     ?? 0);
  const improvement_percent = Number(result.improvement_percent ?? 0);
  const algorithm_used      = result.algorithm_used      ?? "unknown";
  const execution_time_ms   = Number(result.execution_time_ms   ?? 0);

  const isInvalidTour = !isFinite(total_distance) || (total_distance === 0 && optimal_path.length > 1);

  // ── INVALID ───────────────────────────────────────────
  if (isInvalidTour) {
    return (
      <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.03] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 ring-1 ring-red-500/20 shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </span>
          <div>
            <h3 className="text-sm font-semibold text-red-300">Tour invalide</h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Aucun cycle hamiltonien trouvé avec les connexions définies.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── KPI STRIP — disposition pro horizontale ───────────
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1521] to-[#0B121F] shadow-[0_4px_32px_rgba(0,0,0,0.5)] overflow-hidden">

      {/* Header strip — discret */}
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
          Optimisation terminée
        </span>
        <span className="ml-auto font-mono text-[10px] text-slate-500 tabular-nums">
          {execution_time_ms.toFixed(0)} ms
        </span>
      </div>

      {/* KPI grid 4 colonnes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/[0.04]">
        {/* 1. Distance optimale — KPI principal, le plus visible */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1.5">Distance</p>
          <p className="font-mono text-2xl font-bold text-sky-300 tabular-nums leading-none">
            {total_distance.toFixed(0)}
            <span className="ml-1 text-xs font-normal text-slate-500">km</span>
          </p>
        </div>

        {/* 2. Gain vs aléatoire */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1.5">Gain</p>
          <p className={`font-mono text-2xl font-bold tabular-nums leading-none ${improvement_percent >= 0 ? "text-emerald-300" : "text-red-400"}`}>
            {improvement_percent >= 0 ? "+" : ""}{improvement_percent.toFixed(1)}
            <span className="ml-0.5 text-xs font-normal text-slate-500">%</span>
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            vs {random_distance.toFixed(0)} km
          </p>
        </div>

        {/* 3. Algo utilisé */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1.5">Algorithme</p>
          <p className="text-[15px] font-semibold text-slate-200 leading-none">
            {ALGO_LABEL[algorithm_used as Algorithm] ?? algorithm_used}
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            meilleur des 4
          </p>
        </div>

        {/* 4. Étapes */}
        <div className="px-5 py-4">
          <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 mb-1.5">Étapes</p>
          <p className="font-mono text-2xl font-bold text-slate-200 tabular-nums leading-none">
            {optimal_path.length}
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            {result.start_city ? `dep. ${result.start_city}` : "dep. auto"}
          </p>
        </div>
      </div>
    </div>
  );
}
