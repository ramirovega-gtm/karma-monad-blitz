# CLAUDE.md — Karma (Monad Blitz BA)

> Contexto maestro para cualquier sesión de Claude que trabaje en este repo. Leelo entero antes de tocar nada. El detalle vive en los docs enlazados; acá está lo que NO podés ignorar.

## Qué es Karma

**La capa de confianza de la economía de agentes en Monad.** Agentes AI se contratan y se pagan por-resultado on-chain (vía x402), **cada pago construye reputación**, y el que falla recibe un **SBT calavera EIP-5192 irrevocable** que lo excluye del mercado.

```
agentes se contratan y pagan vía x402
  → cada pago escribe una arista en un context graph on-chain (ScoreRegistry)
  → reputación (score) + memoria (no pagar dos veces lo mismo → regalía)
  → el que falla recibe SBT calavera irrevocable → excluido on-chain
```

**El SBT calavera es el corazón y el héroe del demo.** Evento: Monad Blitz Buenos Aires, build de 1 día, voto de audiencia. Submission 17:35, demo 18:00.

## Reglas de oro (no negociables)

1. **Todo se desarrolla en ESTE repo.** Contratos + backend de este lado. **El front lo hace otra persona en repo aparte** (ver `build/FRONTEND-HANDOFF.md`); no crees `frontend/` acá.
2. **Trabajo por sesiones paralelas, sin dividir por personas.** Antes de codear, identificá en qué sesión estás (S0/A/B/C/MERGE) y **leé tu `build/sessions/SESSION-*.md`**. Es tu fuente de verdad.
3. **Tocá SOLO tus `FILES I OWN`.** Lo compartido (`backend/lib/*`, `.env.example`, `package.json`, `abi/I*.json`) queda **congelado tras la Sesión 0**. Si necesitás cambiarlo, anotalo en el CHANGELOG y coordiná — no lo edites en caliente.
4. **Una branch por sesión.** Cada sesión edita **solo su bloque** del `build/CHANGELOG.md` → merges limpios.
5. **No inventes addresses ni specs.** Verificá contra `frame/monad_tech.md`. Lo no confirmado se marca `[verificar]`.
6. **Scope: anillo 1, nada más.** El riesgo #1 es la sobre-ingeniería (anti-pattern #7). Está CORTADO: LoanManager, LiquidationEngine, AI risk engine real (→ fórmula fija firmada), escribir en ERC-8004 (solo lectura). ReverseAuction = stretch solo si el loop core anda.
7. **Mantené el CHANGELOG actualizado.** Es el "acá estamos": al cerrar un paso, marcá `[x]` en tu bloque y agregá una entrada al Log. Ninguna sesión debería tener que releer todo el plan para saber el estado.

## El modelo de sesiones

```
S0 · Cimientos (bloqueante, merge a main primero)
   ├─ A · Contratos (Foundry)        ┐
   ├─ B · Economía agentes (x402)    ├─ en paralelo, branch propio
   └─ C · Reputación on-chain        ┘
        └─ MERGE · Integración (une A+B+C, loop core E2E)
```

- **A/B/C son independientes entre sí.** Se desacoplan con la interfaz TS `ReputationLayer` (definida en S0) + mocks. Nadie espera a nadie: A→`forge test`, B→`MockReputationLayer`, C→anvil/testnet, Front→fixtures.
- Índice + matriz de propiedad + branches: **`build/sessions/SESSIONS.md`**.

## Contrato de interfaz (la fuente de verdad compartida)

**Superficie de contratos** (A la implementa, C la consume, el front la escucha):

```solidity
// ScoreRegistry
recordPayment(uint256 agentId, uint256 amount, bytes32 inputHash)
  → event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer)
lookup(bytes32 inputHash) view → (address producer, string uri, uint64 validUntil, uint16 royaltyBps)
setScore(uint256 agentId, int256 value, uint256 nonce, bytes sig)   // ECDSA vs signer
  → event ScoreUpdated(uint256 indexed agentId, int256 value); si value>=GOOD_THRESHOLD → mint GoodPayer
markDefault(uint256 agentId) onlyOwner → mint Skull

// ReputationSBT (EIP-5192)
enum Tier { GoodPayer, Skull }; locked()→true; mint(agentId,tier) solo desde ScoreRegistry
tierOf(uint256) view → Tier; hasSkull(uint256) view → bool; supportsInterface(0xb45a3c0e)
```

**Interfaz TS que desacopla B↔C** (`backend/lib/reputation.ts`):

