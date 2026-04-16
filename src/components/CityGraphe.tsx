// components/CityGraph.tsx
"use client";

import type { City } from "@/services/api";

const SVG_W   = 500;
const SVG_H   = 380;
const PADDING = 48;

interface NormalizedCity extends City { svgX: number; svgY: number; }
interface CityGraphProps { cities: City[]; optimalPath: string[]; }

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

export default function CityGraph({ cities, optimalPath }: CityGraphProps) {
  const normalized = normalizeCities(cities);
  const cityMap    = Object.fromEntries(normalized.map(c => [c.name, c]));

  const segments = optimalPath.length > 1
    ? optimalPath
        .map((name, i) => ({
          from: cityMap[name],
          to:   cityMap[optimalPath[(i + 1) % optimalPath.length]],
        }))
        .filter(s => s.from && s.to)
    : [];

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0F1521] p-6 shadow-[0_4px_32px_rgba(0,0,0,0.4)]">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-200">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-400/10 text-xs">🗺️</span>
        Carte des villes
      </h3>

      <div className="overflow-hidden rounded-xl border border-white/[0.05] bg-[#080B12]">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" aria-label="Carte">
          <defs>
            {/* Dot grid */}
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

          {/* Ghost connections */}
          {normalized.map((a, i) =>
            normalized.slice(i + 1).map((b, j) => (
              <line key={`g-${i}-${j}`}
                x1={a.svgX} y1={a.svgY} x2={b.svgX} y2={b.svgY}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"
              />
            ))
          )}

          {/* Optimal path segments */}
          {segments.map((s, i) => (
            <line key={`p-${i}`}
              x1={s.from.svgX} y1={s.from.svgY} x2={s.to.svgX} y2={s.to.svgY}
              stroke="#38BDF8" strokeWidth="2" strokeLinecap="round"
              opacity="0.85" filter="url(#glow)"
              className="path-draw"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}

          {/* City nodes */}
          {normalized.map(city => {
            const active = optimalPath.includes(city.name);
            const idx    = optimalPath.indexOf(city.name);
            return (
              <g key={city.name}>
                {active && (
                  <circle cx={city.svgX} cy={city.svgY} r={20}
                    fill="#38BDF8" opacity="0.08" />
                )}
                <circle
                  cx={city.svgX} cy={city.svgY}
                  r={active ? 11 : 6}
                  fill={active ? "#38BDF8" : "#1E293B"}
                  stroke={active ? "#7DD3FC" : "rgba(255,255,255,0.1)"}
                  strokeWidth={active ? 2 : 1}
                  filter={active ? "url(#nodeGlow)" : "none"}
                />
                {active && idx !== -1 && (
                  <text x={city.svgX} y={city.svgY + 4}
                    textAnchor="middle" fill="#080B12"
                    fontSize="9" fontWeight="700" fontFamily="JetBrains Mono, monospace"
                  >
                    {idx + 1}
                  </text>
                )}
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

      <p className="mt-3 text-center font-mono text-xs text-slate-600">
        {optimalPath.length
          ? `Itinéraire optimisé · ${optimalPath.length} étapes`
          : "Lancez l'optimisation pour visualiser l'itinéraire"}
      </p>
    </div>
  );
}