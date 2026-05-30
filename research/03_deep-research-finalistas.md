---
id: 2026-05-30_research_cycle-02-finalistas-002-y-001
type: signal
date: 2026-05-30
source: deep research x2 (docs.monad.xyz, coinbase/x402, blog.monad.xyz, envio, github monad-developers — ver fuentes)
status: processed
related: [[IDEA-002_agent-to-agent-micropagos]], [[IDEA-001_agentic-onchain-canvas]], [[monad_tech]]
---

# Research cycle #2 — profundización IDEA-002 y IDEA-001

Deep research dedicado por finalista para mejorarlas + atacar su riesgo #1.

## IDEA-002 — agent-to-agent micropagos (x402 on Monad)

- **x402 corre oficialmente en Monad.** Guía oficial + facilitador propio en vivo `https://x402-facilitator.molandak.org`. Paga en **USDC** (testnet `0x534b2f3A21130d7a60830c2Df862319e593943A3`), chain `eip155:10143`. El facilitator **paga el gas** (gasless para el agente): el agente solo firma EIP-3009 `TransferWithAuthorization`. Packages `@x402/core @x402/evm(≥2.2.0) @x402/fetch @x402/express|next`; Python `pip install x402`. — docs.monad.xyz/guides/x402-guide, github.com/coinbase/x402.
- **NO usar ERC-4337/7702/Privy para esto** — el facilitator ya resuelve gasless. Over-engineering para 1 día.
- **Prior art a evitar (clon):** **Dispatch** (`pranit-garg/Dispatch`) — marketplace de compute con x402 + reputación ERC-8004 ya en Monad. **x402 Bazaar** (Coinbase) — discovery off-chain. → Diferenciar con **registro de proveedores ON-CHAIN** + **cascada multi-agente** (1 tarea → 3-4 micropagos encadenados en pipeline), patrón no visto en el prior art.
- **Jurado Blitz = voto de audiencia en vivo** → wow es decisivo. Mitigar "parece logs": mostrar **resultado real apareciendo** (imagen/texto/gráfico), dashboard trading-floor con **USDC volando** comprador→vendedor, **links al explorer** por tx, comparación de costo vs Ethereum, **sonido** "cha-ching" por pago. — blog.monad.xyz/blog/home-for-builders.

## IDEA-001 — agentic on-chain canvas (r/place)

- **Correcciones de specs (importantes):** Monad cobra por **gas LIMIT, no gas usado** (`gas_paid = gas_limit * price`) → hardcodear gas limit ajustado en `setPixel`. Base fee mínimo **100 MON-gwei**, block gas limit 200M. Block time **oficial ~1s / "sub-second finality"** (el "400ms" del marketing está sin confirmar en docs → usar "sub-second" en el pitch). — docs.monad.xyz/developer-essentials/gas-pricing.
- **Riesgo #1 resuelto — read path:** WebSocket `eth_subscribe` con variante propia de Monad **`monadLogs`** (entrega logs en estado `Proposed`, ~1s antes que el estándar). 1 conexión persistente, no choca con rate-limit. Render `<canvas>` con `fillRect` por celda + coalescing en `requestAnimationFrame`. Estado inicial: leer "latest board" on-chain (mapping) con multicall, NO reproducir historial. — docs.monad.xyz/reference/, blog 2048.
- **Riesgo #1 — write path (el cuello real):** RPC público = **25 rps** (QuickNode) / 15 (Alchemy). NO firmar 200 tx/s contra público. Solución: **`paintBatch()`** (N píxeles en 1 tx) o **endpoint dedicado**. Patrón de ráfaga oficial (blog 2048): **nonce local en `useRef`** (++ antes de firmar) + **`eth_sendRawTransaction` directo** (sin simulación de viem) + **`Promise.all`** + gas hardcodeado. Privy embedded wallet = auto-sign sin popups. — docs.monad.xyz/developer-essentials/best-practices, blog.monad.xyz/blog/build-2048.
- **Prior art:** clones de r/place on-chain existen (CryptoCanvas, FTM.place, Solana). "Agentic" está saturado (413 proyectos agentic en hackatones Monad 2026). **Diferenciador real = "la demo ES un benchmark visible de Monad"** (contador tx/seg + costo vs Ethereum + "leemos el bloque en estado Proposed" + multi-agente concurrente), no "es un agente".
- **Templates para arrancar:** `monad-developers/scaffold-monad-foundry` (NextJS+RainbowKit+Wagmi+Viem+burner+faucet) o `foundry-monad`. — github.com/monad-developers.

## Fuentes (selección)

- [Monad x402 guide](https://docs.monad.xyz/guides/x402-guide) · [coinbase/x402](https://github.com/coinbase/x402) · [Dispatch (prior art)](https://github.com/pranit-garg/Dispatch) · [x402 Bazaar](https://docs.cdp.coinbase.com/x402/bazaar)
- [Monad Best Practices (high-perf)](https://docs.monad.xyz/developer-essentials/best-practices) · [Gas Pricing](https://docs.monad.xyz/developer-essentials/gas-pricing) · [RPC Reference (monadLogs)](https://docs.monad.xyz/reference/) · [Build 2048 blog](https://blog.monad.xyz/blog/build-2048)
- [Network Information (rate limits)](https://docs.monad.xyz/developer-essentials/network-information) · [Envio Monad](https://docs.monad.xyz/guides/indexers/tg-bot-using-envio) · [scaffold-monad-foundry](https://github.com/monad-developers/scaffold-monad-foundry)
- [Monad Blitz format / audience vote](https://blog.monad.xyz/blog/home-for-builders) · [Rebel in Paradise winners](https://www.kucoin.com/news/flash/monad-ai-hackathon-concludes-with-11-winning-projects-and-major-llm-partnerships)

## Related

- [[IDEA-002_agent-to-agent-micropagos]]
- [[IDEA-001_agentic-onchain-canvas]]
- [[monad_tech]]

---

**Status:** processed
**Last Updated:** 2026-05-30