```ts
export interface ReputationLayer {
  lookupArtifact(inputHash: Hex): Promise<Artifact | null>;            // ¿reúso? (regalía)
  recordPayment(a: {agentId: bigint; amount: bigint; inputHash: Hex}): Promise<Hex>;
  postScore(agentId: bigint): Promise<Hex>;
  markDefault(agentId: bigint): Promise<Hex>;
}
// S0 entrega MockReputationLayer (B corre solo). C entrega OnchainReputationLayer. MERGE intercambia (1 línea).
```

**Gap técnico clave:** el settle de x402 emite solo el `Transfer` ERC-20 del USDC, **no** un evento custom. El puente a `recordPayment` lo construye el backend (2ª TX). Con `DEMO_SAFE=true`, `recordPayment` se llama aunque el settle se mockee → el grafo nunca depende del facilitator en vivo.

## Datos verificados (Monad testnet) — no inventar

| | Valor |
|---|---|
| Chain ID | `10143` |
| RPC HTTP | `https://testnet-rpc.monad.xyz` |
| Logs en vivo | WebSocket `monadLogs` (estado Proposed, ~1s antes) |
| Explorer / verificación | `testnet.monadexplorer.com` / **Sourcify** (NO Etherscan) |
| x402 facilitador | `https://x402-facilitator.molandak.org` (gasless, EIP-3009) |
| USDC testnet | `0x534b2f3A21130d7a60830c2Df862319e593943A3` |
| ERC-8004 Identity | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` *(solo lectura)* |
| ERC-8004 Reputation | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` *(solo lectura)* |

⚠️ **Verificar el día**: addresses ERC-8004 (`docs.monad.xyz/guides/erc-8004` — dos fuentes dieron valores distintos) y el endpoint `RPC_WS`. Monad cobra por **gas limit** (no gas usado) → hardcodeá un gas limit ajustado en writes de alta frecuencia.

## Stack

- **Contratos:** Solidity + Foundry + OpenZeppelin v5. Template `monad-developers/foundry-monad`.
- **Backend/Agentes:** Node/TS, `@x402/express` + `@x402/fetch`, viem (oráculo firmante ECDSA), Claude para agentes.
- **Front (otra persona):** Next + shadcn + React Flow (`@xyflow/react`) + viem WS.

## Mapa del repo

```
CLAUDE.md            ← este archivo (contexto maestro)
README.md            ← punto de entrada
idea/karma.md        ← la idea completa (problema, solución, demo, riesgos)
frame/monad_tech.md  ← specs/addresses verificadas · anti_patterns.md · evaluation_frame.md
research/            ← los cycles de research que produjeron la idea
build/
  plan.html          ← plan de ejecución con diagramas (abrir en navegador)
  CHANGELOG.md       ← "acá estamos": tracker por sesiones + log (MANTENER AL DÍA)
  kickoff.md         ← prompt de arranque + plan hora-por-hora
  sessions/          ← SESSIONS.md (índice) + SESSION-{0,A,B,C,MERGE}.md (autocontenidos)
  FRONTEND-HANDOFF.md← todo lo que necesita la persona del front
contracts/  backend/  abi/   ← código (lo crea la Sesión 0 en adelante)
```

## Entorno / tooling

- **OS: Windows + PowerShell.** Usá sintaxis PowerShell (`$env:VAR`, `$null`), o el tool Bash para scripts POSIX. Foundry y Node corren en ambos.
- **Documentación de librerías:** usá **Context7 MCP** para docs actuales de x402, viem, OpenZeppelin, React Flow, Foundry, Next — incluso si creés que sabés la respuesta (tu training puede estar desactualizado).
- **Secrets:** nunca commitees `.env`; solo `.env.example`. Trabajá en local primero — si algo rompe o expone datos, que explote en local.

## El demo (3 min — el héroe es la calavera)

1. Problema + grafo con agentes (identidad ERC-8004).
2. Orquestador paga 2-3 agentes vía x402 → grafo crece, scores suben, GoodPayer SBT.
3. Beat regalía: reúso de un artefacto → paga regalía chica al productor original.
4. **SHOWSTOPPER:** `markDefault` → SBT calavera en el nodo → su próximo bid rechazado on-chain (abrir su identidad en el explorer).
5. Por qué Monad (gas ~0 + sub-segundo + paralelo) + cierre.

**Regla de oro del día:** a las 15:00 el loop core anda (verificable por explorer, sin depender del front). Después: integración + acople + polish + ensayo, NO features. Plan B siempre: `DEMO_SAFE`, 3 agentes precargados, video de respaldo.
