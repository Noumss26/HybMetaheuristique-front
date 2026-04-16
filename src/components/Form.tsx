// components/Form.tsx
"use client";

import { useState } from "react";
import type { Algorithm, City } from "@/services/api";

// ── Constantes ───────────────────────────────────────────

const DEFAULT_CITIES: City[] = [
  { name: "Paris", x: 340, y: 120 },
  { name: "Lyon", x: 370, y: 260 },
  { name: "Marseille", x: 390, y: 380 },
  { name: "Bordeaux", x: 180, y: 300 },
  { name: "Lille", x: 310, y: 60 },

  { name: "City6", x: 120, y: 80 },
  { name: "City7", x: 150, y: 140 },
  { name: "City8", x: 200, y: 100 },
  { name: "City9", x: 260, y: 90 },
  { name: "City10", x: 400, y: 100 },

  { name: "City11", x: 450, y: 140 },
  { name: "City12", x: 480, y: 200 },
  { name: "City13", x: 430, y: 260 },
  { name: "City14", x: 410, y: 320 },
  { name: "City15", x: 380, y: 420 },

  { name: "City16", x: 300, y: 400 },
  { name: "City17", x: 250, y: 360 },
  { name: "City18", x: 200, y: 340 },
  { name: "City19", x: 150, y: 360 },
  { name: "City20", x: 100, y: 320 },

  { name: "City21", x: 80, y: 260 },
  { name: "City22", x: 60, y: 200 },
  { name: "City23", x: 90, y: 150 },
  { name: "City24", x: 130, y: 200 },
  { name: "City25", x: 170, y: 240 },

  { name: "City26", x: 220, y: 260 },
  { name: "City27", x: 260, y: 300 },
  { name: "City28", x: 310, y: 320 },
  { name: "City29", x: 350, y: 340 },
  { name: "City30", x: 390, y: 300 },

  { name: "City31", x: 430, y: 240 },
  { name: "City32", x: 470, y: 280 },
  { name: "City33", x: 500, y: 320 },
  { name: "City34", x: 520, y: 360 },
  { name: "City35", x: 480, y: 400 },

  { name: "City36", x: 420, y: 440 },
  { name: "City37", x: 360, y: 460 },
  { name: "City38", x: 300, y: 460 },
  { name: "City39", x: 240, y: 440 },
  { name: "City40", x: 180, y: 420 },

  { name: "City41", x: 120, y: 400 },
  { name: "City42", x: 80, y: 360 },
  { name: "City43", x: 60, y: 300 },
  { name: "City44", x: 40, y: 240 },
  { name: "City45", x: 40, y: 180 },

  { name: "City46", x: 60, y: 120 },
  { name: "City47", x: 100, y: 60 },
  { name: "City48", x: 160, y: 40 },
  { name: "City49", x: 220, y: 40 },
  { name: "City50", x: 280, y: 50 },

  { name: "City51", x: 340, y: 60 },
  { name: "City52", x: 400, y: 60 },
  { name: "City53", x: 460, y: 80 },
  { name: "City54", x: 520, y: 120 },
  { name: "City55", x: 540, y: 180 },

  { name: "City56", x: 560, y: 240 },
  { name: "City57", x: 540, y: 300 },
  { name: "City58", x: 520, y: 420 },
  { name: "City59", x: 460, y: 460 },
  { name: "City60", x: 400, y: 480 },
];

const ALGORITHM_OPTIONS: { value: Algorithm; label: string }[] = [
  { value: "hybrid",       label: "🔀 Hybrid (ACO + 2-opt)" },
  { value: "antcolony",    label: "🐜 Ant Colony"           },
  { value: "genetic",      label: "🧬 Génétique"            },
  { value: "local_search", label: "🔍 Local Search (2-opt)" },
];

// ── Types ────────────────────────────────────────────────

interface FormProps {
  onSubmit: (cities: City[], startCity: string | null, algorithm: Algorithm) => void;
  loading: boolean;
}

interface NewCityState { name: string; x: string; y: string; }

// ── Composant ────────────────────────────────────────────

