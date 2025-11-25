# IDEAS DE PRODUCTO GUARDADAS

**Fecha:** 2024-11-25
**Status:** Para revisión futura
**Presupuesto objetivo:** Max $100 USD/mes

---

## DEPORTES + AI

---

### IDEA 1: "INJURY EDGE"
#### Alertas de Lesiones + Impacto en Líneas

**Concepto:** Las lesiones mueven líneas. Quien se entera primero, gana. El AI monitorea Twitter/noticias y calcula impacto inmediato en las odds.

**Cómo funciona:**
```
⚡ BREAKING: Lesión detectada

Jugador: Patrick Mahomes (QB, Chiefs)
Status: Cuestionable (tobillo)
Fuente: @AdamSchefter (hace 3 min)

📊 IMPACTO ESTIMADO:
Línea actual: Chiefs -7
Si no juega: Chiefs -3 (movimiento de 4 puntos)
Si juega limitado: Chiefs -5.5

VENTANA DE OPORTUNIDAD:
Las líneas aún no se han movido en:
- DraftKings ✓
- FanDuel ✓
- BetMGM ⚠️ (moviéndose)

Tienes ~10-15 minutos de edge estimado.
```

**Propuesta de valor:**
- El usuario gana TIEMPO - el asset más valioso en betting
- Información procesada, no raw data
- Impacto cuantificado (no solo "X está lesionado")
- Ventana de oportunidad clara

**Stack técnico sugerido:**
- Fuentes de datos: Twitter API (~$100/mes) O alternativa gratuita con RSS feeds + scraping de fuentes deportivas confiables
- AI: Claude API para análisis de impacto (~$30/mes)
- Base de datos de líneas históricas para calcular impactos
- Notificaciones push en tiempo real

**Costos estimados:**
- Opción A (con Twitter API): ~$130/mes
- Opción B (RSS + scraping): ~$50/mes

**Monetización:**
- Free tier: Alertas de lesiones mayores (estrellas)
- Pro ($9.99/mes): Todas las lesiones + análisis de impacto + alertas push
- Afiliados de sportsbooks: $100-300 por usuario referido

**Riesgos:**
- Twitter API es caro y puede cambiar términos
- Competencia con ESPN, Bleacher Report (pero ellos no dan impacto en líneas)
- Dependencia de velocidad de fuentes

**Diferenciador clave:**
Nadie une LESIÓN + IMPACTO EN LÍNEAS + VENTANA DE TIEMPO en un solo lugar.

---

### IDEA 2: "FADE THE PUBLIC"
#### Dashboard Simple de Dónde Apuesta el Público

**Concepto:** El público pierde consistentemente. Apostar CONTRA el público tiene edge probado históricamente. Mostramos dónde está apostando el público y sugerimos "fades".

**Cómo funciona:**
```
📊 HOY: FADE THE PUBLIC

NFL Week 12

PARTIDOS CON MAYOR SESGO PÚBLICO:

1. Cowboys vs Eagles
   Público: 78% Cowboys
   Línea: Cowboys -3
   AI: "Fade potencial. Sharp money en Eagles."

2. Chiefs vs Raiders
   Público: 85% Chiefs
   Línea: Chiefs -10
   AI: "Spread muy alto. Público inflando."

3. Bills vs Dolphins
   Público: 71% Bills
   Línea: Bills -6
   AI: "Neutral. Línea justa."

HISTÓRICO "FADE":
Últimos 30 días: 58% win rate
ROI: +8.3%
```

**Propuesta de valor:**
- Estrategia probada y simple de entender
- Contrarian betting tiene décadas de evidencia
- Dashboard visual y fácil de usar
- Histórico de rendimiento transparente

**Stack técnico sugerido:**
- Datos de % público: Action Network, VSiN (algunos datos gratuitos)
- The Odds API: Tier gratis para odds actuales
- Claude API: Análisis y contexto (~$30/mes)
- Vercel: Hosting ($0-20/mes)

**Costos estimados:** ~$30-50/mes

**Monetización:**
- Free tier: Top 3 fades del día
- Pro ($7.99/mes): Todos los partidos + histórico + alertas
- Afiliados de sportsbooks

**Riesgos:**
- Datos de % público no siempre son precisos
- No todos los fades son rentables
- Necesita volumen para probar edge

**Diferenciador clave:**
La mayoría de herramientas muestran picks. Nosotros mostramos DÓNDE ESTÁ EL DINERO TONTO y dejamos que el usuario decida.

**Por qué es el MÁS SIMPLE de construir:**
- No requiere datos en tiempo real costosos
- Lógica straightforward
- UI puede ser muy minimalista
- MVP en 1-2 semanas

---

## TRADING + AI (Forex/Stocks/Crypto)

---

### IDEA 3: "SENTIMENT RADAR"
#### AI que Resume el Sentimiento de Mercado en 30 Segundos

**Concepto:** No predicciones. Solo responder "¿Cómo está el mercado ahora mismo?" en lenguaje simple y accionable. Un resumen humano de todo lo que está pasando.

**Cómo funciona:**
```
📡 MARKET PULSE - Nov 25, 2024

SENTIMIENTO GENERAL: 😰 FEAR (32/100)

Por qué:
- BTC cayó 4% en 24h tras rumores de regulación
- S&P500 cerró -0.8% por datos de empleo
- Oro subiendo (flight to safety)

LO QUE DICE TWITTER/X:
- "Capitulación" mencionado 340% más que ayer
- Influencers: 60% bajistas, 40% neutrales
- Retail: Vendiendo (exchanges muestran inflows)

LO QUE HACE SMART MONEY:
- Whales crypto: Acumulando en el dip
- Instituciones: Reduciendo exposición a tech

MI ANÁLISIS:
"Fear extremo pero smart money comprando.
Históricamente = oportunidad en 48-72h."
```

