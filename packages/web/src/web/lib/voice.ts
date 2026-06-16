// Reconhecimento de voz (Web Speech API) + fala (Speech Synthesis) em pt-BR

// parseNumber fica em voice-parse.ts; re-exportado aqui pra compatibilidade
export { parseNumber } from "./voice-parse";

// ---- Tipos minimos (a Web Speech API nao tem tipos oficiais) ----
interface SpeechRecognitionResultLike {
  0: { transcript: string };
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  results: { [i: number]: SpeechRecognitionResultLike; length: number };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function voiceSupported(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Ouve uma vez e retorna o texto reconhecido
export function listenOnce(opts: {
  onText: (text: string, final: boolean) => void;
  onError: (err: string) => void;
  onEnd: () => void;
}): { stop: () => void } {
  const rec = getRecognition();
  if (!rec) {
    opts.onError("not-supported");
    opts.onEnd();
    return { stop: () => {} };
  }
  rec.lang = "pt-BR";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  rec.onresult = (e) => {
    let txt = "";
    let isFinal = false;
    for (let i = 0; i < e.results.length; i++) {
      txt += e.results[i][0].transcript;
      if (e.results[i].isFinal) isFinal = true;
    }
    opts.onText(txt.trim(), isFinal);
  };
  rec.onerror = (e) => opts.onError(e.error);
  rec.onend = () => opts.onEnd();

  try {
    rec.start();
  } catch {
    opts.onError("start-failed");
    opts.onEnd();
  }
  return { stop: () => { try { rec.stop(); } catch {} } };
}

// ---- Fala (TTS) ----
let voicesCache: SpeechSynthesisVoice[] = [];
function ptVoice(): SpeechSynthesisVoice | undefined {
  if (!voicesCache.length) voicesCache = window.speechSynthesis?.getVoices() || [];
  return (
    voicesCache.find((v) => /pt[-_]BR/i.test(v.lang)) ||
    voicesCache.find((v) => /^pt/i.test(v.lang))
  );
}

export function speak(text: string, onDone?: () => void) {
  if (!("speechSynthesis" in window)) { onDone?.(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "pt-BR";
  u.rate = 1.02;
  u.pitch = 1;
  const v = ptVoice();
  if (v) u.voice = v;
  if (onDone) u.onend = () => onDone();
  window.speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

// pre-carrega vozes (Safari carrega async)
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}
