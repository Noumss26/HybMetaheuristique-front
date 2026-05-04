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

/**
 * Pour le mode graphe complet : retourne uniquement les k voisins les plus
 * proches de chaque ville (paires dédoublonnées). Évite les O(n²) lignes
 * fantômes qui saturent la carte sur > 10 villes.
 */
function nearestNeighborPairs(
  cities: NormalizedCity[],
  k: number = 4,
): Array<[NormalizedCity, NormalizedCity]> {
  const seen = new Set<string>();
  const result: Array<[NormalizedCity, NormalizedCity]> = [];
  for (const a of cities) {
    const sorted = cities
      .filter(b => b.name !== a.name)
      .map(b => ({ b, d: Math.hypot(a.svgX - b.svgX, a.svgY - b.svgY) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, k);
    for (const { b } of sorted) {
      const key = [a.name, b.name].sort().join("__");
      if (!seen.has(key)) {
        seen.add(key);
        result.push([a, b]);
      }
    }
  }
  return result;
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
      <h3 className="mb-4 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 ring-1 ring-sky-400/20">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400">
            <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3z"/>
            <path d="M9 7v13"/><path d="M15 4v13"/>
          </svg>
        </span>
        Carte des itinéraires
        {isPartialGraph && (
          <span className="ml-auto rounded-full border border-amber-400/25 bg-amber-400/8 px-2 py-0.5 font-mono text-[10px] tracking-normal normal-case text-amber-400">
            partiel · {edges!.length} liens
          </span>
        )}
      </h3>

      <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-gradient-to-br from-[#0A0E1A] to-[#080B12]">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-label="Carte">
          <defs>
            {/* Grille géographique style GPS */}
            <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="rgba(56,189,248,0.08)" />
            </pattern>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(56,189,248,0.05)" strokeWidth="0.5" />
            </pattern>

            {/* Halo / glow */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="nodeGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>

            {/* Flèche directionnelle pour la route */}
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8" />
            </marker>

            {/* Gradient de route pour effet "flow" */}
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#38BDF8" stopOpacity="0.6" />
              <stop offset="50%"  stopColor="#7DD3FC" stopOpacity="1.0" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.6" />
            </linearGradient>

            {/* Pin GPS pour ville de départ */}
            <symbol id="pin" viewBox="0 0 24 32">
              <path d="M12 0 C5.4 0 0 5.4 0 12 c0 9 12 20 12 20 s12-11 12-20 C24 5.4 18.6 0 12 0 z"
                fill="#F59E0B" stroke="#FCD34D" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4.5" fill="#080B12" />
            </symbol>
          </defs>

          {/* Background composite : grille + dots */}
          <rect width={SVG_W} height={SVG_H} fill="url(#grid)" />
          <rect width={SVG_W} height={SVG_H} fill="url(#dots)" />

          {/*
            ── Couche 1 : connexions de fond ─────────────────────────
            • Graphe complet  → ghost lines très légères entre toutes les villes
            • Graphe partiel  → uniquement les arêtes autorisées en amber tamisé
          */}
          {!isPartialGraph
            ? nearestNeighborPairs(normalized, 4).map(([a, b], i) => (
                <line key={`g-${i}`}
                  x1={a.svgX} y1={a.svgY} x2={b.svgX} y2={b.svgY}
                  stroke="rgba(148,163,184,0.06)" strokeWidth="0.75"
                />
              ))
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
            ── Couche 2 : chemin optimal façon GPS ────────────────────
            • Trace épaisse semi-transparente en arrière-plan (effet "casing")
            • Trace fine au-dessus avec gradient et flèche directionnelle
            • Animation segment par segment (draw-in)
          */}
          {segments.map((s, i) => (
            <g key={`p-${i}`}>
              {/* Casing : ombre extérieure pour profondeur */}
              <line
                x1={s.from.svgX} y1={s.from.svgY}
                x2={s.to.svgX}   y2={s.to.svgY}
                stroke="rgba(56,189,248,0.25)" strokeWidth="6"
                strokeLinecap="round"
                className="path-draw"
                style={{ animationDelay: `${i * 80}ms` }}
              />
              {/* Trait principal avec gradient + flèche */}
              <line
                x1={s.from.svgX} y1={s.from.svgY}
                x2={s.to.svgX}   y2={s.to.svgY}
                stroke="url(#routeGrad)" strokeWidth="2.5"
                strokeLinecap="round"
                markerEnd="url(#arrow)"
                opacity="0.95" filter="url(#glow)"
                className="path-draw"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            </g>
          ))}

          {/*
            ── Couche 3 : nœuds réalistes ────────────────────────────
            • Ville de départ : pin GPS amber avec ombre portée
            • Étapes actives : nœud sky avec halo pulsant et numéro
            • Inactives : point discret
          */}
          {normalized.map(city => {
            const active  = optimalPath.includes(city.name);
            const idx     = optimalPath.indexOf(city.name);
            const isStart = idx === 0;

            return (
              <g key={city.name}>
                {/* Halo extérieur pulsant pour les étapes actives */}
                {active && !isStart && (
                  <>
                    <circle cx={city.svgX} cy={city.svgY} r={22}
                      fill="#38BDF8" opacity="0.06" className="halo-pulse" />
                    <circle cx={city.svgX} cy={city.svgY} r={14}
                      fill="#38BDF8" opacity="0.12" />
                  </>
                )}

                {/* Pin GPS pour la ville de départ — visuel franchement réaliste */}
                {isStart ? (
                  <use href="#pin"
                    x={city.svgX - 12} y={city.svgY - 28}
                    width="24" height="32"
                    filter="url(#nodeGlow)" />
                ) : (
                  <>
                    {/* Nœud principal pour étapes / villes inactives */}
                    <circle
                      cx={city.svgX} cy={city.svgY}
                      r={active ? 10 : 5}
                      fill={active ? "#38BDF8" : "#1E293B"}
                      stroke={active ? "#7DD3FC" : "rgba(255,255,255,0.12)"}
                      strokeWidth={active ? 2 : 1}
                      filter={active ? "url(#nodeGlow)" : "none"}
                    />
                    {/* Numéro d'étape */}
                    {active && idx !== -1 && (
                      <text x={city.svgX} y={city.svgY + 3.5}
                        textAnchor="middle"
                        fill="#080B12"
                        fontSize="9" fontWeight="800"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {idx + 1}
                      </text>
                    )}
                  </>
                )}

                {/* Label */}
                <text
                  x={city.svgX}
                  y={isStart ? city.svgY - 32 : city.svgY - 16}
                  textAnchor="middle"
                  fill={active ? "#CBD5E1" : "#475569"}
                  fontSize={isStart ? "12" : "11"}
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={isStart ? "700" : "600"}
                  style={isStart ? { textShadow: "0 1px 2px rgba(0,0,0,0.8)" } : undefined}
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