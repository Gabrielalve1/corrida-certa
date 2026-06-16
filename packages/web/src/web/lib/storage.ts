// localStorage helpers + tipos compartilhados do Corrida Certa

export interface Settings {
  kmPerLiter: number; // consumo do carro
  fuelPrice: number; // R$ por litro
  minPerKm: number; // R$/km considerado bom
}

export const DEFAULT_SETTINGS: Settings = {
  kmPerLiter: 11,
  fuelPrice: 6.0,
  minPerKm: 1.5,
};

export type RideStatus = "good" | "mid" | "bad";

export interface RideRecord {
  id: string;
  date: number; // timestamp
  value: number; // R$ oferecido
  km: number;
  min: number;
  perKm: number; // líquido por km
  perHour: number; // líquido por hora
  fuelCost: number;
  net: number; // líquido total
  status: RideStatus;
}

export type MarkerType = "shortcut" | "deadend" | "hot";

export interface MapMarker {
  id: string;
  type: MarkerType;
  title: string;
  note: string;
  lat: number;
  lng: number;
  date: number;
}

const KEYS = {
  settings: "cc_settings",
  rides: "cc_rides",
  markers: "cc_markers",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

// Settings
export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}
export function saveSettings(s: Settings) {
  write(KEYS.settings, s);
}

// Rides
export function getRides(): RideRecord[] {
  return read<RideRecord[]>(KEYS.rides, []);
}
export function addRide(r: RideRecord) {
  const rides = getRides();
  rides.unshift(r);
  write(KEYS.rides, rides.slice(0, 500));
}
export function deleteRide(id: string) {
  write(KEYS.rides, getRides().filter((r) => r.id !== id));
}
export function clearRidesToday() {
  const start = startOfToday();
  write(KEYS.rides, getRides().filter((r) => r.date < start));
}

// Markers
export function getMarkers(): MapMarker[] {
  return read<MapMarker[]>(KEYS.markers, []);
}
export function saveMarkers(m: MapMarker[]) {
  write(KEYS.markers, m);
}

// Util
export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
