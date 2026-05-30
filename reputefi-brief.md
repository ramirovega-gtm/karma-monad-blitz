# ReputeFi — Brief para el equipo

**Monad Blitz · Buenos Aires · 30 Mayo 2026**

> **La idea en una frase:** Un marketplace P2P de préstamos en Monad donde los borrowers tienen un credit score onchain, los lenders compiten en subasta inversa para prestarles a menor tasa, y los que no pagan reciben un "sello de moroso" pegado a su wallet para siempre.

> **Frase de pitch (el alma del proyecto):**
> *"Lo mejor del blockchain es el anonimato. Lo peor del blockchain es el anonimato."*
> *"No nos importa quién sos. Nos importa qué hiciste."*

---

## 1. El problema

Hoy en DeFi el lending tiene 3 fallas:

1. **Todos pagan la misma tasa.** Un wallet con 4 años de historial limpio paga igual que uno creado ayer para farmear.
2. **Over-colateralización.** En Aave necesitás depositar ~$150 para pedir $100. Ineficiente, no sirve para crédito real.
3. **Sin consecuencia reputacional.** Si no pagás, perdés el colateral y listo. Abrís otra wallet y volvés como si nada.

**Contexto de mercado:** Aave v3 ya deployó en Monad con ~$15M. El mercado está; la infraestructura de reputación, no.

---

## 2. La solución — 3 piezas

### Pieza 1 — Credit Score onchain (0–1000)

Score público por wallet, calculado a partir de:

| Dimensión | Peso | Qué mide |
|---|---|---|
| Antigüedad | 200 | Primera tx onchain del wallet |
| Volumen | 200 | Volumen acumulado de transacciones |
| Diversidad | 200 | Cantidad de protocolos únicos usados |
| Comportamiento DeFi | 200 | Repagos vs liquidaciones en lending |
| Señal social | 200 | NFTs holdeados, ENS/.nad, edad de NFTs |

**Lo que predice:** robamos el enfoque de Spectral — no scoreamos "bondad" abstracta, scoreamos un evento medible: **probabilidad de repago del préstamo**. Más concreto, más defendible.

El score es **composable**: cualquier contrato de Monad lo lee en 1 línea.

### Pieza 2 — Subasta inversa de préstamos

```
1. Borrower pide $1000 USDC por 30 días
2. Su score (750) → colateral requerido: 75% ($750)
3. Deposita colateral + abre subasta
4. Lenders ven wallet + score + colateral
5. Compiten bajándose la tasa:
   Lender A: 8% / Lender B: 6.5% (gana) / Lender C: 7%
6. Lender B presta, arranca el préstamo
```

**Fórmula de colateral (escala con el score):**
```
collateral_ratio = 150% - (score / 1000 × 100%)

Score 1000 → 50%  de colateral (under-collateralized)
Score 700  → 80%
Score 400  → 110%
Score 0    → 150% (como Aave normal)
```

### Pieza 3 — Sistema simétrico: zanahoria y garrote

Cuando vence el préstamo, dos caminos, los dos onchain:

**PAGA A TIEMPO ✅**
- El score sube → próximo préstamo con menos colateral y mejor tasa
- Recupera el colateral completo
- Mintea un **SBT de buen pagador** (medallas de "good standing")

**NO PAGA ❌**
- El colateral se transfiere al lender automáticamente
- El score se desploma −300 puntos
- Mintea el **SBT de moroso**: irrevocable, visible en toda wallet de Monad (la "calavera")

> **Nota técnica:** los SBT (Soulbound Tokens) son NFTs no transferibles. Estándar **EIP-5192** (popularizado por Vitalik en 2022). Se forkea un ERC-721 de OpenZeppelin y se rompe la transferibilidad (guard en `_update`). ~30 líneas de Solidity.

---

## 3. Decisiones de diseño ya tomadas

