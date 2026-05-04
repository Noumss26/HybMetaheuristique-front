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
  { value: "hybrid",       label: "Hybrid  ·  ACO + GA + 2-opt" },
  { value: "antcolony",    label: "Ant Colony Optimization"     },
  { value: "genetic",      label: "Genetic Algorithm"           },
  { value: "local_search", label: "Local Search  ·  2-opt"      },
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

  // Auto-activer le mode graphe partiel dès qu'une arête est ajoutée.
  // Évite le bug silencieux où l'utilisateur configure des connexions
  // mais oublie de basculer le toggle → backend reçoit edges=null
  // et utilise un graphe complet, ignorant la configuration de l'utilisateur.
  const handleAutoGenerate = () => {
    setEdgeError(null);
    setEdges(generateEdges(cities, kNeighbors));
    setUsePartialGraph(true);
  };

  const handleAddEdge = () => {
    setEdgeError(null);
    const { city_a, city_b } = newEdge;
    if (!city_a || !city_b)          { setEdgeError("Sélectionnez deux villes."); return; }
    if (city_a === city_b)           { setEdgeError("Les deux villes doivent être différentes."); return; }
    if (edgeExists(edges, city_a, city_b)) { setEdgeError("Cette connexion existe déjà."); return; }
    setEdges(prev => [...prev, { city_a, city_b }]);
    setNewEdge({ city_a: "", city_b: "" });
    setUsePartialGraph(true);  // garantit que les arêtes seront envoyées au backend
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
      className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#0F1521] to-[#0B121F] shadow-[0_4px_32px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-4">
        <h2 className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 ring-1 ring-sky-400/20">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </span>
          Villes à livrer
          <span className="font-mono text-[10px] tracking-normal normal-case text-slate-600 ml-1">
            {cities.length}
          </span>
        </h2>
        <button
          type="button"
          onClick={() => { setCities(DEFAULT_CITIES); setEdges([]); }}
          className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-white/20 hover:bg-white/[0.03] hover:text-slate-200"
        >
          Réinitialiser
        </button>
      </div>

      <div className="px-6 py-5">

      {/* Liste des villes */}
      <div className="mb-4 max-h-64 overflow-y-auto space-y-1.5 pr-1">
        {cities.map((city, i) => (
          <div key={i}
            className="group flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.015] px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.03]"
          >
            <span className="font-mono text-[10px] font-bold text-sky-400 w-6 text-center shrink-0 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>

            {editIndex === i ? (
              <>
                <input className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#080B12] px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/60 transition"
                  value={city.name} onChange={e => handleFieldChange(i, "name", e.target.value)} placeholder="Nom" />
                <input type="number" className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 transition"
                  value={city.x} onChange={e => handleFieldChange(i, "x", e.target.value)} placeholder="X" />
                <input type="number" className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 transition"
                  value={city.y} onChange={e => handleFieldChange(i, "y", e.target.value)} placeholder="Y" />
                <button type="button" onClick={() => setEditIndex(null)} title="Valider"
                  className="ml-1 rounded-md p-1 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300 transition">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-200">{city.name}</span>
                <span className="font-mono text-[10px] text-slate-500 tabular-nums">{city.x}, {city.y}</span>
                <button type="button" onClick={() => setEditIndex(i)} title="Modifier"
                  className="rounded-md p-1 text-slate-500 opacity-0 group-hover:opacity-100 transition hover:bg-white/5 hover:text-slate-200">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button type="button" onClick={() => handleRemoveCity(i)} title="Supprimer"
                  className="rounded-md p-1 text-slate-600 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/10 hover:text-red-400">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
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
      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
        <div>
          <p className="text-[13px] font-semibold text-slate-200">Connexions personnalisées</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
            {usePartialGraph
              ? "Seules les connexions définies sont autorisées"
              : "Graphe complet — toutes les villes sont reliées"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setUsePartialGraph(p => !p); setEdgeError(null); }}
          className={`relative h-6 w-11 rounded-full transition-colors ${usePartialGraph ? "bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]" : "bg-slate-700"}`}
          aria-label="Activer le graphe partiel"
        >
          <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${usePartialGraph ? "translate-x-5" : "translate-x-0"}`} />
        </button>
      </div>

      {/* Section arêtes */}
      {usePartialGraph && (
        <div className="mb-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Connexions autorisées
            <span className="ml-auto font-mono text-[10px] tracking-normal normal-case text-amber-400/60">
              {edges.length} lien{edges.length !== 1 ? "s" : ""}
            </span>
          </h3>

          {/* Génération automatique */}
          <div className="mb-4 rounded-lg border border-white/[0.05] bg-[#0B121F] p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">Génération automatique</p>
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
              className="w-full rounded-lg border border-amber-400/30 bg-amber-400/[0.08] py-2 text-xs font-semibold uppercase tracking-wider text-amber-400 transition hover:border-amber-400/50 hover:bg-amber-400/[0.15]"
            >
              Générer · {cities.length} villes
            </button>

            {edges.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-emerald-400/70">
                {edges.length} connexions · graphe connexe garanti
              </p>
            )}
          </div>

          {/* Liste des arêtes */}
          {edges.length > 0 && (
            <div className="mb-3 max-h-40 overflow-y-auto space-y-1 pr-1">
              {edges.map((edge, i) => (
                <div key={i}
                  className="group flex items-center gap-2 rounded-lg border border-white/[0.04] bg-[#0B121F] px-3 py-1.5 text-xs">
                  <span className="text-slate-300 font-medium">{edge.city_a}</span>
                  <span className="text-amber-400/50 font-mono">↔</span>
                  <span className="text-slate-300 font-medium">{edge.city_b}</span>
                  <button type="button" onClick={() => handleRemoveEdge(i)} title="Supprimer"
                    className="ml-auto rounded p-0.5 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {edges.length === 0 && (
            <p className="mb-3 text-[11px] text-amber-400/60 italic">
              Aucune connexion — cliquez sur Générer pour éviter l'erreur de connexité.
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
        <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Ville de départ</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/50 focus:bg-white/[0.04] transition"
          value={startCity ?? ""} onChange={e => setStartCity(e.target.value || null)}
        >
          <option value="">Automatique</option>
          {cities.map(city => <option key={city.name} value={city.name}>{city.name}</option>)}
        </select>
      </div>

      {/* Algorithme */}
      <div className="mb-5">
        <label className="block mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">Algorithme</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-400/50 focus:bg-white/[0.04] transition"
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
          group relative w-full overflow-hidden rounded-xl px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.12em] transition-all duration-300
          ${loading || cities.length < 2
            ? "cursor-not-allowed bg-slate-800 text-slate-500"
            : "bg-gradient-to-r from-sky-400 to-sky-500 text-[#080B12] shadow-[0_0_24px_rgba(56,189,248,0.25)] hover:shadow-[0_0_36px_rgba(56,189,248,0.5)] hover:-translate-y-0.5 active:translate-y-0"
          }
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Optimisation en cours
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Optimiser la route
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </span>
        )}
      </button>

      {cities.length < 2 && (
        <p className="mt-3 text-center font-mono text-[11px] text-red-400/70">
          Ajoutez au moins 2 villes pour démarrer.
        </p>
      )}

      </div>
    </form>
  );
}