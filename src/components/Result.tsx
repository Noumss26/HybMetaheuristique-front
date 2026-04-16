"use client";

import type { OptimizeResponse } from "@/services/api";

interface ResultProps {
  result: OptimizeResponse | null;
  error: string | null;
}

export default function Result({ result, error }: ResultProps) {
  console.log("🧩 [Result Render] error:", error);
  console.log("🧩 [Result Render] result:", result);

  // 🔴 ERROR STATE
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-xl">
            ⚠️
          </span>
          <div>
            <h3 className="font-semibold text-red-400">Erreur API</h3>
            <p className="mt-1 font-mono text-xs text-red-400/70">
              {error}
            </p>
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

  // 🔍 DEBUG RAW VALUES
  console.log("🔍 optimal_path:", result.optimal_path);
  console.log("🔍 random_path:", result.random_path);
  console.log("🔍 random_distance:", result.random_distance);
  console.log("🔍 improvement:", result.improvement_percent);

  // 🟢 SAFE EXTRACTION
  const optimal_path = result.optimal_path ?? [];
  const total_distance = Number(result.total_distance ?? 0);

  const random_path = result.random_path ?? [];
  const random_distance = Number(result.random_distance ?? 0);
  const improvement_percent = Number(result.improvement_percent ?? 0);

  const algorithm_used = result.algorithm_used ?? "unknown";
  const execution_time_ms = Number(result.execution_time_ms ?? 0);

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#0F1521] p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-200">
          Résultat
        </h2>

        <span className="text-xs text-emerald-400">
          {optimal_path.length} arrêts
        </span>
      </div>

      {/* ALGO INFO */}
      <div className="mb-4 text-xs text-slate-400">
        Algo: {algorithm_used} | {execution_time_ms} ms
      </div>

      {/* OPTIMAL */}
      <div className="mb-4">
        <p className="text-xs text-slate-500">Distance optimale</p>
        <p className="text-2xl text-sky-400 font-bold">
          {total_distance.toFixed(2)} km
        </p>
      </div>

      {result.start_city ? (
        <div className="text-xs text-sky-400 mb-2">
          Départ: {result.start_city}
        </div>
      ) : (
        <div className="text-xs text-slate-500 mb-2">
          Départ: automatique
        </div>
      )}
      
      {/* COMPARISON */}
      <div className="grid grid-cols-2 gap-4 mb-4">

        <div className="bg-[#131C2E] p-3 rounded">
          <p className="text-xs text-slate-500">Random distance</p>
          <p className="text-red-400 font-bold">
            {random_distance.toFixed(2)} km
          </p>
        </div>

        <div className="bg-[#131C2E] p-3 rounded">
          <p className="text-xs text-slate-500">Improvement</p>
          <p className="text-emerald-400 font-bold">
            {improvement_percent.toFixed(2)} %
          </p>
        </div>

      </div>

      {/* PATH DEBUG (IMPORTANT) */}
      <div className="mb-4">
        <p className="text-xs text-slate-500">Random path</p>
        <p className="text-xs text-red-400 break-words">
          {random_path.length > 0
            ? random_path.join(" → ")
            : "EMPTY RANDOM PATH ⚠️"}
        </p>
      </div>

      {/* OPTIMAL PATH */}
      <div>
        <p className="text-xs text-slate-500 mb-2">Optimal path</p>

        {optimal_path.map((city, i) => (
          <div key={`${city}-${i}`} className="text-sm text-slate-200">
            {i + 1}. {city}
          </div>
        ))}
      </div>

    </div>
  );
}