| Tema | Decisión | Por qué |
|---|---|---|
| Mecánica de mercado | **Subasta inversa** (lenders compiten bajando tasa) | Es el diferenciador. Nadie más lo tiene. |
| Colateral | **Parcial, escalado por score** | Sweet spot narrativo: "tu reputación vale plata" en pesos. |
| Default | **Slashing + colateral va al lender + SBT moroso** | Simétrico: el que arriesga recupera algo, el que falla paga doble. |
| Recompensa | **Score sube + SBT de buen pagador** | Reusa el código del SBT. Cierra el arco zanahoria/garrote. |
| **Plazo de préstamos** | **Corto: 7 / 14 / 30 días, renovables** | El score envejece (Spectral usa ventana de 60 días). Ciclos cortos = el sistema reputacional aprende rápido + menor riesgo = tasas bajas = demo del ciclo completo. |
| IA | **AI Risk Engine** (score con modelo, no fórmula fija) | Es el track más caliente de Monad. Corre off-chain, escribe el score firmado onchain (como hace Spectral con su oráculo). |

### Decisión estratégica clave: VERSIÓN DIFERENCIADA

Evaluamos ir "100% por el scoring puro" (como Spectral/Cred/Arcx) vs el marketplace completo.

**Vamos por la versión diferenciada (marketplace), NO el scoring puro.** Razón: el scoring puro está saturado y se siente "otro Spectral". El marketplace con subasta inversa + SBT de moroso es lo que no hizo nadie, y es lo que hace la demo memorable (gana voto popular).

**Centro de gravedad:** el score es el héroe, el préstamo + SBT son la prueba que lo hace memorable.

---

## 4. Cómo se diferencia (research del mercado)

No inventamos la rueda — combinamos piezas probadas que nadie juntó:

| Player | Score IA | P2P retail | Subasta | SBT moroso | Chain |
|---|---|---|---|---|---|
| Spectral | ✓ | — | — | — | Ethereum |
| Cred / Arcx | ✓ | — | — | — | Ethereum |
| Goldfinch | ~ | — | — | — | Ethereum |
| TrueFi | ~ | — | — | — | Ethereum |
| **ReputeFi** | ✓ | ✓ | ✓ | ✓ | **Monad** |

**Lección dura del mercado (importante para el Q&A):** Goldfinch y TrueFi defaultearon millones de dólares reales con lending no colateralizado (Goldfinch: un borrower repagó solo $4.25M de $10.2M). Por eso NO apostamos solo a reputación — combinamos **colateral parcial escalado por score + costo del SBT**. Doble red de seguridad.

---

## 5. Por qué Monad (no Ethereum)

- 10,000 TPS + bloques de 0.5s → subastas en tiempo real
- Gas ≈ $0 → recalcular scores y mintear badges en cada ciclo corto no cuesta nada
- Parallel execution → múltiples subastas en paralelo
- **El producto no existe sin una chain rápida y barata.** En Ethereum, recalcular scores constantemente y mintear badges en cada ciclo sería prohibitivo en gas.

---

## 6. Modelo de negocio — "El Equifax de Monad"

> No prestamos plata. Somos la capa de confianza sobre la que todos los demás prestan.

| Fase | Modelo | Detalle |
|---|---|---|
| **Hoy** | Origination fee | 0.5–1% de cada préstamo originado. Embebido en el contrato. Modelo de Aave/Compound. |
| **Mañana** | Score-as-a-Service | Otros protocolos pagan por consultar scores vía oráculo. ReputeFi = oráculo de riesgo del ecosistema. |
| **Después** | Premium + governance | Analytics y AI underwriter para lenders pro (freemium). Token de governance/staking como capa futura, NO como core. |

**Mercado:** el crédito privado tokenizado creció 930% hasta $9.68B en 2025. El que tiene la data de riesgo tiene el poder — el negocio de Equifax, FICO y Veraz, ahora onchain.

---

## 7. Arquitectura técnica

```
FRONTEND (Next.js + shadcn/ui)
    ├─ Connect Wallet (Dynamic SDK o RainbowKit)
    ├─ Dashboard de Score
    ├─ Pedir préstamo (borrower)
    ├─ Ver subastas activas (lender)
    └─ Mi posición

INDEXER (Envio HyperIndex)
    └─ Lee data onchain de Monad testnet

AI RISK ENGINE (Node + TS, off-chain)
    └─ Toma data de Envio → calcula score → lo firma → lo escribe onchain
       (un contrato solo deja que el "oráculo" actualice scores)

SMART CONTRACTS (Solidity + Foundry)
    ├─ ScoreRegistry.sol     → guarda scores onchain
    ├─ ReverseAuction.sol    → subasta inversa
    ├─ LoanManager.sol       → préstamo, colateral, repagos
    ├─ LiquidationEngine.sol → ejecuta slashing
    ├─ DefaulterBadge.sol    → SBT de moroso (EIP-5192)
    └─ GoodPayerBadge.sol    → SBT de buen pagador (mismo molde)
```

