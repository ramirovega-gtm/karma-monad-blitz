/**
 * Clientes viem para Monad testnet. CONGELADO tras Sesión 0 — A/B/C importan de acá.
 * - publicClient: lecturas + suscripción a eventos (WS si hay RPC_WS, si no HTTP).
 * - walletClient(pk): escrituras firmadas (lo usa la Sesión C para recordPayment/setScore/markDefault).
 */
import { createPublicClient, createWalletClient, defineChain, http, webSocket } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from './types';
import { env } from './env';

export const monadTestnet = defineChain({
  id: env.CHAIN_ID,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: [env.RPC_HTTP],
      webSocket: env.RPC_WS ? [env.RPC_WS] : [],
    },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: env.RPC_WS ? webSocket(env.RPC_WS) : http(env.RPC_HTTP),
});

export function walletClient(pk: Hex) {
  return createWalletClient({
    account: privateKeyToAccount(pk),
    chain: monadTestnet,
    transport: http(env.RPC_HTTP),
  });
}
