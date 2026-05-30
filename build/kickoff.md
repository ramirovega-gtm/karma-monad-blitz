# Build kickoff — Karma (anillo 1)

Equipo confirmado: **3 personas, cómodos con Solidity.** Build útil ~7h (10:45 → 17:35). Submission 17:35, demo en vivo 18:00.

> ⚠️ El código del dApp va en un **repo de build SEPARADO** (este repo es contexto/plan). Arrancá clonando el template y pegando el prompt de abajo.

## Setup (terminal, repo nuevo de build)

```bash
git clone https://github.com/monad-developers/foundry-monad karma-app && cd karma-app
curl -L https://foundry.paradigm.xyz | bash && foundryup
# faucet: testnet-faucet.monad.xyz → MON + USDC a la wallet de deploy
# verificar direcciones ERC-8004 en docs.monad.xyz/guides/erc-8004
```

## Prompt de kickoff (pegar en Claude Code, repo de build)

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

FRONT (Next + shadcn + React Flow @xyflow/react):
- viem watchContractEvent sobre transporte WebSocket (wss) escuchando PaymentRecorded → setNodes/setEdges concat (arista animada = USDC viajando) + d3-force layout.
- Cada nodo muestra score + badge de Tier (calavera/buen pagador). Contador de tx/seg + comparador de costo "Monad vs Ethereum".
- Cuando un agente recibe Skull, su nodo se marca y un bid suyo se rechaza visiblemente.

NO construyas: LoanManager, LiquidationEngine, ReverseAuction, AI risk engine real. Empezá por ScoreRegistry + el server x402 + el front escuchando eventos, en paralelo. Meta: loop end-to-end (pago→evento→grafo→score→SBT) andando lo antes posible.
```

## Reparto (3 personas)

| Quién | Dueño de | Entregable 15:00 |
|---|---|---|
| **A** | Contratos (Foundry): `ScoreRegistry` + `ReputationSBT` + deploy | contratos deployados + verificados |
| **B** | Backend + agentes (Node/TS): server x402, cascada, oráculo firmante | settle → `recordPayment` andando |
| **C** | Front (Next + React Flow): grafo en vivo + score/SBT por nodo | aristas apareciendo por evento WS |

## Plan hora-por-hora

| Hora | A (Contratos) | B (Backend+Agentes) | C (Front) |
|------|---------------|----------------------|-----------|
| 10:45-11:30 | scaffold + `ScoreRegistry` skeleton + eventos | setup `@x402/*` + facilitador + USDC | scaffold + React Flow vacío |
| 11:30-12:30 | `recordPayment` + `setScore` (ECDSA) | server x402 (1 endpoint) + cliente que paga | mock graph, nodos/aristas |
| 12:30-13:30 | `ReputationSBT` (OZ `_update`) + mint | cascada A→B→C + oráculo firma score | viem `watchContractEvent` (WS) → arista live |
| 13:30-14:00 | **deploy testnet** + addresses | settle → `recordPayment` | leer ERC-8004 identidad (labels) |
| 14:00-15:00 | integración: pago→evento→score→SBT | idem | score + SBT tier por nodo |
| **15:00-16:00** | **INTEGRACIÓN END-TO-END + buffer (sagrado)** | idem | idem |
| 16:00-16:45 | **stretch: ReverseAuction** (ver abajo) | demo-safe fallback (mock settle) | beat regalía + calavera + polish |
| 16:45-17:35 | congelar, ensayar 2×, screenshots backup | idem | idem |

**Regla de oro:** loop end-to-end cerrado a las **15:00**. Después: integración + polish + ensayo, NO features.

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

1. **A:** clone foundry-monad, `foundryup`, faucet, esqueleto `ScoreRegistry` con eventos.
2. **B:** `npm i @x402/core @x402/evm @x402/fetch @x402/express`, conectar facilitador + USDC, 1 endpoint que devuelva 402.
3. **C:** `npx create-next-app` + shadcn + `@xyflow/react`, React Flow vacío con viem en transporte WebSocket listo para `watchContractEvent`.

## Plan B (riesgos)

- x402 falla en vivo → mock settle + `recordPayment` igual dispara el grafo.
- Loop no cierra → 3 agentes precargados + el SBT calavera con wallets fijas.
- Siempre: **video de respaldo** grabado 16:45-17:35.

---

*La idea completa (problema, solución, demo, scoring) está en `../idea/karma.md`.*