### Stack

| Capa | Tool |
|---|---|
| Contracts | Foundry + Solidity (OpenZeppelin para bases ERC) |
| Indexing | Envio HyperIndex |
| Frontend | Next.js + shadcn/ui + Tailwind |
| Wallet connect | Dynamic SDK o RainbowKit |
| RPC | testnet-rpc.monad.xyz |
| Deploy frontend | Vercel |

---

## 8. Alcance por anillos (qué buildear vs qué pitchear)

**Anillo 1 — CORE, sí o sí, no depende de nada externo (= la demo):**
- ScoreRegistry (score onchain, escrito por el oráculo)
- LoanManager con colateral parcial escalado por score
- Subasta inversa
- SBT de moroso + SBT de buen pagador
- Frontend que conecta las wallets y muestra el flujo

**Anillo 2 — si sobra tiempo (mejora la demo):**
- AI Risk Engine real (si no, fórmula fija — nadie nota la diferencia en la demo)
- Envio para data real (si no, wallets precargadas con stats mockeados)

**Anillo 3 — SOLO pitch, no se buildea:**
- Colateral productivo (que el colateral genere yield mientras está bloqueado)
- Agentes autónomos que pujan solos
- Blacklist cross-protocol

> **La regla de oro:** el Anillo 1 no debe depender de nada que no controlemos. Si Envio falla, si la API tiene lag, si el wifi es un desastre → la demo igual funciona.

### ⚠️ Decisión pendiente que define el alcance

**¿Qué tan cómodo estás con Foundry / Solidity?**
- Si lo manejás bien → la subasta inversa entra completa (es EL diferenciador).
- Si estás más verde → simplificamos la subasta a "borrower publica, lenders aceptan/no" sin puja competitiva, y el frontend la hace *ver* como subasta. Misma historia en la demo.

**Reparto sugerido:** vos en contratos + deploy a testnet / Manu en frontend + flujo de demo + score engine.

---

## 9. La demo en vivo (lo que mostramos)

**3 wallets precargadas con roles fijos** (no dependemos de que aparezcan usuarios orgánicos):

1. 🟢 **Veterano** (Score 850 + badges de buen pagador) → pide $1000, traba $650, gana subasta a 4.2% APR
2. 🟡 **Nuevo** (Score 450) → pide $1000, traba $1050, gana subasta a 9% APR
3. 🔴 **Moroso** (Score 200 + SBT) → pide $1000, ningún lender puja, queda sin financiamiento

**El showstopper:** abrimos la wallet 3 en Phantom/Backpack y se ve el JPG del sello de moroso pegado. Game over.

**Detalles operativos a cerrar:**
- Tiempo comprimido: el plazo en testnet debe ser en **bloques, no días reales**, para mostrar el ciclo pedir→pagar→score-sube→badge en vivo.
- Quién comparte pantalla y habla, quién está atrás listo para reiniciar si algo se cuelga.

---

## 10. Banco de preguntas filosas del jurado

**"¿Por qué un lender prestaría a tasa baja vs otros protocolos?"**
> No presta barato por caridad — presta barato porque el riesgo es bajo y lo puede *medir*. En Aave su plata va a un pool ciego que le presta a cualquiera. Acá elige al borrower de score 850 con historial limpio y colateral, y arma una cartera con default cercano a cero. Cambia margen por certeza. Es prestarle a una empresa AAA vs a un desconocido — nosotros damos los datos para saber cuál es cuál.
> *Límite honesto:* para borrowers de score bajo/medio no le ganamos a Aave. Nuestro beachhead son los borrowers de alta calidad que hoy sobre-pagan en el pool ciego de Aave.

