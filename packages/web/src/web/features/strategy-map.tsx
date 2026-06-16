import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getMarkers, saveMarkers, uid, type MapMarker, type MarkerType } from "../lib/storage";
import { loadStrategyPoints, type StrategyPoint } from "../lib/brain";

const SAO_CARLOS: [number, number] = [-22.0175, -47.8908];

const TYPE_INFO: Record<MarkerType, { label: string; color: string; emoji: string; desc: string }> = {
  shortcut: { label: "Atalho", color: "#16C784", emoji: "🟢", desc: "GPS manda dar a volta mas TEM passagem" },
  deadend: { label: "Rua sem saída", color: "#F0445A", emoji: "🔴", desc: "Cilada — evitar" },
  hot: { label: "Ponto quente", color: "#F5B82E", emoji: "🟡", desc: "Costuma ter tarifa dinâmica / paga mais" },
};

function pinIcon(type: MarkerType) {
  return L.divIcon({
    className: "",
    html: `<div class="cc-pin" style="background:${TYPE_INFO[type].color}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

export default function StrategyMap() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const [markers, setMarkers] = useState<MapMarker[]>(getMarkers());
  const [autoPoints, setAutoPoints] = useState<StrategyPoint[]>([]);
  const [showAuto, setShowAuto] = useState(true);
  const autoLayerRef = useRef<L.LayerGroup | null>(null);
  const [adding, setAdding] = useState<MarkerType | null>(null);
  const [editing, setEditing] = useState<MapMarker | null>(null);
  const [form, setForm] = useState({ title: "", note: "" });
  const [pendingLatLng, setPendingLatLng] = useState<[number, number] | null>(null);

  // init map
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true }).setView(SAO_CARLOS, 14);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 20,
    }).addTo(map);
    autoLayerRef.current = L.layerGroup().addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    loadStrategyPoints().then(setAutoPoints);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // render dos pontos detectados automaticamente
  useEffect(() => {
    const layer = autoLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showAuto) return;
    autoPoints.forEach((p) => {
      const color = p.type === "shortcut" ? "#16C784" : p.type === "deadend" ? "#F0445A" : "#F5B82E";
      L.circleMarker([p.lat, p.lng], {
        radius: 5, color, weight: 1.5, fillColor: color, fillOpacity: 0.55,
      })
        .bindPopup(
          `<div style="font-family:Poppins,sans-serif;min-width:150px">
            <div style="font-weight:700;color:${color};font-size:12px">${p.type === "shortcut" ? "🟢 Atalho detectado" : "🔴 Sem saída detectada"}</div>
            <div style="font-size:12px;color:#444;margin-top:3px">${escapeHtml(p.note)}</div>
            <div style="font-size:10px;color:#999;margin-top:5px">Detectado pelo app (mapa de São Carlos)</div>
          </div>`
        )
        .addTo(layer);
    });
  }, [autoPoints, showAuto]);

  // handle map clicks for adding
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    function onClick(e: L.LeafletMouseEvent) {
      if (!adding) return;
      setPendingLatLng([e.latlng.lat, e.latlng.lng]);
      setForm({ title: "", note: "" });
    }
    map.on("click", onClick);
    return () => { map.off("click", onClick); };
  }, [adding]);

  // render markers
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    markers.forEach((m) => {
      const mk = L.marker([m.lat, m.lng], { icon: pinIcon(m.type) }).addTo(layer);
      const info = TYPE_INFO[m.type];
      mk.bindPopup(
        `<div style="font-family:Poppins,sans-serif;min-width:160px">
          <div style="font-weight:700;color:${info.color};font-size:13px">${info.emoji} ${info.label}</div>
          <div style="font-weight:700;margin-top:2px">${escapeHtml(m.title) || "(sem título)"}</div>
          ${m.note ? `<div style="font-size:12px;color:#444;margin-top:4px">${escapeHtml(m.note)}</div>` : ""}
          <div style="font-size:10px;color:#999;margin-top:6px">${new Date(m.date).toLocaleDateString("pt-BR")}</div>
        </div>`
      );
      mk.on("popupopen", () => {});
    });
  }, [markers]);

  function startAdd(type: MarkerType) {
    setAdding(type);
    setEditing(null);
    setPendingLatLng(null);
  }

  function confirmAdd() {
    if (!pendingLatLng || !adding) return;
    const next = [
      ...markers,
      { id: uid(), type: adding, title: form.title.trim(), note: form.note.trim(), lat: pendingLatLng[0], lng: pendingLatLng[1], date: Date.now() },
    ];
    setMarkers(next); saveMarkers(next);
    setAdding(null); setPendingLatLng(null); setForm({ title: "", note: "" });
  }

  function saveEdit() {
    if (!editing) return;
    const next = markers.map((m) => m.id === editing.id ? { ...m, title: form.title.trim(), note: form.note.trim() } : m);
    setMarkers(next); saveMarkers(next);
    setEditing(null);
  }

  function removeMarker(id: string) {
    const next = markers.filter((m) => m.id !== id);
    setMarkers(next); saveMarkers(next);
    setEditing(null);
  }

  function openEdit(m: MapMarker) {
    setEditing(m); setAdding(null); setPendingLatLng(null);
    setForm({ title: m.title, note: m.note });
    mapRef.current?.setView([m.lat, m.lng], 16);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>Mapa de estratégias</h2>
      </div>

      {/* Pontos detectados automaticamente */}
      <button
        onClick={() => setShowAuto((s) => !s)}
        className="cc-card p-3 flex items-center justify-between text-left"
        style={{ cursor: "pointer", background: showAuto ? "#16c7841a" : "var(--cc-card)", borderColor: showAuto ? "#16c78466" : "var(--cc-border)" }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>🧠 Atalhos detectados pelo app</div>
          <div style={{ fontSize: 12, color: "var(--cc-text2)" }}>
            {autoPoints.filter((p) => p.type === "shortcut").length} atalhos · {autoPoints.filter((p) => p.type === "deadend").length} ruas sem saída
          </div>
        </div>
        <div style={{ width: 46, height: 26, borderRadius: 999, background: showAuto ? "var(--cc-good)" : "var(--cc-elev)", position: "relative", flex: "0 0 46px", transition: "background .2s" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: showAuto ? 23 : 3, transition: "left .2s" }} />
        </div>
      </button>

      {/* Botões de tipo */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(TYPE_INFO) as MarkerType[]).map((t) => {
          const info = TYPE_INFO[t];
          const on = adding === t;
          return (
            <button
              key={t}
              onClick={() => (on ? setAdding(null) : startAdd(t))}
              className="cc-btn"
              style={{
                height: 50, fontSize: 13, flexDirection: "column", gap: 2,
                background: on ? info.color : "var(--cc-elev)",
                color: on ? "#06140d" : "var(--cc-text)",
                border: `1px solid ${on ? info.color : "var(--cc-border)"}`,
              }}
            >
              <span style={{ fontSize: 16 }}>{info.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700 }}>{info.label}</span>
            </button>
          );
        })}
      </div>

      {adding && !pendingLatLng && (
        <div className="cc-card p-3" style={{ background: `${TYPE_INFO[adding].color}1a`, borderColor: `${TYPE_INFO[adding].color}66`, fontSize: 13 }}>
          📍 Toque no mapa para marcar um <b>{TYPE_INFO[adding].label}</b>. <span style={{ color: "var(--cc-text2)" }}>{TYPE_INFO[adding].desc}.</span>
        </div>
      )}

      {/* Mapa */}
      <div ref={mapEl} style={{ height: 360, borderRadius: 18, overflow: "hidden", border: "1px solid var(--cc-border)" }} />

      {/* Form de adicionar (após clicar no mapa) */}
      {adding && pendingLatLng && (
        <div className="cc-card p-4 flex flex-col gap-3 cc-fade">
          <div className="cc-label">{TYPE_INFO[adding].emoji} Novo {TYPE_INFO[adding].label}</div>
          <input className="cc-input" style={{ fontSize: 16, fontWeight: 600 }} placeholder="Título (ex: Atalho da Vila Prado)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="cc-input" style={{ fontSize: 15, fontWeight: 500, minHeight: 80, resize: "none" }} placeholder="Observação (ex: entra pela rua X, atravessa pro outro lado)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <button className="cc-btn" onClick={() => { setAdding(null); setPendingLatLng(null); }} style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)" }}>Cancelar</button>
            <button className="cc-btn" onClick={confirmAdd} style={{ background: "var(--cc-good)", color: "#06281c" }}>Salvar marcador</button>
          </div>
        </div>
      )}

      {/* Form de editar */}
      {editing && (
        <div className="cc-card p-4 flex flex-col gap-3 cc-fade">
          <div className="cc-label">{TYPE_INFO[editing.type].emoji} Editar {TYPE_INFO[editing.type].label}</div>
          <input className="cc-input" style={{ fontSize: 16, fontWeight: 600 }} placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea className="cc-input" style={{ fontSize: 15, fontWeight: 500, minHeight: 80, resize: "none" }} placeholder="Observação" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <button className="cc-btn" onClick={() => removeMarker(editing.id)} style={{ background: "var(--cc-elev)", color: "var(--cc-bad)", border: "1px solid var(--cc-border)" }}>Excluir</button>
            <button className="cc-btn" onClick={saveEdit} style={{ background: "var(--cc-good)", color: "#06281c" }}>Salvar</button>
          </div>
          <button className="cc-btn" onClick={() => setEditing(null)} style={{ height: 40, fontSize: 14, background: "transparent", color: "var(--cc-text2)" }}>Fechar</button>
        </div>
      )}

      {/* Lista de marcadores */}
      <div className="flex flex-col gap-2 mt-1">
        <div className="cc-label px-1">Meus marcadores ({markers.length})</div>
        {markers.length === 0 && (
          <div className="cc-card p-6 text-center" style={{ color: "var(--cc-text2)", fontSize: 14 }}>
            Nenhum marcador ainda.<br />Escolha um tipo acima e toque no mapa.
          </div>
        )}
        {markers.map((m) => {
          const info = TYPE_INFO[m.type];
          return (
            <button key={m.id} onClick={() => openEdit(m)} className="cc-card p-3 flex items-center gap-3 text-left" style={{ cursor: "pointer" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: info.color, flex: "0 0 12px" }} />
              <div className="flex-1 min-w-0">
                <div style={{ fontWeight: 700, fontSize: 15 }}>{m.title || "(sem título)"}</div>
                {m.note && <div style={{ fontSize: 12, color: "var(--cc-text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.note}</div>}
                <div style={{ fontSize: 11, color: info.color, fontWeight: 600 }}>{info.label}</div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cc-text2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
