/**
 * _test.onchain.ts — Sesión C. Tests OFFLINE (sin contrato deployado).
 * Corré: `npx tsx backend/_test.onchain.ts`
 *
 * Valida lo que NO depende de la cadena:
 *  1. Fórmula del score (casos borde + tope).
 *  2. Esquema de firma del oráculo: que `signScore` recupere al signer correcto con
 *     el MISMO prefijo EIP-191 que usa OZ `MessageHashUtils.toEthSignedMessageHash`.
 *     → Esto es el contrato de integración con la Sesión A (DoD: firma alineada).
 *
 * La integración on-chain (recordPayment→event, setScore→ScoreUpdated, markDefault→Skull)
 * se valida con el contrato real de A vía `OnchainReputationLayer` (en MERGE / anvil fork).
 */
import { recoverMessageAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { Hex } from './lib/types';
import { scoreFromStats, scoreDigest, signScore, oracleAddress, SCORE_CAP } from './oracle';

// Clave de test pública conocida (anvil account #0). NUNCA usar en prod.
const TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as Hex;

let failures = 0;
function check(name: string, cond: boolean, detail = '') {
  console.log(`${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

async function main() {
  console.log('— fórmula score = min(100, jobs*10 + volUSDC/10) —');
  check('0 jobs / 0 vol → 0', scoreFromStats(0, 0n) === 0n);
  check('3 jobs / 0 vol → 30', scoreFromStats(3, 0n) === 30n);
  check('2 jobs / 50 USDC → 25', scoreFromStats(2, 50n) === 25n, String(scoreFromStats(2, 50n)));
  check('7 jobs / 30 USDC → 73 (cruza umbral 70)', scoreFromStats(7, 30n) === 73n);
  check('tope: 50 jobs → 100', scoreFromStats(50, 0n) === SCORE_CAP);
  check('tope: 9 jobs / 1000 USDC → 100', scoreFromStats(9, 1000n) === SCORE_CAP);

  console.log('\n— firma del oráculo (alineación con ECDSA + MessageHashUtils de A) —');
  const signer = oracleAddress(TEST_KEY);
  check('oracleAddress == account.address', signer === privateKeyToAccount(TEST_KEY).address);

  const agentId = 42n;
  const value = 73n;
  const nonce = 1717171717171n;
  // domain separation (alineado con A): address del ScoreRegistry + chainId de prueba.
  const registry = '0x1111111111111111111111111111111111111111' as Hex;
  const chainId = 10143n;
  const sig = await signScore(TEST_KEY, agentId, value, nonce, registry, chainId);
  const recovered = await recoverMessageAddress({
    message: { raw: scoreDigest(agentId, value, nonce, registry, chainId) },
    signature: sig,
  });
  check('firma válida (5 campos) recupera al signer', recovered.toLowerCase() === signer.toLowerCase(), recovered);

  // sanity anti-replay: distinto nonce → distinta firma (digest distinto)
  const sig2 = await signScore(TEST_KEY, agentId, value, nonce + 1n, registry, chainId);
  check('nonce distinto → firma distinta', sig !== sig2);

  // domain separation: misma (agentId,value,nonce) en OTRO contrato → NO recupera al signer original
  const wrongRegistry = '0x2222222222222222222222222222222222222222' as Hex;
  const otherDomain = await recoverMessageAddress({
    message: { raw: scoreDigest(agentId, value, nonce, wrongRegistry, chainId) },
    signature: sig,
  });
  check('otro ScoreRegistry NO recupera al signer (domain separation)', otherDomain.toLowerCase() !== signer.toLowerCase());

  // domain separation: misma firma en OTRA red → NO recupera al signer
  const otherChain = await recoverMessageAddress({
    message: { raw: scoreDigest(agentId, value, nonce, registry, chainId + 1n) },
    signature: sig,
  });
  check('otro chainId NO recupera al signer (domain separation)', otherChain.toLowerCase() !== signer.toLowerCase());

  // sanity: una firma de OTRO valor NO recupera al signer para el digest original
  const wrongRecovered = await recoverMessageAddress({
    message: { raw: scoreDigest(agentId, value + 1n, nonce, registry, chainId) },
    signature: sig,
  });
  check('digest manipulado NO recupera al signer', wrongRecovered.toLowerCase() !== signer.toLowerCase());

  console.log(`\n${failures === 0 ? '✓ TODO OK' : `✗ ${failures} fallo(s)`} — Sesión C offline`);
  if (failures > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
