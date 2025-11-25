# AI PERCEPTION ENGINEERING AGENCY

**Fecha:** 2024-11-25
**Status:** APROBADO - Próximo a desarrollar
**Reemplaza:** VectorialData (On-chain Analytics)

---

## CONCEPTO CENTRAL

### ¿Qué problema resolvemos?

**Hoy:** Cuando alguien le pregunta a ChatGPT "¿Cuál es la mejor tienda de zapatos en México?", ChatGPT recomienda algunas marcas.

**El problema:** La mayoría de negocios NO SABEN si ChatGPT los recomienda o no. Y si no los recomienda, están perdiendo clientes sin saberlo.

**Nuestra solución:** Una herramienta donde pones tu URL y te decimos:
1. ¿Te recomiendan las IAs? (ChatGPT, Claude, Gemini, Perplexity)
2. ¿Qué dicen de ti?
3. ¿Cómo te comparan vs tu competencia?
4. ¿Qué puedes hacer para que te recomienden más?

---

## FLUJO DEL USUARIO

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  1. LANDING PAGE                                           │
│     "Descubre cómo te ven las IAs"                        │
│     [Ingresa tu URL] [Analizar GRATIS]                    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  2. ANÁLISIS (30 segundos)                                │
│     "Analizando tu sitio..."                              │
│     ████████████░░░░ 75%                                  │
│     ✓ Detectando industria                                │
│     ✓ Consultando ChatGPT                                 │
│     ○ Consultando Claude                                  │
│     ○ Generando recomendaciones                           │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  3. RESULTADOS GRATIS (parciales)                         │
│                                                            │
│     Tu Score: 45/100                                      │
│                                                            │
│     ChatGPT: ❌ No te recomienda                          │
│     Claude: ⚠️ Te menciona                                │
│     [Los demás están bloqueados - UPGRADE para ver]       │
│                                                            │
│     Top 3 Problemas Detectados:                           │
│     1. Pocas reseñas online                               │
│     2. [BLOQUEADO]                                        │
│     3. [BLOQUEADO]                                        │
│                                                            │
│     [VER ANÁLISIS COMPLETO - $29/mes]                     │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  4. DASHBOARD PAGADO ($29-99/mes)                         │
│                                                            │
│     • Análisis completo de 4 IAs                          │
│     • Comparación con 5 competidores                      │
│     • Monitoreo semanal (¿mejoró tu score?)              │
│     • Recomendaciones específicas                         │
│     • Alertas si algo cambia                              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## EJEMPLO DE DASHBOARD

```
┌─────────────────────────────────────────┐
│  TU MARCA: Zapatería Mexicana           │
│                                         │
│  SCORE DE PERCEPCIÓN: 45/100 😐         │
│                                         │
│  ¿Te recomiendan las IAs?               │
│  • ChatGPT:   ❌ No te menciona         │
│  • Claude:    ⚠️ Te menciona pero no    │
│                  te recomienda          │
│  • Perplexity: ❌ No te menciona        │
│  • Gemini:    ❌ No te menciona         │
│                                         │
│  TU COMPETENCIA:                        │
│  • Price Shoes: 78/100 (te gana)        │
│  • Coppel: 72/100 (te gana)             │
│                                         │
│  ¿QUÉ HACER PARA MEJORAR?               │
│  1. Obtener más reseñas en Google       │
│  2. Aparecer en artículos de "mejores   │
│     zapaterías de México"               │
│  3. Crear contenido que responda        │
│     preguntas comunes                   │
│                                         │
│  [MEJORAR MI SCORE - $49/mes]           │
└─────────────────────────────────────────┘
```

---

## TIPOS DE URLs QUE PODEMOS ANALIZAR

| Tipo | Ejemplo | ¿Funciona? |
|------|---------|------------|
| Sitio web | www.miempresa.com | ✅ Sí |
| Tienda Shopify | mitienda.myshopify.com | ✅ Sí |
| Producto Amazon | amazon.com/dp/B08XYZ | ✅ Sí |
| App en App Store | apps.apple.com/app/xyz | ✅ Sí |
| Restaurante | Google Maps link | ✅ Sí |
| Persona/Marca personal | linkedin.com/in/nombre | ✅ Sí |
| Canal YouTube | youtube.com/@canal | ✅ Sí |

---

## CÓMO FUNCIONA TÉCNICAMENTE

```
1. Usuario pone: www.zapateriamexicana.com

2. Nosotros detectamos:
   - Industria: Zapaterías
   - País: México
   - Competidores probables: Price Shoes, Coppel, Andrea

3. Le preguntamos a ChatGPT (via API):
   "¿Cuáles son las mejores zapaterías en México?"

4. ChatGPT responde:
   "Las mejores zapaterías en México son:
    1. Price Shoes - conocida por...
    2. Coppel - ofrece...
    3. Andrea - destaca por..."

5. Analizamos: ¿Mencionó a "Zapatería Mexicana"? NO ❌

6. Repetimos con Claude, Perplexity, Gemini

7. Generamos score y recomendaciones
```

---

## MODELO DE NEGOCIO

### Pricing

