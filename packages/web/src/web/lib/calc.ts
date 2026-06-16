import type { RideStatus, Settings } from "./storage";

export interface CalcResult {
  perKm: number; // líquido por km (descontando combustível)
  perHour: number; // líquido por hora
  fuelCost: number; // custo de combustível da corrida
  net: number; // valor líquido total
  status: RideStatus;
  grossPerKm: number; // bruto por km (sem descontar)
}

// Calcula resultado de uma corrida descontando combustível
export function calcRide(
  value: number,
  km: number,
  min: number,
  s: Settings
): CalcResult {
  const safeKm = km > 0 ? km : 0;
  const safeMin = min > 0 ? min : 0;

  const litros = s.kmPerLiter > 0 ? safeKm / s.kmPerLiter : 0;
  const fuelCost = litros * s.fuelPrice;
  const net = value - fuelCost;

  const perKm = safeKm > 0 ? net / safeKm : 0;
  const grossPerKm = safeKm > 0 ? value / safeKm : 0;
  const perHour = safeMin > 0 ? net / (safeMin / 60) : 0;

  // Semáforo baseado no líquido por km vs mínimo configurado
  const min1 = s.minPerKm;
  let status: RideStatus;
  if (perKm >= min1) status = "good";
  else if (perKm >= min1 * 0.7) status = "mid";
  else status = "bad";

  return { perKm, perHour, fuelCost, net, status, grossPerKm };
}

export const STATUS_INFO: Record<
  RideStatus,
  { label: string; color: string; emoji: string }
> = {
  good: { label: "Compensa", color: "#16C784", emoji: "🟢" },
  mid: { label: "Na média", color: "#F5B82E", emoji: "🟡" },
  bad: { label: "Não compensa", color: "#F0445A", emoji: "🔴" },
};

export function brl(n: number): string {
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function num2(n: number): string {
  if (!isFinite(n)) return "0,00";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
