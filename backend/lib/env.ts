/**
 * Carga + valores por defecto de las variables de entorno. CONGELADO tras Sesión 0.
 * Las addresses por defecto están verificadas en frame/monad_tech.md.
 * Las claves sensibles NO tienen default (vacías hasta que se setean en .env).
 */
import 'dotenv/config';

function opt(name: string, def = ''): string {
  return process.env[name] ?? def;
}

export const env = {
  CHAIN_ID: Number(opt('CHAIN_ID', '10143')),
  RPC_HTTP: opt('RPC_HTTP', 'https://testnet-rpc.monad.xyz'),
  RPC_WS: opt('RPC_WS', ''), // wss del testnet — verificar en docs.monad.xyz
  X402_FACILITATOR: opt('X402_FACILITATOR', 'https://x402-facilitator.molandak.org'),
  USDC: opt('USDC', '0x534b2f3A21130d7a60830c2Df862319e593943A3'),
  ERC8004_IDENTITY: opt('ERC8004_IDENTITY', '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'),
  ERC8004_REPUTATION: opt('ERC8004_REPUTATION', '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63'),
  SCORE_REGISTRY: opt('SCORE_REGISTRY', ''), // lo llena la Sesión A al deployar
  REPUTATION_SBT: opt('REPUTATION_SBT', ''), // idem
  DEPLOYER_PRIVATE_KEY: opt('DEPLOYER_PRIVATE_KEY', ''),
  ORACLE_PRIVATE_KEY: opt('ORACLE_PRIVATE_KEY', ''),
  GOOD_THRESHOLD: Number(opt('GOOD_THRESHOLD', '70')),
  DEMO_SAFE: opt('DEMO_SAFE', 'true') === 'true',
} as const;

/** Lanza si falta una variable requerida. Usalo en los puntos que SÍ necesitan la var (ej. C necesita ORACLE_PRIVATE_KEY). */
export function requireEnv(name: keyof typeof env): string {
  const v = env[name];
  if (v === '' || v === undefined || v === null) {
    throw new Error(`Falta la variable de entorno ${String(name)} (ver .env.example)`);
  }
  return String(v);
}
