// Conversao de numero falado (digitos ou por extenso) — usado pelo modo de voz

const UNITS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, "três": 3, quatro: 4,
  cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16,
  dezessete: 17, dezoito: 18, dezenove: 19,
};
const TENS: Record<string, number> = {
  vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60,
  setenta: 70, oitenta: 80, noventa: 90,
};
const HUNDREDS: Record<string, number> = {
  cem: 100, cento: 100, duzentos: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500,
};

function chunkToNumber(s: string): number | null {
  const tokens = s
    .replace(/[^a-zà-ú\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w !== "e");

  let total = 0;
  let found = false;
  for (const tk of tokens) {
    if (HUNDREDS[tk] != null) { total += HUNDREDS[tk]; found = true; }
    else if (TENS[tk] != null) { total += TENS[tk]; found = true; }
    else if (UNITS[tk] != null) { total += UNITS[tk]; found = true; }
  }
  return found ? total : null;
}

// Converte texto por extenso pra numero (ex: "vinte e dois" -> 22, "trinta reais e cinquenta" -> 30.5)
function wordsToNumber(text: string): number | null {
  const parts = text.split(/\b(?:e\s+)?(?:centavos?|cents?)\b/);
  const reaisSplit = text.match(/(.+?)\s*reais?\s*e\s*(.+)/);
  if (reaisSplit) {
    const intPart = chunkToNumber(reaisSplit[1]);
    const decPart = chunkToNumber(reaisSplit[2]);
    if (intPart != null) {
      const cents = decPart != null ? decPart : 0;
      return intPart + cents / 100;
    }
  }
  return chunkToNumber(parts[0]);
}

// Extrai o primeiro numero falado. Trata "vinte e dois", "18,50", "dezoito reais e cinquenta"
export function parseNumber(text: string): number | null {
  const t = text.toLowerCase().trim();

  // 1) numero direto com digitos: "18", "18,5", "18.5", "7 km"
  const digitMatch = t.match(/(\d+)([.,](\d+))?/);
  if (digitMatch) {
    const intp = digitMatch[1];
    const dec = digitMatch[3];
    const v = parseFloat(dec ? `${intp}.${dec}` : intp);
    if (!isNaN(v)) return v;
  }

  // 2) numeros por extenso (cobre 0-99, suficiente pra corrida)
  return wordsToNumber(t);
}
