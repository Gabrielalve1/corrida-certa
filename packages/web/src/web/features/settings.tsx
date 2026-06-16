import { useState } from "react";
import { getSettings, saveSettings, DEFAULT_SETTINGS, type Settings } from "../lib/storage";

function Row({
  label,
  hint,
  unit,
  value,
  onChange,
  step,
}: {
  label: string;
  hint: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
}) {
  return (
    <div className="cc-card p-4" style={{ background: "var(--cc-elev)" }}>
      <div className="cc-label">{label}</div>
      <div style={{ fontSize: 12, color: "var(--cc-text2)", marginTop: 2, marginBottom: 10 }}>{hint}</div>
      <div className="flex items-center gap-2">
        <button
          className="cc-btn"
          style={{ width: 52, flex: "0 0 52px", background: "var(--cc-card)", color: "var(--cc-text)", fontSize: 26, border: "1px solid var(--cc-border)" }}
          onClick={() => onChange(Math.max(0, +(value - step).toFixed(2)))}
        >−</button>
        <div className="flex items-center cc-input" style={{ justifyContent: "center", gap: 6 }}>
          <input
            inputMode="decimal"
            type="text"
            value={String(value).replace(".", ",")}
            onChange={(e) => onChange(parseFloat(e.target.value.replace(",", ".")) || 0)}
            style={{ width: 80, background: "transparent", border: "none", color: "var(--cc-text)", fontSize: 26, fontWeight: 700, textAlign: "center", outline: "none", fontFamily: "inherit" }}
          />
          <span style={{ fontSize: 14, color: "var(--cc-text2)", fontWeight: 600 }}>{unit}</span>
        </div>
        <button
          className="cc-btn"
          style={{ width: 52, flex: "0 0 52px", background: "var(--cc-card)", color: "var(--cc-text)", fontSize: 26, border: "1px solid var(--cc-border)" }}
          onClick={() => onChange(+(value + step).toFixed(2))}
        >+</button>
      </div>
    </div>
  );
}

export default function SettingsView() {
  const [s, setS] = useState<Settings>(getSettings());
  const [savedFlag, setSavedFlag] = useState(false);

  function patch(p: Partial<Settings>) {
    const next = { ...s, ...p };
    setS(next);
    saveSettings(next);
    setSavedFlag(true);
    setTimeout(() => setSavedFlag(false), 1200);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1 mb-1">
        <h2 style={{ fontWeight: 700, fontSize: 20 }}>Configurações</h2>
        {savedFlag && <span style={{ fontSize: 13, color: "var(--cc-good)", fontWeight: 600 }}>✓ Salvo</span>}
      </div>

      <Row label="Consumo do carro" hint="Quantos km seu carro faz por litro" unit="km/l" value={s.kmPerLiter} onChange={(n) => patch({ kmPerLiter: n })} step={0.5} />
      <Row label="Preço do combustível" hint="Quanto está o litro hoje" unit="R$/L" value={s.fuelPrice} onChange={(n) => patch({ fuelPrice: n })} step={0.1} />
      <Row label="Mínimo por km" hint="Valor por km que você considera bom" unit="R$/km" value={s.minPerKm} onChange={(n) => patch({ minPerKm: n })} step={0.1} />

      <button
        className="cc-btn mt-2"
        onClick={() => patch(DEFAULT_SETTINGS)}
        style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)" }}
      >
        Restaurar padrão
      </button>

      <p style={{ fontSize: 12, color: "var(--cc-text2)", textAlign: "center", marginTop: 4, lineHeight: 1.5 }}>
        Suas configurações ficam salvas no seu celular. Ajuste uma vez e pronto — o cálculo já desconta o combustível pra você.
      </p>
    </div>
  );
}
