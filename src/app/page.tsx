// app/page.tsx
"use client";

import { useState } from "react";
import Form from "@/components/Form";
import Result from "@/components/Result";
import CityGraph from "@/components/CityGraphe";
import AlgoBreakdown from "@/components/AlgoBreakdown";
import { optimizeRoute } from "@/services/api";
import type { AlgorithmSelection, City, Edge, OptimizeResponse } from "@/services/api";

export default function HomePage() {
  const [result, setResult]   = useState<OptimizeResponse | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cities, setCities]   = useState<City[] | null>(null);
  const [edges, setEdges]     = useState<Edge[] | null>(null);

  // ── Handler principal ────────────────────────────────
  const handleOptimize = async (
    selected: City[],
    startCity: string | null,
    algorithm: AlgorithmSelection,
    selectedEdges: Edge[] | null,   // null = graphe complet
  ) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setCities(selected);
    setEdges(selectedEdges);

    try {
      const data = await optimizeRoute({
        cities: selected,
        algorithm,
        start_city: startCity,
        // undefined → backend reçoit graphe complet (champ absent du body)
        // Edge[]    → backend reçoit graphe partiel
        edges: selectedEdges ?? undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
    } finally {
      setLoading(false);
    }
  };

  // ── Rendu ────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#080B12]">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {/* ── Hero ── */}
        <header className="mb-12 fade-up">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/[0.04] px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-sky-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                Hybridation métaheuristique
              </span>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
                Route<span className="bg-gradient-to-r from-sky-400 to-sky-300 bg-clip-text text-transparent">Opt</span>
              </h1>
              <p className="mt-3 max-w-md text-sm text-slate-400 leading-relaxed">
                Optimisation d'itinéraires de livraison par <span className="text-slate-300">ACO</span>, <span className="text-slate-300">algorithme génétique</span>, <span className="text-slate-300">2-opt</span> et leur <span className="text-slate-300">hybridation</span>.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Backend en ligne
              </span>
              <span className="text-slate-600 normal-case tracking-normal">localhost:8000</span>
            </div>
          </div>
        </header>

        {/* ── Main layout ──
             Disposition pro :
             1. KPI strip horizontal en haut (Result compact)
             2. Grille 2 colonnes : Form (4/12) + Map (8/12)
             3. Breakdown 4 algos en pleine largeur sous la grille
        */}

        {/* 1. KPI strip — visible en premier, scan rapide */}
        {(result || error) && (
          <div className="mb-6 fade-up">
            <Result result={result} error={error} />
          </div>
        )}

        {/* 2. Grid : Form ⟷ Map */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 xl:col-span-4 fade-up animation-delay-100">
            <Form onSubmit={handleOptimize} loading={loading} />
          </div>
          <div className="lg:col-span-7 xl:col-span-8 fade-up animation-delay-200">
            {cities ? (
              <CityGraph
                cities={cities}
                optimalPath={result?.optimal_path ?? []}
                edges={edges ?? undefined}
              />
            ) : (
              <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.01] text-center">
                <div>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-slate-700 mx-auto mb-3">
                    <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z"/>
                    <path d="M9 7v13"/><path d="M15 4v13"/>
                  </svg>
                  <p className="text-sm text-slate-500">Carte des itinéraires</p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Lancez l'optimisation pour visualiser le tour
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Breakdown 4 algos — pleine largeur, sous la grille */}
        {result?.breakdown && result.breakdown.length > 0 && (
          <div className="mt-6 fade-up animation-delay-300">
            <AlgoBreakdown result={result} />
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="mt-16 flex items-center justify-between border-t border-white/[0.04] pt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600">
          <span>Next.js · React 19</span>
          <span className="rounded border border-slate-800 bg-slate-900/50 px-2 py-0.5 text-sky-500/80 normal-case tracking-normal">
            POST /optimize
          </span>
          <span>FastAPI · Python 3.14</span>
        </footer>
      </div>
    </main>
  );
}