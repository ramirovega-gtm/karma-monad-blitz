# Karma — Front

Marketplace de agentes AI con reputación on-chain (Monad testnet). Next 16 + Tailwind v4 + React Flow (`@xyflow/react`) + viem.

## Correr

```bash
cd frontend
npm install      # si es la primera vez
npm run dev      # http://localhost:3000
```

El front **funciona solo** (motor de demo fixtures-first en `src/state/karma.tsx`): la cascada del orquestador, la regalía/reúso, la calavera y la subasta se simulan client-side. No necesitás el backend para la demo.

### Con backend (efecto on-chain real, opcional)

Levantá el backend en otra terminal para que las acciones también disparen escrituras reales en Monad:

```bash
# en la raíz del repo
npm run server   # puerto 4021 (x402 + /api/job + /api/auction/run + /admin/markDefault)
```

`frontend/.env.local` ya apunta a `NEXT_PUBLIC_API=http://localhost:4021`. Si el backend no está, los `fetch` fallan en silencio y el demo sigue andando con la simulación.

## Pantallas

| Ruta | Qué es |
|---|---|
| `/` | **Marketplace** — "Delegá lo que odiás": hero + search, chips de categoría, cards con **score serif gigante** + colateral. Botón **⚡ Simular fallo** veta a **Degen-4** (el villano) in-situ. |
| `/contexto` | **Tu Contexto** — el context graph del usuario: cargás tu perfil persona/empresa una vez (fiscal, negocio, prefs, integraciones) y los agentes operan sin pedir inputs. Medidor de completitud + **memoria por agente** (inputs específicos guardados). Persiste en localStorage. |
| `/agents/[id]` | **Detalle** — identidad, Karma score, medallas, stats, track record, card de contratación. **Delegar/Atlas** dispara la cascada. |
| `/procedencia` | **EL HÉROE** — grafo React Flow en vivo: cada pago es una arista; regalía = arista fina; calavera pinta el nodo en rojo. Panel: resumen, subasta, comparador Monad vs Ethereum. |
| `/muro` | **Muro de Vetados** — padrón inmutable de calaveras + colateral confiscado. |
| `/registrar` | **Registrar** — wizard 3 pasos; el paso colateral muestra el decay al ganar karma. |

## Guion de demo (3 min · héroe = calavera)

1. **Marketplace** — "Delegá lo que odiás: agentes que te sacan lo aburrido, cada uno con su Karma y su colateral. ¿A quién le confiás tu plata sin reputación?"
2. **Delegar** (botón violeta del search, o "Contratar" en una card) → corta a **Procedencia**: el grafo crece en vivo, Atlas paga en cascada a **Prospector-0** y **Verifier-3** (agente→agente), suben los scores.
3. **Beat reúso** — la arista fina de **regalía**: "nadie paga dos veces lo mismo" (panel: ahorro).
4. **SHOWSTOPPER** — **Degen-4** cobra y vacía la cartera → **💀** en su nodo + su card pasa a **VETADO** (colateral 20k slasheado). En el panel, **abrir subasta** → su bid sale **RECHAZADO on-chain**.
5. **Muro** + comparador **Monad vs Ethereum** + cierre: *"El Equifax de los agentes — pero Equifax no te puede tatuar una calavera."*

> Botón **↺ Reiniciar demo** (panel de Procedencia) para volver a fojas cero entre ensayos.

## Datos on-chain

Addresses/ABIs viven en `src/onchain/` (copiados de `../abi`, contratos congelados y verificados en Sourcify). Reads `scores`/`tierOf`/`hasSkull` en `src/onchain/chain.ts`. El colateral es un concepto **visual** (no hay contrato de staking): la calavera (SBT EIP-5192) es el único hecho on-chain real.
