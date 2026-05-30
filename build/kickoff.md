# Build kickoff — Karma (anillo 1)

Build útil ~7h (10:45 → 17:35). Submission 17:35, demo en vivo 18:00.

> ✅ **Decisión:** todo se desarrolla en **este mismo repo**, **sin dividir el trabajo por personas**. **Contratos + backend de este lado**; el **front lo trabaja otra persona** y se **acopla después** (consume ABIs + eventos). El estado vivo del build está en [`CHANGELOG.md`](CHANGELOG.md); el plan con diagramas en [`plan.html`](plan.html).

## Setup (terminal, en este repo)

```bash
# inicializar Foundry acá (template oficial Monad):
forge init --template monad-developers/foundry-monad contracts
curl -L https://foundry.paradigm.xyz | bash && foundryup
# faucet: testnet-faucet.monad.xyz → MON + USDC a la wallet de deploy
# verificar direcciones ERC-8004 en docs.monad.xyz/guides/erc-8004
```

## Prompt de kickoff (pegar en Claude Code, en este repo)

```
Construí el "anillo 1" de Karma: la capa de confianza de una economía de agentes en Monad testnet (chain 10143, RPC https://testnet-rpc.monad.xyz). Stack: Foundry+Solidity (OZ v5), Node/TS backend, Next+shadcn+React Flow front, viem.

CONTRATOS (Foundry):
1. ScoreRegistry.sol:
   - mapping(uint256 agentId => Score{int256 value; uint64 updatedAt; uint64 jobs})
   - mapping(bytes32 inputHash => Artifact{address producer; string uri; uint64 validUntil; uint16 royaltyBps})
   - recordPayment(uint256 agentId, uint256 amount, bytes32 inputHash): emite PaymentRecorded(agentId, amount, inputHash, msg.sender) y cachea el Artifact.
   - lookup(bytes32 inputHash) view returns Artifact.
   - setScore(uint256 agentId, int256 value, uint256 nonce, bytes sig): verifica ECDSA contra `signer` autorizado (OZ ECDSA + MessageHashUtils), guarda score, emite ScoreUpdated; si value>=GOOD_THRESHOLD llama sbt.mint(agentId, GoodPayer).
   - markDefault(uint256 agentId) onlyOwner: llama sbt.mint(agentId, Skull).
2. ReputationSBT.sol: EIP-5192, fork OZ ERC721, guard en _update (revert si from!=0 && to!=0), locked()=true, supportsInterface incluye 0xb45a3c0e, enum Tier{GoodPayer,Skull}, mint(agentId,tier) solo desde ScoreRegistry.
   Tests Foundry mínimos + script de deploy a Monad testnet (verificación Sourcify).

BACKEND (Node/TS, viem):
- Server x402 con @x402/express: 1 endpoint protegido que tras settle exitoso (facilitador https://x402-facilitator.molandak.org, USDC testnet 0x534b2f3A21130d7a60830c2Df862319e593943A3, chain eip155:10143) dispara una TX ScoreRegistry.recordPayment. IMPORTANTE: que recordPayment se llame aunque el settle se mockee (flag DEMO_SAFE).
- Cliente: orquestador con @x402/fetch que contrata a 2-3 agentes proveedores en cascada (texto mock o Claude). Antes de pagar consulta lookup(inputHash); si existe y validUntil>now, paga solo la regalía.
- Oráculo firmante: fórmula fija score = min(100, jobs*10 + volUSDC/10), firma y postea setScore.

FRONT (otra persona, se acopla después — NO lo construyas en este repo):
- El front (Next + shadcn + React Flow) lo desarrolla otra persona y consume lo que dejamos: ABIs + addresses desplegadas + eventos PaymentRecorded/ScoreUpdated vía WS.
- Tu trabajo acá respecto al front: dejar publicados los ABIs/addresses (ej. abi/deployments.json) y que los eventos tengan el shape esperado.

NO construyas: el FRONT (otra persona), LoanManager, LiquidationEngine, ReverseAuction, AI risk engine real. Empezá por ScoreRegistry + el server x402, en paralelo. Meta: loop core (pago→recordPayment→evento→score→SBT) andando lo antes posible, verificable por logs/explorer sin depender del front.
```

