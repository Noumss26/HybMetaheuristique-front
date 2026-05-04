// app/page.tsx
"use client";

import { useState } from "react";
import Form from "@/components/Form";
import Result from "@/components/Result";
import CityGraph from "@/components/CityGraphe";
import { optimizeRoute } from "@/services/api";
import type { Algorithm, City, Edge, OptimizeResponse } from "@/services/api";

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
    algorithm: Algorithm,
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

        {/* ── Main grid ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="fade-up animation-delay-100">
            <Form onSubmit={handleOptimize} loading={loading} />
          </div>
          <div className="flex flex-col gap-6 fade-up animation-delay-200">
            <Result result={result} error={error} />
            {cities && (
              <CityGraph
                cities={cities}
                optimalPath={result?.optimal_path ?? []}
                edges={edges ?? undefined}
              />
            )}
          </div>
        </div>

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