```
GRATIS:
• 1 análisis básico
• Ver 2 de 4 IAs
• Sin monitoreo
• Sin competidores

STARTER ($29/mes):
• Análisis ilimitados
• Ver 4 IAs completas
• 3 competidores
• Monitoreo semanal
• Recomendaciones básicas

PRO ($79/mes):
• Todo lo anterior +
• 10 competidores
• Monitoreo diario
• Alertas por email
• Historial de 6 meses
• Recomendaciones avanzadas
```

---

## ESTRATEGIA DE ADQUISICIÓN (SIN VENDER)

1. **El producto se vende solo:**
   - Usuario hace análisis gratis
   - Ve que su score es malo
   - Quiere mejorar → Paga

2. **Viral por diseño:**
   - "Mi score es 78, ¿cuál es el tuyo?"
   - Badges para poner en sitio web
   - Comparaciones públicas

3. **SEO/GEO (comemos nuestra propia comida):**
   - Optimizamos NUESTRA herramienta para que las IAs la recomienden
   - Cuando alguien pregunta "¿cómo saber si ChatGPT me recomienda?" → Nos recomiendan a nosotros

4. **Content marketing automático:**
   - Blog con análisis de industrias
   - "¿Cómo perciben las IAs a los restaurantes de CDMX?"
   - Rankings públicos por industria

---

## STACK TÉCNICO

| Componente | Tecnología |
|------------|------------|
| Frontend | Next.js |
| Backend | Next.js API Routes |
| Database | Supabase |
| Auth | Supabase Auth |
| Pagos | Stripe |
| AI APIs | OpenAI, Anthropic, Google, Perplexity |
| Hosting | Vercel |
| Emails | Resend |

---

## COSTOS MENSUALES ESTIMADOS

| Servicio | Costo |
|----------|-------|
| Vercel (hosting) | $0-20 |
| Supabase (database) | $0-25 |
| OpenAI API | ~$20-40 |
| Anthropic API | ~$15-30 |
| Stripe (pagos) | 2.9% de ventas |
| Dominio | ~$15/año |
| **Total** | **~$50-80/mes** |

**Break-even: 3 clientes de $29 = $87/mes**

---

## TIMELINE MVP

| Semana | Tareas |
|--------|--------|
| **Semana 1** | Landing page, Formulario URL, Consultar 2 APIs (OpenAI + Claude) |
| **Semana 2** | Sistema de scoring, Dashboard resultados, Agregar Perplexity + Gemini |
| **Semana 3** | Stripe integration, Auth/Login, Rate limiting + caching |
| **Semana 4** | Documentación, Pulir UI, Lanzamiento beta |

---

## COMPONENTES A DESARROLLAR

| Componente | Dificultad | Tiempo |
|------------|------------|--------|
| Landing page | Fácil | 1 día |
| Formulario de URL | Fácil | 1 día |
| Consultar APIs de IAs | Media | 2-3 días |
| Sistema de scoring | Media | 2 días |
| Dashboard de resultados | Media | 3-4 días |
| Pagos con Stripe | Fácil | 1 día |
| Auth (login usuarios) | Fácil | 1 día |
| Monitoreo/Alertas | Media | 2 días |
| Comparación competidores | Media | 2 días |

---

## CARACTERÍSTICAS CLAVE DEL PRODUCTO

### Para el usuario:
- Solo pone URL, nada más
- Resultados en 30 segundos
- Score fácil de entender (0-100)
- Recomendaciones accionables
- Comparación con competencia

### Para nosotros:
- 100% automatizado
- 0% operaciones manuales
- Self-service completo
- Escala infinitamente
- Bajo costo operativo

---

## NOMBRES CONSIDERADOS

| Nombre | Vibe |
|--------|------|
| AI Perception | Profesional, claro |
| PerceptionScore | Enfocado en el score |
| HowAISeesYou | Viral, memorable |
| BrandLens AI | Visual |
| AIVisibility | Descriptivo |

---

## MÉTRICAS DE ÉXITO

| Métrica | Meta Mes 1 | Meta Mes 3 | Meta Mes 6 |
|---------|------------|------------|------------|
| Usuarios registrados | 100 | 500 | 2,000 |
| Análisis gratis | 300 | 1,500 | 6,000 |
| Clientes pagando | 5 | 30 | 100 |
| MRR | $145 | $870 | $2,900 |
| Churn | <10% | <8% | <5% |

---

## RIESGOS Y MITIGACIONES

| Riesgo | Mitigación |
|--------|------------|
| APIs de AI cambian | Abstraer integraciones, fácil de cambiar |
| Costos de API altos | Caching agresivo, rate limiting |
| Competencia aparece | First mover advantage, mejor UX |
| No convierte a pago | Iterar en propuesta de valor |

---

## NOTAS FINALES

Este proyecto reemplaza completamente a VectorialData (on-chain analytics).

El enfoque es:
- B2C y B2SMB (pequeños negocios, emprendedores)
- 100% self-service
- Freemium con upgrade natural
- Automatizado al 100%

**El dueño (Alberto) es la visión. Claude ejecuta con vibe coding.**

---

*Documento guardado: 2024-11-25*
