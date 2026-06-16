# Corrida Certa — Design System

PWA para motoristas Uber/99 em São Carlos-SP. iPhone-first. Uso com uma mão na rua.

## Princípios
- **Decisão em 1 segundo**: o semáforo é o herói da tela. Grande, cor forte.
- **Toque fácil**: botões mínimo 56px de altura. Inputs grandes.
- **Offline**: PWA instalável, funciona sem internet depois de carregar.
- **Sem distração**: dark mode por padrão (menos cansaço noturno, economiza bateria OLED do iPhone).

## Cores
- Fundo: `#0B0F14` (quase preto, azulado)
- Card/superfície: `#161C24`
- Superfície elevada: `#1F2731`
- Texto principal: `#F2F5F8`
- Texto secundário: `#8A97A6`
- Borda: `#27313D`
- **Semáforo / status:**
  - 🟢 COMPENSA: `#16C784` (verde)
  - 🟡 NA MÉDIA: `#F5B82E` (amarelo)
  - 🔴 NÃO COMPENSA: `#F0445A` (vermelho)
- Accent (marca/destaque): `#16C784`

## Tipografia
- Fonte: **Poppins** (Google Fonts)
- Números grandes (R$/km, R$/hora): peso 700, até 56px
- Título do semáforo: 700, 28px, uppercase
- Body: 400/500, 15-16px
- Labels: 500, 13px, uppercase, letter-spacing leve

## Layout
- Container máx 480px centralizado (formato celular).
- Tab bar fixa embaixo: Calcular · Mapa · Histórico · Config (ícones + label).
- Safe area iOS: padding-bottom com `env(safe-area-inset-bottom)`.
- Cards com radius 18px, espaçamento generoso.

## Componentes
- **Semáforo**: card grande com cor de fundo translúcida da cor do status, ícone bolinha, texto uppercase.
- **Resultado**: 2 números gigantes lado a lado (R$/km e R$/h).
- **Botões grandes**: pill, 56px, full-width quando ação principal.
- **Marcadores do mapa**: 3 tipos (atalho verde, sem saída vermelho, ponto quente amarelo).

## Motion
- Transição suave entre abas (fade/slide leve).
- Semáforo pulsa de leve ao trocar de status.
- CSS-only, sem libs pesadas.

## PWA
- manifest.json com ícones, display standalone, theme-color `#0B0F14`.
- Service worker cacheia tudo (app shell + tiles do mapa visitados).
- Instruções in-app de "Adicionar à Tela de Início" no iPhone.