**Propuesta de valor:**
- Ahorra HORAS de scrollear Twitter, Reddit, noticias
- Contexto que un número solo (Fear & Greed) no da
- Lenguaje humano, no jerga técnica
- Combina múltiples fuentes en un solo lugar

**Stack técnico sugerido:**
- Fear & Greed Index: API gratuita (Alternative.me)
- Datos de mercado: CoinGecko API (gratis), Yahoo Finance
- Sentimiento social: LunarCrush (tier gratis) o scraping
- Claude API: Para síntesis y análisis (~$40/mes)
- On-chain data: Glassnode (algunos datos gratis)

**Costos estimados:** ~$50/mes

**Monetización:**
- Free tier: Resumen diario (1 vez al día)
- Pro ($9.99/mes): Updates cada hora + alertas + histórico
- Posibilidad de newsletter premium

**Riesgos:**
- Sentimiento es lagging indicator a veces
- Difícil probar ROI directamente
- Competencia con herramientas existentes

**Diferenciador clave:**
No es un indicador más. Es un ANALISTA AI que te resume TODO en 30 segundos. Como tener un research assistant.

**Mercados a cubrir:**
- Crypto (principal)
- US Stocks (S&P 500, tech)
- Forex (majors: EUR/USD, GBP/USD)

---

### IDEA 4: "NEWS DECODER"
#### AI que Traduce Noticias Financieras a Impacto Real

**Concepto:** Las noticias mueven mercados pero están escritas para expertos. El AI traduce a lenguaje simple + muestra impacto histórico + sugiere qué hacer.

**Cómo funciona:**
```
📰 NOTICIA DETECTADA

"Fed signals potential rate pause amid cooling inflation"
Fuente: Reuters, hace 15 min

🤖 TRADUCCIÓN:

EN SIMPLE:
"La Fed podría dejar de subir tasas porque
la inflación está bajando."

IMPACTO ESPERADO:
📈 Stocks: Positivo (+1-2% esperado)
📈 Crypto: Positivo (menos presión de tasas)
📉 USD: Negativo (tasas más bajas = dólar débil)
📈 Oro: Positivo (tasas bajas = oro sube)

HISTÓRICO:
Últimas 5 pausas de Fed:
- S&P500 +8% en 3 meses (promedio)
- BTC +23% en 3 meses (promedio)

¿QUÉ HACER?
"Si tienes cash, históricamente es buen momento
para entrar a riesgo. Pero espera confirmación."
```

**Propuesta de valor:**
- Noticias financieras son confusas para retail
- El contexto histórico es invaluable
- Impacto multi-asset en un solo lugar
- Educativo: el usuario aprende con cada noticia

**Stack técnico sugerido:**
- RSS feeds de noticias: GRATIS (Reuters, Bloomberg, Fed, etc.)
- NewsAPI o similar: Tier gratis disponible
- Claude API: Para traducción y análisis (~$40/mes)
- Base de datos de eventos históricos y su impacto
- Vercel: Hosting ($0-20/mes)

**Costos estimados:** ~$40-60/mes

**Monetización:**
- Free tier: 5 noticias decodificadas por día
- Pro ($7.99/mes): Ilimitado + alertas en tiempo real + análisis profundo
- Newsletter (Substack model)

**Riesgos:**
- El impacto histórico no garantiza futuro
- Noticias falsas o rumores
- Velocidad vs precisión tradeoff

**Diferenciador clave:**
Bloomberg/Reuters dan noticias. Nosotros damos ENTENDIMIENTO + CONTEXTO HISTÓRICO + ACCIÓN SUGERIDA.

**Tipos de noticias a cubrir:**
- Fed decisions / FOMC
- Inflation data (CPI, PPI)
- Employment reports
- Earnings de big tech
- Crypto regulations
- Geopolitical events

---

## RESUMEN COMPARATIVO

| Idea | Costo/Mes | Dificultad Build | Tiempo MVP | Potencial |
|------|-----------|------------------|------------|-----------|
| Injury Edge | $50-130 | Alta | 4-6 sem | ⭐⭐⭐⭐ |
| Fade The Public | $30-50 | Baja | 1-2 sem | ⭐⭐⭐ |
| Sentiment Radar | $50 | Media | 2-3 sem | ⭐⭐⭐ |
| News Decoder | $40-60 | Baja | 2-3 sem | ⭐⭐⭐ |

---

## NOTAS ADICIONALES

### Sobre monetización con afiliados de sportsbooks:
- DraftKings: $200-500 por nuevo depositante
- FanDuel: $150-400 por nuevo depositante
- BetMGM: $100-300 por nuevo depositante
- Esto puede cubrir costos operativos rápidamente

### Sobre datos de apuestas:
- The Odds API: Tier gratis con 500 requests/mes
- Planes pagados desde $20/mes
- Datos históricos solo en planes premium

### Sobre el mercado:
- Sports Betting Global: ~$100B (2024)
- Creciendo 10-11% anual
- 67% es online
- AI en Sports Betting: $2.2B → $29.7B (2032)

---

## PRÓXIMOS PASOS CUANDO RETOMEMOS

1. Elegir UNA idea para MVP
2. Definir features mínimas
3. Diseñar UI/UX básica
4. Identificar APIs específicas
5. Construir con vibe coding (Claude + yo)
6. Launch beta en 2-4 semanas

---

*Documento guardado para referencia futura*
