// services/api.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ────────────────────────────────────────────────

export type Algorithm = "antcolony" | "genetic" | "hybrid" | "local_search";

/**
 * Mode de sélection envoyé au backend :
 *   • "all" → benchmark des 4 algos (défaut)
 *   • Algorithm spécifique → focus sur un seul
 */
export type AlgorithmSelection = Algorithm | "all";

export interface City {
  name: string;
  x: number;
  y: number;
}

/**
 * Connexion bidirectionnelle entre deux villes.
 * city_a <-> city_b (les deux sens sont toujours valides).
 * Correspond exactement au modèle Edge du backend.
 */
export interface Edge {
  city_a: string;
  city_b: string;
}

export interface OptimizeRequest {
  cities: City[];
  algorithm: AlgorithmSelection;
  start_city?: string | null;
  /**
   * Si fourni → graphe partiel (seules ces connexions sont autorisées).
   * Si null/absent → graphe complet (comportement par défaut).
   */
  edges?: Edge[] | null;
}

export interface AlgoBreakdown {
  name: Algorithm;
  distance: number;
  time_ms: number;
}

export interface OptimizeResponse {
  optimal_path: string[];
  total_distance: number;
  algorithm_used: Algorithm;
  execution_time_ms: number;
  start_city: string | null;
  random_path: string[];
  random_distance: number;
  improvement_percent: number;
  breakdown?: AlgoBreakdown[];
}

// ── API call ─────────────────────────────────────────────

export async function optimizeRoute(
  payload: OptimizeRequest
): Promise<OptimizeResponse> {
  const body: Record<string, unknown> = {
    cities: payload.cities,
    algorithm: payload.algorithm,
    start_city: payload.start_city ?? null,
  };

  // N'envoyer edges que si explicitement fourni (null = graphe complet)
  if (payload.edges !== undefined) {
    body.edges = payload.edges;
  }

  const response = await fetch(`${API_BASE_URL}/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Erreur serveur (${response.status})`);
  }

  return response.json();
}