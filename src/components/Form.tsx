// components/Form.tsx
"use client";

import { useState } from "react";
import type { Algorithm, City, Edge } from "@/services/api";

// ── Constantes ───────────────────────────────────────────

const DEFAULT_CITIES: City[] = [
  { name: "Paris",     x: 340, y: 120 },
  { name: "Lyon",      x: 370, y: 260 },
  { name: "Marseille", x: 390, y: 380 },
  { name: "Bordeaux",  x: 180, y: 300 },
  { name: "Lille",     x: 310, y:  60 },

  { name: "City6",  x: 120, y:  80 }, { name: "City7",  x: 150, y: 140 },
  { name: "City8",  x: 200, y: 100 }, { name: "City9",  x: 260, y:  90 },
  { name: "City10", x: 400, y: 100 }, { name: "City11", x: 450, y: 140 },
  { name: "City12", x: 480, y: 200 }, { name: "City13", x: 430, y: 260 },
  { name: "City14", x: 410, y: 320 }, { name: "City15", x: 380, y: 420 },
  { name: "City16", x: 300, y: 400 }, { name: "City17", x: 250, y: 360 },
  { name: "City18", x: 200, y: 340 }, { name: "City19", x: 150, y: 360 },
  { name: "City20", x: 100, y: 320 }, 
];

const ALGORITHM_OPTIONS: { value: Algorithm; label: string }[] = [
  { value: "hybrid",       label: "🔀 Hybrid (ACO + GA + 2-opt)" },
  { value: "antcolony",    label: "🐜 Ant Colony"                },
  { value: "genetic",      label: "🧬 Génétique"                 },
  { value: "local_search", label: "🔍 Local Search (2-opt)"      },
];

// ── Types ────────────────────────────────────────────────

interface FormProps {
  onSubmit: (
    cities: City[],
    startCity: string | null,
    algorithm: Algorithm,
    edges: Edge[] | null,
  ) => void;
  loading: boolean;
}

interface NewCityState { name: string; x: string; y: string; }
interface NewEdgeState  { city_a: string; city_b: string; }

// ── Helpers ──────────────────────────────────────────────

const dist2D = (a: City, b: City) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const edgeKey = (e: Edge) => [e.city_a, e.city_b].sort().join("__");

const edgeExists = (edges: Edge[], a: string, b: string) =>
  edges.some(e => edgeKey(e) === edgeKey({ city_a: a, city_b: b }));

/**
 * Génère un graphe connexe :
 * 1. Relie chaque ville à ses `k` voisines les plus proches.
 * 2. Vérifie la connexité par Union-Find.
 * 3. Ajoute les arêtes manquantes (Kruskal) pour garantir qu'aucune
 *    ville n'est isolée — le backend trouvera toujours un tour valide.
 */
function generateEdges(cities: City[], k: number = 3): Edge[] {
  if (cities.length < 2) return [];

  const edgeSet = new Set<string>();
  const result: Edge[] = [];

  const addEdge = (a: string, b: string) => {
    const key = [a, b].sort().join("__");
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      result.push({ city_a: a, city_b: b });
    }
  };

  // Étape 1 : k plus proches voisins
  for (const city of cities) {
    const sorted = [...cities]
      .filter(c => c.name !== city.name)
      .sort((a, b) => dist2D(city, a) - dist2D(city, b))
      .slice(0, k);
    for (const neighbor of sorted) addEdge(city.name, neighbor.name);
  }

  // Étape 2 : Union-Find pour vérifier la connexité
  const parent: Record<string, string> = {};
  const find = (x: string): string => {
    if (!parent[x]) parent[x] = x;
    if (parent[x] !== x) parent[x] = find(parent[x]);
    return parent[x];
  };
  const union = (x: string, y: string) => { parent[find(x)] = find(y); };

  for (const e of result) union(e.city_a, e.city_b);

  // Étape 3 : Kruskal pour relier les composantes déconnectées
  const allEdges = cities.flatMap((a, i) =>
    cities.slice(i + 1).map(b => ({ a, b, d: dist2D(a, b) }))
  ).sort((x, y) => x.d - y.d);

  for (const { a, b } of allEdges) {
    if (find(a.name) !== find(b.name)) {
      addEdge(a.name, b.name);
      union(a.name, b.name);
    }
  }

  return result;
}