## Reparto (por track, no por personas)

Todo en este repo. **Contratos + backend de este lado**; el **front lo trabaja otra persona** y se acopla después.

| Track | Alcance | Entregable 15:00 |
|---|---|---|
| **Contratos** | Foundry: `ScoreRegistry` + `ReputationSBT` + deploy + ABIs | contratos deployados + verificados + `abi/deployments.json` |
| **Backend** | Node/TS: server x402, cascada, oráculo firmante, puente | settle → `recordPayment` → score → SBT andando |
| **Front** *(otra persona)* | Next + React Flow: grafo en vivo + score/SBT por nodo | se acopla después leyendo ABIs + eventos |

## Plan hora-por-hora

| Hora | Contratos | Backend + Agentes |
|------|-----------|--------------------|
| 10:45-11:30 | scaffold + `ScoreRegistry` skeleton + eventos | setup `@x402/*` + facilitador + USDC |
| 11:30-12:30 | `recordPayment` + `setScore` (ECDSA) | server x402 (1 endpoint) + cliente que paga |
| 12:30-13:30 | `ReputationSBT` (OZ `_update`) + mint | cascada de agentes + oráculo firma score |
| 13:30-14:00 | **deploy testnet** + addresses + publicar ABIs | settle → `recordPayment` |
| 14:00-15:00 | integración: pago→evento→score→SBT | idem |
| **15:00-16:00** | **INTEGRACIÓN CORE END-TO-END + buffer (sagrado)** | idem |
| 16:00-16:45 | **stretch: ReverseAuction** (ver abajo) | demo-safe fallback (mock settle) |
| 16:45-17:35 | congelar, ensayar 2×, screenshots backup | idem |

> El **front** corre en paralelo (otra persona) y se acopla cuando los contratos están desplegados y los eventos publicados.

**Regla de oro:** loop core cerrado a las **15:00** (verificable por logs/explorer). Después: integración + acople con el front + polish + ensayo, NO features.

## Stretch: ReverseAuction.sol (solo si el loop anda a las 15:00)

```
ReverseAuction.sol:
- openJob(bytes32 jobId, uint256 budget): un orquestador publica una tarea.
- bid(bytes32 jobId, uint256 price): proveedores pujan bajando precio.
  → effective = price * (1 + (100 - score)/100)   // peor reputación = bid más caro (lee ScoreRegistry)
  → bidder con SBT calavera: bid revierte (excluido on-chain) ← momento de aplauso
- close(bytes32 jobId): gana el effective más bajo; dispara el pago x402 al ganador.
Implementa el bid-weighting-by-reputation que el paper Agent Exchange dejó en teoría.
```

## Primeros 45 min (en paralelo, ya)

1. **Contratos:** `forge init --template monad-developers/foundry-monad contracts`, `foundryup`, faucet, esqueleto `ScoreRegistry` con eventos.
2. **Backend:** `npm i @x402/core @x402/evm @x402/fetch @x402/express`, conectar facilitador + USDC, 1 endpoint que devuelva 402.
3. *(Front, otra persona, en paralelo: `create-next-app` + shadcn + `@xyflow/react` + viem WS — no es trabajo de este repo.)*

## Plan B (riesgos)

- x402 falla en vivo → mock settle + `recordPayment` igual dispara el grafo.
- Loop core no cierra → 3 agentes precargados + el SBT calavera con wallets fijas.
- Front no llega a acoplarse → demostrar el loop core por el explorer (eventos + SBT minteado) + video de respaldo.
- Siempre: **video de respaldo** grabado 16:45-17:35.

---

*La idea completa (problema, solución, demo, scoring) está en `../idea/karma.md`.*
