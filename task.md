# Corrida Certa — Cérebro (modo automático)

## Objetivo
App detecta atalhos sozinho a partir do mapa de São Carlos. Pai não marca nada.
Liga modo auto 1x, GPS rastreia, fala sozinho a 300m de um ponto detectado.

## Lógica de detecção (heurística sobre dados OSM)
- 🟢 Atalho provável:
  - footways / paths / pedestrian / steps que CONECTAM duas ruas de carro (passagem que carro ignora)
  - "living_street" e travessas curtas entre ruas paralelas
- 🔴 Rua sem saída: highway com noexit=yes OU ponta solta (cul-de-sac)
- 🟡 (mantém pontos quentes manuais existentes)

## Plano técnico
1. [x] Buscar dados via Overpass API (footways + ruas) de São Carlos centro/bairros
2. [x] Script que cruza footways com ruas → gera lista de atalhos candidatos (lat,lng,nota)
3. [x] Salvar como JSON estático no public/ (offline, sem depender de API na rua)
4. [x] Tela "Modo Automático": botão liga/desliga, GPS watchPosition, wake lock
5. [ ] Engine: a cada update de GPS, calcula distância pros pontos; <300m e não avisado → fala
6. [ ] Anti-repetição (cooldown por ponto)
7. [ ] Mostra na tela o ponto mais próximo + lista
8. [ ] Build + screenshots + deliver

## Decisões
- Distância de aviso: 300m (config ajustável depois)
- Detecção automática, zero input do pai
- Dados pré-processados embarcados (funciona offline)
