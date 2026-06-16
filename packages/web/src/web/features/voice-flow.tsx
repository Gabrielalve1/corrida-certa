import { useEffect, useRef, useState } from "react";
import { listenOnce, parseNumber, speak, stopSpeaking, voiceSupported } from "../lib/voice";
import { calcRide, STATUS_INFO, brl, num2 } from "../lib/calc";
import { getSettings, addRide, uid } from "../lib/storage";

type Step = "intro" | "valor" | "km" | "tempo" | "result" | "error";

const QUESTION: Record<string, string> = {
  valor: "Quanto a corrida está pagando?",
  km: "Quantos quilômetros?",
  tempo: "Quantos minutos?",
};

export default function VoiceFlow({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [step, setStep] = useState<Step>("intro");
  const [valor, setValor] = useState<number | null>(null);
  const [km, setKm] = useState<number | null>(null);
  const [tempo, setTempo] = useState<number | null>(null);
  const [heard, setHeard] = useState("");
  const [listening, setListening] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const stopRef = useRef<(() => void) | null>(null);
  const settings = useRef(getSettings());

  const supported = voiceSupported();

  // limpa ao fechar
  useEffect(() => {
    return () => { stopRef.current?.(); stopSpeaking(); };
  }, []);

  // toca o fluxo
  function start() {
    if (!supported) { setStep("error"); setErrMsg("Seu navegador não suporta comando de voz. Use o Safari no iPhone."); return; }
    settings.current = getSettings();
    setValor(null); setKm(null); setTempo(null);
    askStep("valor");
  }

  function askStep(s: "valor" | "km" | "tempo") {
    setStep(s);
    setHeard("");
    speak(QUESTION[s], () => listen(s));
  }

  function listen(s: "valor" | "km" | "tempo") {
    setListening(true);
    setHeard("");
    let lastText = "";
    const ctrl = listenOnce({
      onText: (text) => { lastText = text; setHeard(text); },
      onError: (err) => {
        setListening(false);
        if (err === "no-speech") {
          speak("Não ouvi. Pode repetir?", () => listen(s));
        } else if (err === "not-allowed") {
          setStep("error");
          setErrMsg("Permita o uso do microfone nas configurações do navegador e tente de novo.");
        }
      },
      onEnd: () => {
        setListening(false);
        const n = parseNumber(lastText);
        if (n == null || n <= 0) {
          speak("Não entendi o número. Pode repetir?", () => listen(s));
          return;
        }
        handleValue(s, n);
      },
    });
    stopRef.current = ctrl.stop;
  }

  function handleValue(s: "valor" | "km" | "tempo", n: number) {
    if (s === "valor") { setValor(n); speak(`${num2(n)} reais.`, () => askStep("km")); }
    else if (s === "km") { setKm(n); speak(`${num2(n)} quilômetros.`, () => askStep("tempo")); }
    else { setTempo(n); finish(valor!, km!, n); }
  }

  function finish(v: number, k: number, t: number) {
    const r = calcRide(v, k, t, settings.current);
    const info = STATUS_INFO[r.status];
    // salva sozinho
    addRide({
      id: uid(), date: Date.now(), value: v, km: k, min: t,
      perKm: r.perKm, perHour: r.perHour, fuelCost: r.fuelCost, net: r.net, status: r.status,
    });
    onSaved();
    setStep("result");
    // fala o resultado em voz alta
    const fala =
      r.status === "good" ? "Compensa!" : r.status === "mid" ? "Está na média." : "Não compensa.";
    speak(`${fala} ${num2(r.perKm).replace(".", ",")} reais por quilômetro. ${num2(r.perHour).replace(".", ",")} reais por hora. Corrida salva.`);
  }

  const result = valor && km ? calcRide(valor, km, tempo || 0, settings.current) : null;
  const info = result ? STATUS_INFO[result.status] : null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#070a0e", display: "flex", flexDirection: "column" }}>
      <div className="w-full max-w-[480px] mx-auto flex flex-col flex-1 px-5 cc-safe-top pb-8">
        {/* topo */}
        <div className="flex items-center justify-between">
          <div style={{ fontWeight: 700, fontSize: 17 }}>🎙️ Modo voz</div>
          <button onClick={() => { stopRef.current?.(); stopSpeaking(); onClose(); }} style={{ background: "var(--cc-elev)", border: "1px solid var(--cc-border)", color: "var(--cc-text)", width: 40, height: 40, borderRadius: 999, fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          {step === "intro" && (
            <>
              <div style={{ fontSize: 56 }}>🎙️</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Fala a corrida</div>
                <p style={{ color: "var(--cc-text2)", fontSize: 15, lineHeight: 1.5, maxWidth: 300 }}>
                  Vou perguntar o <b style={{ color: "var(--cc-text)" }}>valor</b>, os <b style={{ color: "var(--cc-text)" }}>km</b> e o <b style={{ color: "var(--cc-text)" }}>tempo</b>. Você responde falando. No fim eu falo se compensa e salvo sozinho.
                </p>
              </div>
              <button className="cc-btn" onClick={start} style={{ background: "var(--cc-good)", color: "#06281c", width: 220 }}>
                Começar
              </button>
            </>
          )}

          {(step === "valor" || step === "km" || step === "tempo") && (
            <>
              {/* progresso */}
              <div className="flex gap-2">
                {(["valor", "km", "tempo"] as const).map((s) => (
                  <div key={s} style={{ width: 44, height: 6, borderRadius: 3, background: step === s ? "var(--cc-good)" : (valor && s === "valor") || (km && s === "km") ? "var(--cc-good)" : "var(--cc-border)" }} />
                ))}
              </div>

              <div>
                <div style={{ fontSize: 13, color: "var(--cc-text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pergunta</div>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{QUESTION[step]}</div>
              </div>

              {/* mic animado */}
              <div style={{ position: "relative", width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {listening && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--cc-good)", opacity: 0.25, animation: "ccPing 1.2s ease-out infinite" }} />}
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: listening ? "var(--cc-good)" : "var(--cc-elev)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s" }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={listening ? "#06281c" : "var(--cc-text2)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                </div>
              </div>

              <div style={{ minHeight: 28 }}>
                {listening ? (
                  <span style={{ color: "var(--cc-good)", fontWeight: 600 }}>{heard ? `"${heard}"` : "Ouvindo… pode falar"}</span>
                ) : (
                  <span style={{ color: "var(--cc-text2)" }}>{heard ? `"${heard}"` : "Aguarde…"}</span>
                )}
              </div>

              {/* valores já capturados */}
              <div className="flex gap-3" style={{ fontSize: 14, color: "var(--cc-text2)" }}>
                <span>💰 {valor != null ? brl(valor) : "—"}</span>
                <span>📏 {km != null ? `${num2(km)} km` : "—"}</span>
                <span>⏱️ {tempo != null ? `${num2(tempo)} min` : "—"}</span>
              </div>

              <button className="cc-btn" onClick={() => listen(step)} style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)", width: 200, height: 48 }}>
                🔁 Repetir resposta
              </button>
            </>
          )}

          {step === "result" && result && info && (
            <>
              <div style={{ width: 110, height: 110, borderRadius: "50%", background: info.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 40px ${info.color}88` }}>
                <span style={{ fontSize: 52 }}>{result.status === "good" ? "✓" : result.status === "mid" ? "~" : "✕"}</span>
              </div>
              <div>
                <div style={{ fontSize: 30, fontWeight: 800, color: info.color, textTransform: "uppercase" }}>{info.label}</div>
                <div style={{ color: "var(--cc-text2)", marginTop: 4 }}>Corrida salva no histórico ✓</div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full" style={{ maxWidth: 320 }}>
                <div className="cc-card p-3" style={{ background: "var(--cc-elev)" }}>
                  <div className="cc-label">Líquido / km</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: info.color }}>{brl(result.perKm)}</div>
                </div>
                <div className="cc-card p-3" style={{ background: "var(--cc-elev)" }}>
                  <div className="cc-label">Líquido / hora</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: info.color }}>{brl(result.perHour)}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full" style={{ maxWidth: 320 }}>
                <button className="cc-btn" onClick={start} style={{ background: "var(--cc-good)", color: "#06281c" }}>🎙️ Outra corrida</button>
                <button className="cc-btn" onClick={() => { stopSpeaking(); onClose(); }} style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)" }}>Fechar</button>
              </div>
            </>
          )}

          {step === "error" && (
            <>
              <div style={{ fontSize: 48 }}>⚠️</div>
              <p style={{ color: "var(--cc-text2)", maxWidth: 300 }}>{errMsg}</p>
              <button className="cc-btn" onClick={() => { stopSpeaking(); onClose(); }} style={{ background: "var(--cc-elev)", color: "var(--cc-text)", border: "1px solid var(--cc-border)", width: 200 }}>Fechar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