export default function Form({ onSubmit, loading }: FormProps) {
  const [cities,    setCities]    = useState<City[]>(DEFAULT_CITIES);
  const [newCity,   setNewCity]   = useState<NewCityState>({ name: "", x: "", y: "" });
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [startCity, setStartCity] = useState<string | null>(null);
  const [algorithm, setAlgorithm] = useState<Algorithm>("hybrid");

  const handleFieldChange = (index: number, field: keyof City, value: string) =>
    setCities(prev => prev.map((c, i) =>
      i === index ? { ...c, [field]: field === "name" ? value : Number(value) } : c
    ));

  const handleAdd = () => {
    if (!newCity.name.trim() || newCity.x === "" || newCity.y === "") return;
    setCities(p => [...p, { name: newCity.name.trim(), x: +newCity.x, y: +newCity.y }]);
    setNewCity({ name: "", x: "", y: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cities.length >= 2) onSubmit(cities, startCity, algorithm);
  };

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
          onClick={() => setCities(DEFAULT_CITIES)}
          className="rounded-lg border border-white/[0.07] px-3 py-1.5 text-xs text-slate-400 transition hover:border-white/20 hover:text-slate-200"
        >
          Réinitialiser
        </button>
      </div>

      {/* City list */}
      <div className="mb-4 space-y-2">
        {cities.map((city, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-[#131C2E] px-3 py-2.5 transition hover:border-white/10"
          >
            <span className="font-mono text-xs font-bold text-sky-400 w-5 text-center shrink-0">
              {i + 1}
            </span>

            {editIndex === i ? (
              <>
                <input
                  className="flex-1 min-w-0 rounded-lg border border-white/10 bg-[#080B12] px-2.5 py-1.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/20 transition"
                  value={city.name}
                  onChange={e => handleFieldChange(i, "name", e.target.value)}
                  placeholder="Nom"
                />
                <input
                  type="number"
                  className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/20 transition"
                  value={city.x}
                  onChange={e => handleFieldChange(i, "x", e.target.value)}
                  placeholder="X"
                />
                <input
                  type="number"
                  className="w-16 rounded-lg border border-white/10 bg-[#080B12] px-2 py-1.5 text-sm font-mono text-slate-200 outline-none focus:border-sky-400/60 focus:ring-1 focus:ring-sky-400/20 transition"
                  value={city.y}
                  onChange={e => handleFieldChange(i, "y", e.target.value)}
                  placeholder="Y"
                />
                <button
                  type="button"
                  onClick={() => setEditIndex(null)}
                  className="ml-1 text-emerald-400 hover:text-emerald-300 transition text-lg leading-none"
                >✓</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm font-medium text-slate-200">{city.name}</span>
                <span className="font-mono text-xs text-slate-500">({city.x}, {city.y})</span>
                <button
                  type="button"
                  onClick={() => setEditIndex(i)}
                  className="ml-1 rounded-md p-1 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                  title="Modifier"
                >✏️</button>
                <button
                  type="button"
                  onClick={() => setCities(p => p.filter((_, idx) => idx !== i))}
                  className="rounded-md p-1 text-slate-600 transition hover:bg-red-500/10 hover:text-red-400"
                  title="Supprimer"
                >✕</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add city */}
      <div className="mb-5 flex items-center gap-2">
        <input
          className="flex-1 min-w-0 rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 focus:ring-1 focus:ring-sky-400/10 transition"
          placeholder="Nouvelle ville"
          value={newCity.name}
          onChange={e => setNewCity(p => ({ ...p, name: e.target.value }))}
        />
        <input
          type="number"
          className="w-16 rounded-xl border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 transition"
          placeholder="X"
          value={newCity.x}
          onChange={e => setNewCity(p => ({ ...p, x: e.target.value }))}
        />
        <input
          type="number"
          className="w-16 rounded-xl border border-white/[0.07] bg-[#131C2E] px-2 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-sky-400/50 transition"
          placeholder="Y"
          value={newCity.y}
          onChange={e => setNewCity(p => ({ ...p, y: e.target.value }))}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl border border-sky-400/20 bg-sky-400/5 px-3 py-2 text-sm font-semibold text-sky-400 transition hover:border-sky-400/40 hover:bg-sky-400/10 whitespace-nowrap"
        >
          + Ajouter
        </button>
      </div>

      {/* Ville de départ */}
      <div className="mb-4">
        <label className="block mb-2 text-sm text-slate-400">Ville de départ</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/50 transition"
          value={startCity ?? ""}
          onChange={e => setStartCity(e.target.value || null)}
        >
          <option value="">Automatique</option>
          {cities.map(city => (
            <option key={city.name} value={city.name}>{city.name}</option>
          ))}
        </select>
      </div>

      {/* Algorithme */}
      <div className="mb-5">
        <label className="block mb-2 text-sm text-slate-400">Algorithme</label>
        <select
          className="w-full rounded-xl border border-white/[0.07] bg-[#131C2E] px-3 py-2 text-sm text-slate-200 outline-none focus:border-sky-400/50 transition"
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value as Algorithm)}
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
          <span className="flex items-center justify-center gap-2">
            🚀 Optimiser la route
          </span>
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