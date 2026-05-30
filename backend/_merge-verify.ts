/**
 * _merge-verify.ts — Cierre del MERGE. (1) verifica el estado on-chain tras el loop core,
 * (2) genera abi/fixtures.events.json para que el front construya sin esperar al backend.
 * Corré: npx tsx backend/_merge-verify.ts
 */
import { writeFileSync } from 'node:fs';
import { parseAbiItem } from 'viem';
import { publicClient } from './lib/chain';
import * as bridge from './bridge';
import type { Hex } from './lib/types';
import deployments from '../abi/deployments.json';

const reg = deployments.scoreRegistry as Hex;
const sbt = deployments.reputationSBT as Hex;

const PAYMENT_RECORDED = parseAbiItem(
  'event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer)',
);
const SCORE_UPDATED = parseAbiItem('event ScoreUpdated(uint256 indexed agentId, int256 value)');

function j(v: unknown) {
  return JSON.stringify(v, (_k, val) => (typeof val === 'bigint' ? val.toString() : val));
}

async function main() {
  const latest = await publicClient.getBlockNumber();
  const fromBlock = latest > 99n ? latest - 99n : 0n;

  console.log('── Estado on-chain (verificación independiente del MERGE) ──');
  for (const agentId of [1n, 2n, 3n]) {
    let tier = -1;
    let skull = false;
    try {
      tier = await bridge.readTier(sbt, agentId);
      skull = await bridge.readHasSkull(sbt, agentId);
    } catch {
      /* sin SBT minteado para ese agente */
    }
    console.log(`  agente#${agentId}: tier=${tier === -1 ? 'sin SBT' : tier} hasSkull=${skull}`);
  }

  // Paginamos hacia atrás (ventanas de 100, el límite del RPC) hasta juntar muestras de ambos eventos.
  const payments: any[] = [];
  const scores: any[] = [];
  let hi = latest;
  for (let i = 0; i < 80 && (payments.length < 4 || scores.length < 4) && hi > 0n; i++) {
    const lo = hi > 99n ? hi - 99n : 0n;
    const [p, s] = await Promise.all([
      publicClient.getLogs({ address: reg, event: PAYMENT_RECORDED, fromBlock: lo, toBlock: hi }),
      publicClient.getLogs({ address: reg, event: SCORE_UPDATED, fromBlock: lo, toBlock: hi }),
    ]);
    payments.push(...p);
    scores.push(...s);
    hi = lo - 1n;
  }
  console.log(`\n  PaymentRecorded capturados: ${payments.length} · ScoreUpdated: ${scores.length}`);

  const fixtures = {
    note: 'Payloads de ejemplo capturados del loop core en Monad testnet. Shape real de los eventos para el front.',
    chainId: deployments.chainId,
    scoreRegistry: reg,
    reputationSBT: sbt,
    events: {
      PaymentRecorded: payments.slice(0, 4).map((l) => ({
        agentId: l.args.agentId?.toString(),
        amount: l.args.amount?.toString(),
        inputHash: l.args.inputHash,
        payer: l.args.payer,
        txHash: l.transactionHash,
        blockNumber: l.blockNumber?.toString(),
      })),
      ScoreUpdated: scores.slice(0, 4).map((l) => ({
        agentId: l.args.agentId?.toString(),
        value: l.args.value?.toString(),
        txHash: l.transactionHash,
        blockNumber: l.blockNumber?.toString(),
      })),
    },
  };
  writeFileSync('abi/fixtures.events.json', j(fixtures) + '\n');
  console.log('\n✓ abi/fixtures.events.json escrito para el front.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
