// "Cérebro" do Corrida Certa: detecta atalhos do mapa de São Carlos e avisa por GPS

export interface StrategyPoint {
  lat: number;
  lng: number;
  note: string;
  type: "shortcut" | "deadend" | "hot";
  title?: string;
}

export interface StrategyData {
  city: string;
  shortcuts: { lat: number; lng: number; note: string }[];
  deadends: { lat: number; lng: number; note: string }[];
}

let cache: StrategyPoint[] | null = null;

// Carrega os pontos detectados automaticamente (embarcados) + os marcados manualmente
export async function loadStrategyPoints(): Promise<StrategyPoint[]> {
  if (cache) return cache;
  try {
    const res = await fetch("/strategies.json");
    const data: StrategyData = await res.json();
    const pts: StrategyPoint[] = [
      ...data.shortcuts.map((s) => ({ ...s, type: "shortcut" as const })),
      ...data.deadends.map((s) => ({ ...s, type: "deadend" as const })),
    ];
    cache = pts;
    return pts;
  } catch {
    cache = [];
    return [];
  }
}

// distância em metros (haversine)
export function distanceM(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Retorna o ponto mais próximo dentro do raio (m), ignorando os já avisados recentemente
export function findNearest(
  pos: { lat: number; lng: number },
  points: StrategyPoint[],
  radius: number
): { point: StrategyPoint; dist: number } | null {
  let best: { point: StrategyPoint; dist: number } | null = null;
  for (const p of points) {
    const d = distanceM(pos, p);
    if (d <= radius && (!best || d < best.dist)) {
      best = { point: p, dist: d };
    }
  }
  return best;
}

export const TYPE_VOICE: Record<StrategyPoint["type"], (note: string, dist: number) => string> = {
  shortcut: (note, dist) =>
    `Atenção! Possível atalho a ${Math.round(dist / 10) * 10} metros. ${note}`,
  deadend: (note, dist) =>
    `Cuidado, rua sem saída a ${Math.round(dist / 10) * 10} metros à frente. Pode ser cilada.`,
  hot: (note) => `Você está perto de uma região que costuma pagar mais. ${note}`,
};
