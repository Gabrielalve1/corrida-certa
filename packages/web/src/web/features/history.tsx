import { useState } from "react";
import { getRides, deleteRide, clearRidesToday, startOfToday, type RideRecord } from "../lib/storage";
import { STATUS_INFO, brl } from "../lib/calc";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(ts: number) {
  return new Date(ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function History() {
  const [rides, setRides] = useState<RideRecord[]>(getRides());

  const today = startOfToday();
  const todayRides = rides.filter((r) => r.date >= today);
  const good = todayRides.filter((r) => r.status === "good").length;
  const avgPerKm =
    todayRides.length > 0
      ? todayRides.reduce((a, r) => a + r.perKm, 0) / todayRides.length
      : 0;
  const totalNet = todayRides.reduce((a, r) => a + r.net, 0);

  function remove(id: string) {
    deleteRide(id);
    setRides(getRides());
  }
  function clearToday() {
    if (!confirm("Limpar todas as corridas de hoje?")) return;
    clearRidesToday();
    setRides(getRides());
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumo do dia */}
      <div className="cc-card p-4">
        <div className="cc-label mb-3">Resumo de hoje</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div style={{ fontSize: 26, fontWeight: 800 }}>{todayRides.length}</div>
            <div style={{ fontSize: 11, color: "var(--cc-text2)", fontWeight: 600 }}>corridas</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--cc-good)" }}>{good}</div>
            <div style={{ fontSize: 11, color: "var(--cc-text2)", fontWeight: 600 }}>compensaram</div>
          </div>
          <div className="text-center">
            <div style={{ fontSize: 26, fontWeight: 800 }}>{brl(avgPerKm)}</div>
            <div style={{ fontSize: 11, color: "var(--cc-text2)", fontWeight: 600 }}>média/km</div>
          </div>
        </div>
        <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--cc-border)" }}>
          <span style={{ fontSize: 13, color: "var(--cc-text2)", fontWeight: 500 }}>Líquido total do dia</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--cc-good)" }}>{brl(totalNet)}</span>
        </div>
      </div>

      {todayRides.length > 0 && (
        <button
          className="cc-btn"
          onClick={clearToday}
          style={{ height: 44, fontSize: 14, background: "var(--cc-elev)", color: "var(--cc-bad)", border: "1px solid var(--cc-border)" }}
        >
          Limpar corridas de hoje
        </button>
      )}

      {/* Lista */}
      <div className="flex flex-col gap-2">
        {rides.length === 0 && (
          <div className="cc-card p-8 text-center" style={{ color: "var(--cc-text2)" }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>📋</div>
            Nenhuma corrida salva ainda.<br />Calcule uma corrida e toque em "Salvar".
          </div>
        )}
        {rides.map((r) => {
          const info = STATUS_INFO[r.status];
          return (
            <div key={r.id} className="cc-card p-3 flex items-center gap-3">
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: info.color, flex: "0 0 12px" }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{brl(r.value)}</span>
                  <span style={{ fontSize: 12, color: "var(--cc-text2)" }}>· {r.km.toString().replace(".", ",")} km</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--cc-text2)" }}>
                  {brl(r.perKm)}/km · {brl(r.perHour)}/h · {fmtDay(r.date)} {fmtTime(r.date)}
                </div>
              </div>
              <button
                onClick={() => remove(r.id)}
                style={{ background: "transparent", border: "none", color: "var(--cc-text2)", cursor: "pointer", padding: 6 }}
                aria-label="excluir"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
