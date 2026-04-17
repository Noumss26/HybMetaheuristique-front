// components/CityGraph.tsx
"use client";

import type { City, Edge } from "@/services/api";

const SVG_W   = 500;
const SVG_H   = 380;
const PADDING = 48;

interface NormalizedCity extends City { svgX: number; svgY: number; }

interface CityGraphProps {
  cities:      City[];
  optimalPath: string[];
  edges?:      Edge[];       // connexions autorisées (graphe partiel)
}

function normalizeCities(cities: City[]): NormalizedCity[] {
  if (!cities.length) return [];
  const xs = cities.map(c => c.x), ys = cities.map(c => c.y);
  const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
  const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
  const rx = maxX - minX || 1, ry = maxY - minY || 1;
  return cities.map(c => ({
    ...c,
    svgX: PADDING + ((c.x - minX) / rx) * (SVG_W - 2 * PADDING),
    svgY: PADDING + ((c.y - minY) / ry) * (SVG_H - 2 * PADDING),
  }));
}

/** Vérifie si une arête (a→b) fait partie du chemin optimal (dans un sens ou l'autre) */
function isOptimalEdge(a: string, b: string, optimalPath: string[]): boolean {
  for (let i = 0; i < optimalPath.length; i++) {
    const from = optimalPath[i];
    const to   = optimalPath[(i + 1) % optimalPath.length];
    if ((from === a && to === b) || (from === b && to === a)) return true;
  }
  return false;
}

export default function CityGraph({ cities, optimalPath, edges }: CityGraphProps) {
  const normalized = normalizeCities(cities);
  const cityMap    = Object.fromEntries(normalized.map(c => [c.name, c]));
  const isPartialGraph = edges !== undefined && edges.length > 0;

  // Segments du chemin optimal
  const segments = optimalPath.length > 1
    ? optimalPath
        .map((name, i) => ({
          from: cityMap[name],
          to:   cityMap[optimalPath[(i + 1) % optimalPath.length]],
          fromName: name,
          toName:   optimalPath[(i + 1) % optimalPath.length],
        }))
        .filter(s => s.from && s.to)
    : [];

  // Arêtes autorisées du graphe partiel (hors chemin optimal)
  const allowedEdgeSegments = isPartialGraph
    ? edges!
        .map(e => ({
          from:     cityMap[e.city_a],
          to:       cityMap[e.city_b],
          fromName: e.city_a,
          toName:   e.city_b,
        }))
        .filter(s => s.from && s.to)
    : [];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0F1521] p-6 shadow-[0_4px_32px_rgba(0,0,0,0.4)]">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 text-xs">🗺️</span>
        Carte des villes
        {isPartialGraph && (
          <span className="ml-auto rounded-full border border-amber-400/20 bg-amber-400/5 px-2 py-0.5 font-mono text-xs font-normal text-amber-400">
            graphe partiel · {edges!.length} liens
          </span>
        )}
      </h3>

      <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#080B12]">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-label="Carte">
          <defs>
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(255,255,255,0.06)" />
            </pattern>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Background */}
          <rect width={SVG_W} height={SVG_H} fill="url(#dots)" />

          {/*
            ── Couche 1 : connexions de fond ─────────────────────────
            • Graphe complet  → ghost lines très légères entre toutes les villes
            • Graphe partiel  → uniquement les arêtes autorisées en amber tamisé
          */}
          {!isPartialGraph
            ? normalized.map((a, i) =>
                normalized.slice(i + 1).map((b, j) => (
                  <line key={`g-${i}-${j}`}
                    x1={a.svgX} y1={a.svgY} x2={b.svgX} y2={b.svgY}
                    stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                  />
                ))
              )
            : allowedEdgeSegments.map((s, i) => {
                const onPath = isOptimalEdge(s.fromName, s.toName, optimalPath);
                return !onPath ? (
                  <line key={`e-${i}`}
                    x1={s.from.svgX} y1={s.from.svgY}
                    x2={s.to.svgX}   y2={s.to.svgY}
                    stroke="rgba(251,191,36,0.18)" strokeWidth="1.5"
                    strokeDasharray="5 4" strokeLinecap="round"
                  />
                ) : null;
              })
          }

          {/*
            ── Couche 2 : chemin optimal ──────────────────────────────
            Tracé en sky-400 avec glow, animé segment par segment.
          */}
          {segments.map((s, i) => (
            <line key={`p-${i}`}
              x1={s.from.svgX} y1={s.from.svgY}
              x2={s.to.svgX}   y2={s.to.svgY}
              stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round"
              opacity="0.9" filter="url(#glow)"
              className="path-draw"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}

          {/*
            ── Couche 3 : nœuds ──────────────────────────────────────
            Actif (dans chemin optimal) → sky-400, grand, numéroté.
            Inactif → slate discret.
          */}
          {normalized.map(city => {
            const active = optimalPath.includes(city.name);
            const idx    = optimalPath.indexOf(city.name);
            const isStart = idx === 0;

            return (
              <g key={city.name}>
                {/* Halo */}
                {active && (
                  <circle cx={city.svgX} cy={city.svgY} r={20}
                    fill={isStart ? "#F59E0B" : "#38BDF8"} opacity="0.10" />
                )}

                {/* Nœud principal */}
                <circle
                  cx={city.svgX} cy={city.svgY}
                  r={active ? 11 : 6}
                  fill={isStart ? "#F59E0B" : active ? "#38BDF8" : "#1E293B"}
                  stroke={isStart ? "#FCD34D" : active ? "#7DD3FC" : "rgba(255,255,255,0.1)"}
                  strokeWidth={active ? 2 : 1}
                  filter={active ? "url(#nodeGlow)" : "none"}
                />

                {/* Numéro d'étape */}
                {active && idx !== -1 && (
                  <text x={city.svgX} y={city.svgY + 4}
                    textAnchor="middle"
                    fill={isStart ? "#080B12" : "#080B12"}
                    fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace"
                  >
                    {idx + 1}
                  </text>
                )}

                {/* Label */}
                <text x={city.svgX} y={city.svgY - 18}
                  textAnchor="middle"
                  fill={active ? "#94A3B8" : "#475569"}
                  fontSize="11" fontFamily="DM Sans, sans-serif" fontWeight="600"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Légende */}
      <div className="mt-3 flex items-center justify-between">
        <p className="font-mono text-xs text-slate-600">
          {optimalPath.length
            ? `Itinéraire optimisé · ${optimalPath.length} étapes`
            : "Lancez l'optimisation pour visualiser l'itinéraire"}
        </p>
        {isPartialGraph && (
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="rgba(251,191,36,0.4)" strokeWidth="1.5" strokeDasharray="5 4"/></svg>
              connexion autorisée
            </span>
            <span className="flex items-center gap-1">
              <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#38BDF8" strokeWidth="2.5"/></svg>
              chemin optimal
            </span>
          </div>
        )}
      </div>
    </div>
  );
}