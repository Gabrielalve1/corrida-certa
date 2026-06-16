# Corrida Certa 🚗

PWA para motoristas de aplicativo (Uber/99) decidirem **rápido** se uma corrida compensa — e guardarem estratégias de rua da cidade de São Carlos – SP.

> Projeto pessoal criado para ajudar motoristas de app reais a tomarem decisões melhores em segundos, direto do celular (iPhone-first, instalável como app).

## ✨ Funcionalidades

- **Calculadora de corrida (R$/km):** digita valor, km e tempo → o app diz na hora se *compensa* ou não.
- **Modo de voz hands-free (pt-BR):** o app pergunta valor → km → tempo um de cada vez, o motorista responde falando, e o app **fala o resultado em voz alta** ("compensa, 2 reais por km") e salva a corrida sozinho. Usa a Web Speech API.
- **Cérebro / modo automático:** analisa o mapa de São Carlos (dados OpenStreetMap) para **detectar atalhos** que o GPS do app de corrida ignora (vielas, ruas paralelas próximas, ruas sem saída a evitar). Quando o carro se aproxima (300m), o app avisa por voz automaticamente.
- **Histórico de corridas:** registro do que compensou, salvo localmente.
- **Mapa de estratégias:** visualização com OpenStreetMap (sem chave de API).
- **Offline-first:** funciona sem internet (exceto a parte de voz, que precisa de conexão).

## 🛠️ Tecnologias

- **Front-end:** React + TypeScript, Vite
- **Mapas:** OpenStreetMap + Leaflet (sem custo de API)
- **Voz:** Web Speech API (reconhecimento + síntese em pt-BR)
- **PWA:** Service Worker, manifest, instalável no iPhone/Android
- **Back-end:** Hono (API), Drizzle ORM
- **Monorepo:** web + mobile (Expo) + desktop (Electron)

## 📁 Estrutura

```
packages/
  web/      → app principal (PWA React) — a lógica está em src/web/lib
  mobile/   → versão Expo (mobile)
  desktop/  → versão Electron (desktop)
```

Lógica principal em `packages/web/src/web/lib/`:
- `calc.ts` — cálculo de R$/km e decisão "compensa"
- `brain.ts` — detecção automática de atalhos a partir do mapa
- `voice.ts` — modo de voz hands-free (Web Speech API)

## 🚀 Rodar localmente

```bash
bun install
bun dev
```

## 👤 Autor

Gabriel Alves da Silva — São Carlos, SP
[LinkedIn](https://linkedin.com/in/gabriel-alves-a0b87b300) · [GitHub](https://github.com/Gabrielalve1)
