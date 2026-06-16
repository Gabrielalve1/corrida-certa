import { useMemo, useState, useEffect } from "react";
import { calcRide, STATUS_INFO, brl, num2 } from "../lib/calc";
import { getSettings, addRide, uid, type RideStatus } from "../lib/storage";
import { voiceSupported } from "../lib/voice";
import VoiceFlow from "./voice-flow";

function NumField({
  label,
  unit,
  value,
  onChange,
  placeholder,
  step,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step: number;
}) {
  const n = parseFloat(value.replace(",", ".")) || 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="cc-label">{label}</span>
        <span className="cc-label" style={{ color: "var(--cc-text2)" }}>{unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="cc-btn"
          style={{ width: 52, height: 56, flex: "0 0 52px", background: "var(--cc-elev)", color: "var(--cc-text)", fontSize: 26, border: "1px solid var(--cc-border)" }}
          onClick={() => onChange(String(Math.max(0, +(n - step).toFixed(2))).replace(".", ","))}
          aria-label="diminuir"
        >−</button>
        <input
          className="cc-input"
          inputMode="decimal"
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={{ textAlign: "center" }}
        />
        <button
          className="cc-btn"
          style={{ width: 52, height: 56, flex: "0 0 52px", background: "var(--cc-elev)", color: "var(--cc-text)", fontSize: 26, border: "1px solid var(--cc-border)" }}
          onClick={() => onChange(String(+(n + step).toFixed(2)).replace(".", ","))}
          aria-label="aumentar"
        >+</button>
      </div>
    </div>
  );
}

export default function Calculator() {
  const [value, setValue] = useState("");
  const [km, setKm] = useState("");
  const [min, setMin] = useState("");
  const [pulse, setPulse] = useState(0);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(getSettings());
  const [voiceOpen, setVoiceOpen] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const v = parseFloat(value.replace(",", ".")) || 0;
  const k = parseFloat(km.replace(",", ".")) || 0;
  const m = parseFloat(min.replace(",", ".")) || 0;
  const hasInput = v > 0 && k > 0;

  const result = useMemo(() => calcRide(v, k, m, settings), [v, k, m, settings]);
  const info = STATUS_INFO[result.status as RideStatus];

  useEffect(() => {
    if (hasInput) setPulse((p) => p + 1);
    setSaved(false);
  }, [result.status, hasInput]);

  function reset() {
    setValue(""); setKm(""); setMin(""); setSaved(false);
  }

  function save() {
    if (!hasInput) return;
    addRide({
      id: uid(),
      date: Date.now(),
      value: v, km: k, min: m,
      perKm: result.perKm,
      perHour: result.perHour,
      fuelCost: result.fuelCost,
      net: result.net,
      status: result.status,
    });
    setSaved(true);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* BOTÃO DE VOZ */}
      {voiceSupported() && (
        <button
          className="cc-btn"
          onClick={() => setVoiceOpen(true)}
          style={{
            height: 62,
            background: "linear-gradient(135deg,#16C784,#0e9e68)",
            color: "#06281c",
            fontSize: 18,
            boxShadow: "0 6px 20px rgba(22,199,132,0.3)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06281c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
          Falar a corrida
        </button>
      )}

      {/* SEMÁFORO */}
      <div
        key={pulse}
        className={hasInput ? "cc-card cc-pulse p-5" : "cc-card p-5"}
        style={{
          background: hasInput ? `${info.color}1a` : "var(--cc-card)",
          borderColor: hasInput ? `${info.color}66` : "var(--cc-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 46, height: 46, borderRadius: "50%",
              background: hasInput ? info.color : "var(--cc-elev)",
              boxShadow: hasInput ? `0 0 22px ${info.color}88` : "none",
              flex: "0 0 46px",
            }}
          />
          <div>
            <div style={{ fontSize: 11, color: "var(--cc-text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {hasInput ? "Resultado" : "Preencha valor e km"}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, textTransform: "uppercase", color: hasInput ? info.color : "var(--cc-text2)", lineHeight: 1.1 }}>
              {hasInput ? info.label : "Aguardando"}
            </div>
          </div>
        </div>

        {/* Números grandes */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="cc-card p-3" style={{ background: "var(--cc-elev)" }}>
            <div className="cc-label">Líquido / KM</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: hasInput ? info.color : "var(--cc-text)" }}>
              {brl(result.perKm)}
            </div>
          </div>
          <div className="cc-card p-3" style={{ background: "var(--cc-elev)" }}>
            <div className="cc-label">Líquido / HORA</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: hasInput ? info.color : "var(--cc-text)" }}>
              {brl(result.perHour)}
            </div>
          </div>
        </div>

        {hasInput && (
          <div className="flex justify-between mt-3 px-1" style={{ fontSize: 13, color: "var(--cc-text2)", fontWeight: 500 }}>
            <span>Combustível: <b style={{ color: "var(--cc-text)" }}>{brl(result.fuelCost)}</b></span>
            <span>Líquido: <b style={{ color: "var(--cc-text)" }}>{brl(result.net)}</b></span>
          </div>
        )}
      </div>

      {/* INPUTS */}
      <div className="cc-card p-4 flex flex-col gap-4">
        <NumField label="Valor oferecido" unit="R$" value={value} onChange={setValue} placeholder="0,00" step={0.5} />
        <NumField label="Distância" unit="KM" value={km} onChange={setKm} placeholder="0,0" step={0.5} />
        <NumField label="Tempo estimado" unit="MIN" value={min} onChange={setMin} placeholder="0" step={1} />
      </div>

      {/* AÇÕES */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className="cc-btn"
          onClick={reset}
          style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)" }}
        >
          Limpar
        </button>
        <button
          className="cc-btn"
          onClick={save}
          disabled={!hasInput}
          style={{
            background: saved ? "var(--cc-elev)" : "var(--cc-good)",
            color: saved ? "var(--cc-good)" : "#06281c",
            opacity: hasInput ? 1 : 0.5,
            border: saved ? "1px solid var(--cc-good)" : "none",
          }}
        >
          {saved ? "✓ Salvo" : "Salvar corrida"}
        </button>
      </div>

      <p style={{ fontSize: 12, color: "var(--cc-text2)", textAlign: "center", marginTop: 2 }}>
        Mínimo bom: <b style={{ color: "var(--cc-text)" }}>{brl(settings.minPerKm)}/km</b> · Consumo {num2(settings.kmPerLiter)} km/l · Gasolina {brl(settings.fuelPrice)}/L
      </p>

      {voiceOpen && (
        <VoiceFlow
          onClose={() => setVoiceOpen(false)}
          onSaved={() => setSettings(getSettings())}
        />
      )}
    </div>
  );
}
