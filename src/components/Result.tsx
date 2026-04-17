// components/Result.tsx
"use client";

import type { OptimizeResponse } from "@/services/api";

interface ResultProps {
  result: OptimizeResponse | null;
  error: string | null;
}

export default function Result({ result, error }: ResultProps) {
  // 🔴 ERROR STATE
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-xl shrink-0">
            ⚠️
          </span>
          <div>
            <h3 className="font-semibold text-red-400">Erreur API</h3>
            <p className="mt-1 font-mono text-xs text-red-400/70 whitespace-pre-wrap">
              {error}
            </p>
            {error.toLowerCase().includes("hamiltonien") || error.toLowerCase().includes("connexe") ? (
              <p className="mt-2 text-xs text-amber-400/80">
                💡 Vérifiez que votre graphe de connexions permet de relier toutes les villes entre elles (graphe connexe).
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // 🟡 EMPTY STATE
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.07] bg-[#0F1521] p-10 text-center">
        <div className="mb-4 text-3xl">🗺️</div>
        <p className="text-sm text-slate-500">
          Les résultats apparaîtront ici après optimisation.
        </p>
      </div>
    );
  }

  // ── Extraction sécurisée ─────────────────────────────

  const optimal_path       = result.optimal_path       ?? [];
  const total_distance     = Number(result.total_distance     ?? 0);
  const random_path        = result.random_path        ?? [];
  const random_distance    = Number(result.random_distance    ?? 0);
  const improvement_percent = Number(result.improvement_percent ?? 0);
  const algorithm_used     = result.algorithm_used     ?? "unknown";
  const execution_time_ms  = Number(result.execution_time_ms  ?? 0);

  // Tour invalide = distance infinie retournée par le backend
  const isInvalidTour = !isFinite(total_distance) || total_distance === 0 && optimal_path.length > 1;

  // 🔴 INVALID TOUR (graphe non connexe)
  if (isInvalidTour) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-xl shrink-0">
            🔗
          </span>
          <div>
            <h3 className="font-semibold text-amber-400">Tour invalide</h3>
            <p className="mt-1 text-xs text-amber-400/70">
              Aucun chemin hamiltonien trouvé avec les connexions définies. 
              Le graphe n'est peut-être pas assez connexe pour relier toutes les villes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🟢 SUCCESS STATE
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0F1521] p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-200">Résultat</h2>
        <span className="text-xs text-emerald-400">{optimal_path.length} arrêts</span>
      </div>

      {/* ALGO INFO */}
      <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
        <span className="rounded border border-white/[0.07] bg-[#131C2E] px-2 py-1">
          {algorithm_used}
        </span>
        <span>{execution_time_ms.toFixed(1)} ms</span>
      </div>

      {/* DISTANCE OPTIMALE */}
      <div className="mb-4">
        <p className="text-xs text-slate-500">Distance optimale</p>
        <p className="text-2xl text-sky-400 font-bold">
          {total_distance.toFixed(2)} <span className="text-sm font-normal text-slate-500">km</span>
        </p>
      </div>

      {/* DÉPART */}
      <div className="mb-4 text-xs">
        {result.start_city ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/20 bg-sky-400/5 px-2.5 py-1 text-sky-400">
            🚀 Départ : {result.start_city}
          </span>
        ) : (
          <span className="text-slate-500">Départ : automatique</span>
        )}
      </div>

      {/* COMPARAISON */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-xl bg-[#131C2E] border border-white/[0.05] p-3">
          <p className="text-xs text-slate-500 mb-1">Aléatoire</p>
          <p className="text-red-400 font-bold">
            {random_distance.toFixed(2)} <span className="text-xs font-normal text-slate-500">km</span>
          </p>
        </div>
        <div className="rounded-xl bg-[#131C2E] border border-white/[0.05] p-3">
          <p className="text-xs text-slate-500 mb-1">Amélioration</p>
          <p className={`font-bold ${improvement_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {improvement_percent >= 0 ? "+" : ""}{improvement_percent.toFixed(2)} %
          </p>
        </div>
      </div>

      {/* CHEMIN ALÉATOIRE */}
      <div className="mb-4">
        <p className="text-xs text-slate-500 mb-1">Chemin aléatoire</p>
        <p className="text-xs text-red-400/70 break-words leading-relaxed">
          {random_path.length > 0
            ? random_path.join(" → ")
            : <span className="text-slate-600 italic">Non disponible</span>}
        </p>
      </div>

      {/* CHEMIN OPTIMAL */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Chemin optimal</p>
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {optimal_path.map((city, i) => (
            <div
              key={`${city}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-[#131C2E] px-3 py-1.5 text-sm"
            >
              <span className="font-mono text-xs text-sky-400 w-5 shrink-0">{i + 1}</span>
              <span className="text-slate-200">{city}</span>
              {i === 0 && (
                <span className="ml-auto text-xs text-emerald-400">départ</span>
              )}
              {i === optimal_path.length - 1 && i !== 0 && (
                <span className="ml-auto text-xs text-slate-500">↩ retour</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}