**"¿Y si copian el contrato?"**
> Es DeFi, todo es forkeable. El valor no está en el código — está en la data y la red. El score gana valor con cada préstamo que pasa por el sistema; un fork arranca con la base vacía. Es el foso de cualquier marketplace: las dos puntas y el historial.

**"¿Cómo arrancás sin liquidez / usuarios?" (cold start)**
> Empezamos por un nicho chico de borrowers de alta calidad (los que sobre-pagan en Aave) y traemos pocos lenders a darles tasa justa. No intentamos ser Aave día uno.

**"¿El score no es gameable?"**
> Alguien puede inflar el score con actividad falsa. El colateral parcial es la red de seguridad mientras el modelo madura, y el costo de construir un historial falso convincente es alto si pesás antigüedad y diversidad real. (Spectral mide explícitamente el "costo de ataque".)

**"¿Esto es legal / regulatorio?"**
> El credit scoring toca regulación pesada (FCRA en EE.UU., ley de datos acá). El score atado a wallet y no a identidad legal nos mantiene en territorio cripto-nativo por ahora.

**"¿Quién dispara el default?"**
> Automático por tiempo: pasado el deadline, cualquiera puede llamar `liquidate()` → transfiere colateral + slashea score + mintea SBT. Sin oráculo humano.

**"¿Cómo se redime el moroso?"**
> El SBT es revocable después de N préstamos pagados. Mientras lo tiene, puede pedir prestado con colateral total (como Aave normal) → tiene un camino de vuelta, no es muerte civil de la wallet.

---

## 11. Checklist pre-hackathon (esta noche)

- [ ] Faucet de Monad testnet → MON a las wallets (testnet-faucet.monad.xyz)
- [ ] Cuenta gratis en Envio (envio.dev) y Vercel
- [ ] Clonar template: `git clone https://github.com/monad-developers/foundry-monad`
- [ ] Instalar Foundry: `curl -L https://foundry.paradigm.xyz | bash`
- [ ] Mirar Dynamic SDK / RainbowKit de antes (onboarding sin seed phrase)
- [ ] Definir entre los dos: nivel de Solidity → alcance de la subasta + reparto de tareas

---

## 12. Plan hora por hora (10:45 → 17:35)

| Hora | Tarea | Quién |
|---|---|---|
| 10:45–11:30 | Setup: Foundry, Next.js, Envio, wallets con MON | Ambos |
| 11:30–13:00 | Contracts (Score + Auction + Loan) ∥ API scoring | Split |
| 13:00–14:00 | 🍽️ Lunch + validar idea con otros builders | Ambos |
| 14:00–15:00 | Liquidation + SBTs ∥ frontend del flujo | Split |
| 15:00–16:00 | Integración end-to-end: subasta con wallets reales | Ambos |
| 16:00–17:00 | Pulido visual + 3 wallets precargadas | Split |
| 17:00–17:35 | Slides + ensayar demo 2× | Ambos |
| **17:35** | 🚨 Submission deadline | — |
| 18:00 | 🎤 Demo en vivo | Ambos |

---

## 13. El pitch de 2 minutos

> **[Problema — 25s]** "Aave acaba de deployar en Monad con $15M. Pero todos los wallets pagan la misma tasa, y si no pagás, abrís otra wallet y listo. No hay consecuencia."
>
> **[Solución — 30s]** "Construimos un marketplace P2P de préstamos en Monad con 3 piezas: un credit score onchain de 0 a 1000 basado en tu historial, una subasta inversa donde los lenders compiten bajando la tasa, y un sello de moroso (Soulbound Token) que se pega para siempre a la wallet que no paga."
>
> **[Demo — 50s]** *[3 wallets, subasta en vivo, abrís la wallet del moroso con el JPG]*
>
> **[Cierre — 15s]** "Es el primer historial crediticio público y portable de DeFi. Composable: cualquier protocolo de Monad lo lee en una línea. Monad es la primera chain donde esto es económicamente viable. Gracias."

---

*Próximo paso pendiente: armar el prompt de Claude Code del Anillo 1 (scaffold de contratos + frontend) — calibrado según el nivel de Solidity del equipo.*