// ── Composant ────────────────────────────────────────────

export default function Form({ onSubmit, loading }: FormProps) {
  const [cities,     setCities]     = useState<City[]>(DEFAULT_CITIES);
  const [newCity,    setNewCity]    = useState<NewCityState>({ name: "", x: "", y: "" });
  const [editIndex,  setEditIndex]  = useState<number | null>(null);
  const [startCity,  setStartCity]  = useState<string | null>(null);
  const [algorithm,  setAlgorithm]  = useState<Algorithm>("hybrid");

  const [usePartialGraph, setUsePartialGraph] = useState(false);
  const [edges,      setEdges]      = useState<Edge[]>([]);
  const [kNeighbors, setKNeighbors] = useState<number>(3);
  const [newEdge,    setNewEdge]    = useState<NewEdgeState>({ city_a: "", city_b: "" });
  const [edgeError,  setEdgeError]  = useState<string | null>(null);

  // ── Villes ───────────────────────────────────────────

  const handleFieldChange = (index: number, field: keyof City, value: string) =>
    setCities(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: field === "name" ? value : Number(value) } : c
    ));

  const handleAdd = () => {
    if (!newCity.name.trim() || newCity.x === "" || newCity.y === "") return;
    setCities(p => [...p, { name: newCity.name.trim(), x: +newCity.x, y: +newCity.y }]);
    setNewCity({ name: "", x: "", y: "" });
  };

  const handleRemoveCity = (i: number) => {
    const removed = cities[i].name;
    setCities(p => p.filter((_, idx) => idx !== i));
    // Nettoyer les arêtes qui référencent la ville supprimée
    setEdges(prev => prev.filter(e => e.city_a !== removed && e.city_b !== removed));
  };

  // ── Arêtes ───────────────────────────────────────────

  const handleAutoGenerate = () => {
    setEdgeError(null);
    setEdges(generateEdges(cities, kNeighbors));
  };

  const handleAddEdge = () => {
    setEdgeError(null);
    const { city_a, city_b } = newEdge;
    if (!city_a || !city_b)          { setEdgeError("Sélectionnez deux villes."); return; }
    if (city_a === city_b)           { setEdgeError("Les deux villes doivent être différentes."); return; }
    if (edgeExists(edges, city_a, city_b)) { setEdgeError("Cette connexion existe déjà."); return; }
    setEdges(prev => [...prev, { city_a, city_b }]);
    setNewEdge({ city_a: "", city_b: "" });
  };

  const handleRemoveEdge = (index: number) =>
    setEdges(prev => prev.filter((_, i) => i !== index));

  // ── Submit ───────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cities.length < 2) return;

    if (usePartialGraph && edges.length === 0) {
      setEdgeError("Générez ou ajoutez au moins une connexion avant de lancer l'optimisation.");
      return;
    }

    onSubmit(cities, startCity, algorithm, usePartialGraph ? edges : null);
  };

  // ── Render ───────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/[0.07] bg-[#0F1521] p-6 shadow-[0_4px_32px_rgba(0,0,0,0.4)]"
    >
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200 uppercase tracking-wider">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 text-sky-400 text-xs">📍</span>
          Villes à livrer
        </h2>
        <button
          type="button"
          onClick={() => { setCities(DEFAULT_CITIES); setEdges([]); }}
          className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
        >
          Réinitialiser
        </button>
      </div>

      {/* Liste des villes */}
      <div className="mb-4 max-h-64 overflow-y-auto space-y-2 pr-1">
        {cities.map((city, i) => (
          <div key={i}
            className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#131C2E] px-3 py-2.5 transition hover:border-white/10"
          >
            <span className="font-mono text-xs font-bold text-sky-400 w-5 text-center shrink-0">{i + 1}</span>

            {editIndex === i ? (
              <>
                <input className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#080B12] px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/60 transition"
                  value={city.name} onChange={e => handleFieldChange(i, "name", e.target.value)} placeholder="Nom" />
                <input type="number" className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 transition"
                  value={city.x} onChange={e => handleFieldChange(i, "x", e.target.value)} placeholder="X" />
                <input type="number" className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 transition"
                  value={city.y} onChange={e => handleFieldChange(i, "y", e.target.value)} placeholder="Y" />
                <button type="button" onClick={() => setEditIndex(null)}
                  className="ml-1 text-emerald-400 hover:text-emerald-300 transition text-lg leading-none">✓</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-200">{city.name}</span>
                <span className="font-mono text-xs text-slate-500">({city.x}, {city.y})</span>
                <button type="button" onClick={() => setEditIndex(i)}
                  className="ml-1 rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300" title="Modifier">✏️</button>
                <button type="button" onClick={() => handleRemoveCity(i)}
                  className="rounded-md p-1 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400" title="Supprimer">✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Ajout ville */}
      <div className="mb-5 flex items-center gap-2">
        <input
          className="flex-1 min-w-0 rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 transition"
          placeholder="Nouvelle ville" value={newCity.name}
          onChange={e => setNewCity(p => ({ ...p, name: e.target.value }))}
        />
        <input type="number"
          className="w-16 rounded-xl border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 transition"
          placeholder="X" value={newCity.x} onChange={e => setNewCity(p => ({ ...p, x: e.target.value }))}
        />
        <input type="number"
          className="w-16 rounded-xl border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 transition"
          placeholder="Y" value={newCity.y} onChange={e => setNewCity(p => ({ ...p, y: e.target.value }))}
        />
        <button type="button" onClick={handleAdd}
          className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-3 py-2 text-sm font-semibold text-sky-400 transition hover:border-sky-400/40 hover:bg-sky-400/10 whitespace-nowrap">
          + Ajouter
        </button>
      </div>

      <div className="mb-5 border-t border-white/[0.05]" />

      {/* Toggle graphe partiel */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-200">Connexions personnalisées</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {usePartialGraph
              ? "Seules les connexions définies ci-dessous sont autorisées."
              : "Graphe complet — toutes les villes sont reliées entre elles."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setUsePartialGraph(p => !p); setEdgeError(null); }}
          className={`relative h-6 w-11 rounded-full transition-colors ${usePartialGraph ? "bg-sky-400" : "bg-slate-700"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${usePartialGraph ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Section arêtes */}
      {usePartialGraph && (
        <div className="mb-5 rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <span>🔗</span>
            Connexions autorisées
            <span className="ml-auto font-mono font-normal text-amber-400/60">
              {edges.length} lien{edges.length !== 1 ? "s" : ""}
            </span>
          </h3>

          {/* Génération automatique */}
          <div className="mb-4 rounded-lg border border-white/[0.05] bg-[#0F1521] p-3">
            <p className="mb-1 text-xs font-semibold text-slate-300">⚡ Génération automatique</p>
            <p className="mb-3 text-xs text-slate-500 leading-relaxed">
              Connecte chaque ville à ses{" "}
              <strong className="text-amber-400">{kNeighbors}</strong> voisines les plus proches,
              puis garantit la connexité du graphe via un arbre couvrant minimal.
            </p>

            <div className="mb-3 flex items-center gap-3">
              <label className="text-xs text-slate-400 shrink-0">Voisins par ville :</label>
              <input
                type="range" min={1} max={Math.min(10, cities.length - 1)} value={kNeighbors}
                onChange={e => setKNeighbors(Number(e.target.value))}
                className="flex-1 accent-amber-400"
              />
              <span className="font-mono text-sm text-amber-400 w-4 text-center">{kNeighbors}</span>
            </div>

            <button
              type="button"
              onClick={handleAutoGenerate}
              className="w-full rounded-lg border border-amber-400/30 bg-amber-400/10 py-2 text-sm font-semibold text-amber-400 transition hover:border-amber-400/50 hover:bg-amber-400/20"
            >
              🔄 Générer les connexions ({cities.length} villes)
            </button>

            {edges.length > 0 && (
              <p className="mt-2 text-center text-xs text-emerald-400/70">
                ✓ {edges.length} connexions générées — graphe connexe garanti
              </p>
            )}
          </div>

          {/* Liste des arêtes */}
          {edges.length > 0 && (
            <div className="mb-3 max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {edges.map((edge, i) => (
                <div key={i}
                  className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-[#0F1521] px-3 py-2 text-xs">
                  <span className="text-slate-300 font-medium">{edge.city_a}</span>
                  <span className="text-amber-400/60">↔</span>
                  <span className="text-slate-300 font-medium">{edge.city_b}</span>
                  <button type="button" onClick={() => handleRemoveEdge(i)}
                    className="ml-auto text-slate-600 hover:text-red-400 transition" title="Supprimer">✕</button>
                </div>
              ))}
            </div>
          )}

          {edges.length === 0 && (
            <p className="mb-3 text-xs text-amber-400/50 italic">
              ⚠️ Aucune connexion — cliquez sur "Générer" pour éviter l'erreur de connexité.
            </p>
          )}

          {/* Ajout manuel */}
          <div>
            <p className="mb-2 text-xs text-slate-500">Ou ajouter manuellement :</p>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 min-w-0 rounded-lg border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm text-slate-200 outline-none focus:border-amber-400/50 transition"
                value={newEdge.city_a} onChange={e => setNewEdge(p => ({ ...p, city_a: e.target.value }))}
              >
                <option value="">Ville A</option>
                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <span className="text-amber-400/60 text-sm shrink-0">↔</span>
              <select
                className="flex-1 min-w-0 rounded-lg border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm text-slate-200 outline-none focus:border-amber-400/50 transition"
                value={newEdge.city_b} onChange={e => setNewEdge(p => ({ ...p, city_b: e.target.value }))}
              >
                <option value="">Ville B</option>
                {cities.filter(c => c.name !== newEdge.city_a).map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddEdge}
                className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-2 text-sm font-semibold text-amber-400 transition hover:border-amber-400/40 hover:bg-amber-400/10 whitespace-nowrap">
                + Relier
              </button>
            </div>
          </div>

          {edgeError && (
            <p className="mt-2 text-xs text-red-400">{edgeError}</p>
          )}
        </div>
      )}

      {/* Ville de départ */}
      <div className="mb-4">
        <label className="block mb-2 text-sm text-slate-400">Ville de départ</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/50 transition"
          value={startCity ?? ""} onChange={e => setStartCity(e.target.value || null)}
        >
          <option value="">Automatique</option>
          {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
        </select>
      </div>

      {/* Algorithme */}
      <div className="mb-5">
        <label className="block mb-2 text-sm text-slate-400">Algorithme</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/50 transition"
          value={algorithm} onChange={e => setAlgorithm(e.target.value as Algorithm)}
        >
          {ALGORITHM_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || cities.length < 2}
        className={`
          relative w-full overflow-hidden rounded-xl px-6 py-3.5 text-sm font-bold tracking-wide transition-all
          ${loading || cities.length < 2
            ? "cursor-not-allowed bg-slate-800 text-slate-500"
            : "bg-sky-400 text-[#080B12] shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:bg-sky-300 hover:shadow-[0_0_32px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 active:translate-y-0"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Optimisation en cours…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">🚀 Optimiser la route</span>
        )}
      </button>

      {cities.length < 2 && (
        <p className="mt-3 text-center font-mono text-xs text-red-400/70">
          Ajoutez au moins 2 villes pour démarrer.
        </p>
      )}
    </form>
  );
}