import { useEffect, useRef, useState } from "react";
import { loadStrategyPoints, findNearest, TYPE_VOICE, distanceM, type StrategyPoint } from "../lib/brain";
import { getMarkers } from "../lib/storage";
import { speak, stopSpeaking } from "../lib/voice";

const ALERT_RADIUS = 300; // metros
const COOLDOWN = 90_000; // 90s sem repetir o mesmo ponto

const TYPE_UI = {
  shortcut: { color: "#16C784", emoji: "🟢", label: "Atalho" },
  deadend: { color: "#F0445A", emoji: "🔴", label: "Sem saída" },
  hot: { color: "#F5B82E", emoji: "🟡", label: "Ponto quente" },
};

export default function AutoMode() {
  const [on, setOn] = useState(false);
  const [points, setPoints] = useState<StrategyPoint[]>([]);
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [nearby, setNearby] = useState<{ point: StrategyPoint; dist: number }[]>([]);
  const [lastAlert, setLastAlert] = useState<string>("");
  const [error, setError] = useState("");

  const watchId = useRef<number | null>(null);
  const wakeLock = useRef<any>(null);
  const cooldowns = useRef<Map<string, number>>(new Map());

  // carrega pontos detectados + manuais
  useEffect(() => {
    (async () => {
      const auto = await loadStrategyPoints();
      const manual: StrategyPoint[] = getMarkers().map((m) => ({
        lat: m.lat, lng: m.lng, note: m.note || m.title,
        type: m.type, title: m.title,
      }));
      setPoints([...auto, ...manual]);
    })();
  }, []);

  function pointKey(p: StrategyPoint) {
    return `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`;
  }

  function onPosition(p: GeolocationPosition) {
    const cur = { lat: p.coords.latitude, lng: p.coords.longitude };
    setPos(cur);
    setAccuracy(p.coords.accuracy);
    setSpeed(p.coords.speed != null ? p.coords.speed * 3.6 : null); // m/s -> km/h

    // lista os 3 mais próximos (até 1.5km) pra mostrar na tela
    const withDist = points
      .map((pt) => ({ point: pt, dist: distanceM(cur, pt) }))
      .filter((x) => x.dist <= 1500)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);
    setNearby(withDist);

    // alerta de voz no mais próximo dentro do raio
    const hit = findNearest(cur, points, ALERT_RADIUS);
    if (hit) {
      const key = pointKey(hit.point);
      const now = Date.now();
      const last = cooldowns.current.get(key) || 0;
      if (now - last > COOLDOWN) {
        cooldowns.current.set(key, now);
        const phrase = TYPE_VOICE[hit.point.type](hit.point.note, hit.dist);
        speak(phrase);
        setLastAlert(`${TYPE_UI[hit.point.type].emoji} ${phrase}`);
      }
    }
  }

  async function requestWakeLock() {
    try {
      // @ts-ignore
      if ("wakeLock" in navigator) {
        // @ts-ignore
        wakeLock.current = await navigator.wakeLock.request("screen");
      }
    } catch {}
  }

  function start() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Seu navegador não tem GPS. Use o Safari no iPhone.");
      return;
    }
    setOn(true);
    requestWakeLock();
    speak("Modo automático ligado. Vou avisar os atalhos pra você.");
    watchId.current = navigator.geolocation.watchPosition(
      onPosition,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Permita o acesso à localização (GPS) pra usar o modo automático.");
          stop();
        }
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    );
  }

  function stop() {
    setOn(false);
    stopSpeaking();
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (wakeLock.current) { try { wakeLock.current.release(); } catch {} wakeLock.current = null; }
    speak("Modo automático desligado.");
  }

  // reativa wakelock ao voltar pro app
  useEffect(() => {
    function onVis() { if (on && document.visibilityState === "visible") requestWakeLock(); }
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      if (wakeLock.current) { try { wakeLock.current.release(); } catch {} }
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);

  const counts = {
    shortcut: points.filter((p) => p.type === "shortcut").length,
    deadend: points.filter((p) => p.type === "deadend").length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="px-1">
        <h2 style={{ fontWeight: 800, fontSize: 22 }}>🧠 Piloto automático</h2>
        <p style={{ color: "var(--cc-text2)", fontSize: 13, marginTop: 2 }}>
          O app já conhece <b style={{ color: "var(--cc-good)" }}>{counts.shortcut} atalhos</b> e <b style={{ color: "var(--cc-bad)" }}>{counts.deadend} ruas sem saída</b> de São Carlos. Liga uma vez e ele avisa sozinho.
        </p>
      </div>

      {/* BOTÃO LIGA/DESLIGA */}
      <button
        className="cc-btn"
        onClick={on ? stop : start}
        style={{
          height: 76,
          fontSize: 20,
          background: on ? "var(--cc-bad)" : "linear-gradient(135deg,#16C784,#0e9e68)",
          color: on ? "#fff" : "#06281c",
          boxShadow: on ? "none" : "0 8px 24px rgba(22,199,132,0.35)",
        }}
      >
        {on ? "⏹  Desligar piloto automático" : "▶  Ligar piloto automático"}
      </button>

      {error && (
        <div className="cc-card p-3" style={{ background: "#f0445a1a", borderColor: "#f0445a66", fontSize: 14 }}>
          ⚠️ {error}
        </div>
      )}

      {/* STATUS */}
      {on && (
        <div className="cc-card p-4 cc-fade" style={{ background: "var(--cc-card)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--cc-good)", animation: "ccPing 1.4s infinite" }} />
            <span style={{ fontWeight: 700, color: "var(--cc-good)" }}>Rastreando São Carlos…</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{speed != null ? Math.round(speed) : "—"}</div>
              <div style={{ fontSize: 11, color: "var(--cc-text2)" }}>km/h</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{accuracy != null ? `${Math.round(accuracy)}m` : "—"}</div>
              <div style={{ fontSize: 11, color: "var(--cc-text2)" }}>precisão GPS</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{nearby.length}</div>
              <div style={{ fontSize: 11, color: "var(--cc-text2)" }}>pontos perto</div>
            </div>
          </div>
        </div>
      )}

      {/* ÚLTIMO AVISO */}
      {on && lastAlert && (
        <div className="cc-card p-4 cc-fade" style={{ background: "#16c7841a", borderColor: "#16c78466" }}>
          <div className="cc-label" style={{ color: "var(--cc-good)" }}>Último aviso falado</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{lastAlert}</div>
        </div>
      )}

      {/* PONTOS PRÓXIMOS */}
      {on && (
        <div className="flex flex-col gap-2">
          <div className="cc-label px-1">Próximos a você</div>
          {nearby.length === 0 && (
            <div className="cc-card p-5 text-center" style={{ color: "var(--cc-text2)", fontSize: 14 }}>
              Nenhum atalho por perto agora. Dirigindo, eu aviso a 300m.
            </div>
          )}
          {nearby.map((n, i) => {
            const ui = TYPE_UI[n.point.type];
            return (
              <div key={i} className="cc-card p-3 flex items-center gap-3">
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: ui.color, flex: "0 0 12px" }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontWeight: 700, fontSize: 14, color: ui.color }}>{ui.label}</div>
                  <div style={{ fontSize: 13, color: "var(--cc-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.point.note}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, flex: "0 0 auto" }}>{Math.round(n.dist)}m</div>
              </div>
            );
          })}
        </div>
      )}

      {!on && (
        <div className="cc-card p-4" style={{ fontSize: 14, color: "var(--cc-text2)", lineHeight: 1.6 }}>
          <b style={{ color: "var(--cc-text)" }}>Como funciona:</b><br />
          O app analisou o mapa de São Carlos e achou passagens que cortam caminho (atalhos que a Uber manda dar a volta) e ruas sem saída. Com o piloto ligado, quando o carro chega a <b style={{ color: "var(--cc-good)" }}>300m</b> de um ponto, ele <b style={{ color: "var(--cc-text)" }}>fala sozinho</b>. Seu pai não toca em nada.
          <br /><br />
          <span style={{ fontSize: 12 }}>📍 Precisa permitir <b>localização</b> e <b>som</b>. Mantenha a tela ligada (o app segura ela acordada). Funciona melhor no Safari do iPhone.</span>
        </div>
      )}
    </div>
  );
}
