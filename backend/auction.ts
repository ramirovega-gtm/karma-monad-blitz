/**
 * auction.ts — Stretch S1. Demo en vivo de la subasta inversa ponderada por reputación.
 * Corré: npm run auction
 *
 * Beat: dos proveedores pujan; el bid se pondera por su score on-chain (peor reputación = más caro);
 * un agente con SBT calavera intenta pujar y su bid REVIERTE on-chain (exclusión real). Cierra → gana
 * el menor bid efectivo. Lee ScoreRegistry + ReputationSBT ya desplegados; escribe en ReverseAuction.
 */
import { keccak256, toHex } from 'viem';
import { publicClient, walletClient } from './lib/chain';
import { requireEnv } from './lib/env';
import type { Hex } from './lib/types';
import auctionAbi from '../abi/ReverseAuction.json';
import deployments from '../abi/deployments.json';

const AUCTION = deployments.reverseAuction as Hex;
const GAS = 300_000n;
const usdc = (u: bigint) => `$${(Number(u) / 1e6).toFixed(2)}`;

async function main() {
  const pk = requireEnv('DEPLOYER_PRIVATE_KEY') as Hex;
  const wc = walletClient(pk);
  const jobId = keccak256(toHex(`auction#${Date.now()}`));
  const budget = 500_000_000n; // 500 USDC tope

  async function send(fn: string, args: unknown[]) {
    const hash = await wc.writeContract({ address: AUCTION, abi: auctionAbi as any, functionName: fn, args, gas: GAS });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash as Hex;
  }
  async function tryBid(agentId: bigint, price: bigint, label: string) {
    try {
      // simulamos primero: si el agente tiene calavera, revierte ACÁ (sin gastar una TX condenada).
      await publicClient.simulateContract({ address: AUCTION, abi: auctionAbi as any, functionName: 'bid', args: [jobId, agentId, price], account: wc.account });
      const tx = await send('bid', [jobId, agentId, price]);
      console.log(`  ✓ ${label} (agente#${agentId}) pujó ${usdc(price)}  tx=${tx.slice(0, 12)}…`);
    } catch (e) {
      const msg = String(e);
      const excluded = msg.includes('AgentExcluded');
      console.log(`  ${excluded ? '💀' : '✗'} ${label} (agente#${agentId}) ${excluded ? 'RECHAZADO on-chain — tiene calavera, excluido del mercado' : 'bid falló: ' + msg.slice(0, 80)}`);
    }
  }

  console.log(`\n🟣 Karma · subasta inversa ponderada por reputación  (job ${jobId.slice(0, 10)}…, budget ${usdc(budget)})\n`);
  await send('openJob', [jobId, budget]);
  console.log('① Orquestador abre el job. Proveedores pujan (effective = price·(200-score)/100):');
  await tryBid(1n, 100_000_000n, 'Scraper-01 score bajo '); // score 10 → effective ~190
  await tryBid(2n, 100_000_000n, 'Analyst-07 GoodPayer  '); // score 80 → effective ~120 (gana)
  console.log('\n② El moroso intenta entrar:');
  await tryBid(3n, 50_000_000n, 'Designer-03 CALAVERA  '); // skull → revierte

  console.log('\n③ Cierre — gana el menor bid efectivo:');
  const closeTx = await send('close', [jobId]);
  const [job] = await Promise.all([
    publicClient.readContract({ address: AUCTION, abi: auctionAbi as any, functionName: 'jobs', args: [jobId] }) as Promise<any>,
  ]);
  console.log(`  🏆 ganador: agente#${job[5]} a ${usdc(job[4])} (effective ${usdc(job[3])})  tx=${closeTx.slice(0, 12)}…`);
  console.log('\n✅ Subasta S1 OK: bid-weighting por reputación + exclusión on-chain de la calavera.');
}

main().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
