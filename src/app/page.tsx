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

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* ── Hero ── */}
        <header className="mb-12 text-center fade-up">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/5 px-4 py-1.5 font-mono text-xs tracking-widest text-sky-400 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Optimisation · Livraison
          </span>
          <h1 className="mt-4 text-6xl font-bold tracking-tight text-white sm:text-7xl">
            Route<span className="text-sky-400">Opt</span>
          </h1>
          <p className="mt-4 text-base text-slate-400 max-w-md mx-auto leading-relaxed">
            Saisissez vos villes, laissez le backend calculer l'itinéraire le plus court.
          </p>
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
        <footer className="mt-16 text-center font-mono text-xs text-slate-600">
          Frontend Next.js ·{" "}
          <span className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-sky-500">
            POST /optimize
          </span>{" "}
          FastAPI
        </footer>
      </div>
    </main>
  );
}