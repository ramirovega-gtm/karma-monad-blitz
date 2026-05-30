/**
 * Capa on-chain del front: chain Monad testnet, clientes viem (HTTP + WS), reads por nodo.
 * Addresses/ABIs vienen de los artefactos copiados de ../abi (contratos congelados y verificados).
 */
import {
  createPublicClient,
  defineChain,
  http,
  webSocket,
  type Abi,
  type Hex,
  type PublicClient,
} from "viem";
import deployments from "./deployments.json";
import scoreRegistryJson from "./abi/ScoreRegistry.json";
import reputationSbtJson from "./abi/ReputationSBT.json";
import reverseAuctionJson from "./abi/ReverseAuction.json";

export const scoreRegistryAbi = scoreRegistryJson as Abi;
export const reputationSbtAbi = reputationSbtJson as Abi;
export const reverseAuctionAbi = reverseAuctionJson as Abi;

export const ADDR = {
  scoreRegistry: deployments.scoreRegistry as Hex,
  reputationSBT: deployments.reputationSBT as Hex,
  reverseAuction: deployments.reverseAuction as Hex,
  explorer: deployments.explorer,
  chainId: deployments.chainId,
  goodThreshold: deployments.goodThreshold,
};

const RPC_HTTP =
  process.env.NEXT_PUBLIC_RPC_HTTP || "https://testnet-rpc.monad.xyz";
const RPC_WS = process.env.NEXT_PUBLIC_RPC_WS || "wss://testnet-rpc.monad.xyz";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_HTTP], webSocket: [RPC_WS] },
  },
  blockExplorers: {
    default: { name: "MonadExplorer", url: "https://testnet.monadexplorer.com" },
  },
});

export const publicClient: PublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(RPC_HTTP),
});

/** 1 sola conexión WebSocket (rate limits del RPC público). */
let _ws: PublicClient | null = null;
export function wsClient(): PublicClient {
  if (!_ws) {
    _ws = createPublicClient({
      chain: monadTestnet,
      transport: webSocket(RPC_WS),
    });
  }
  return _ws;
}

export const explorerTx = (h: string) => `${ADDR.explorer}/tx/${h}`;
export const explorerAddr = (a: string) => `${ADDR.explorer}/address/${a}`;

// ── Reads por nodo (para los 3 agentes reales: 1 scraper, 2 analyst, 3 designer) ──

export type OnchainScore = { value: bigint; updatedAt: bigint; jobs: bigint };

export async function readScore(agentId: bigint): Promise<OnchainScore> {
  const r = (await publicClient.readContract({
    address: ADDR.scoreRegistry,
    abi: scoreRegistryAbi,
    functionName: "scores",
    args: [agentId],
  })) as readonly [bigint, bigint, bigint];
  return { value: r[0], updatedAt: r[1], jobs: r[2] };
}

export async function readHasSkull(agentId: bigint): Promise<boolean> {
  return (await publicClient.readContract({
    address: ADDR.reputationSBT,
    abi: reputationSbtAbi,
    functionName: "hasSkull",
    args: [agentId],
  })) as boolean;
}

export async function readTier(agentId: bigint): Promise<number> {
  return Number(
    await publicClient.readContract({
      address: ADDR.reputationSBT,
      abi: reputationSbtAbi,
      functionName: "tierOf",
      args: [agentId],
    }),
  );
}
