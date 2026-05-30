/**
 * Smoke test de los cimientos (Sesión 0). Corré: `npm run smoke`.
 * Verifica que la interfaz + el mock funcionan (lookup vacío → pago → cache → score → calavera).
 */
import { MockReputationLayer } from './reputation';
import type { Hex } from './types';

async function main() {
  const rep = new MockReputationLayer();
  const inputHash = ('0x' + '11'.repeat(32)) as Hex;

  console.log('lookup (vacío):', await rep.lookupArtifact(inputHash));
  await rep.recordPayment({ agentId: 1n, amount: 1_000_000n, inputHash });
  console.log('lookup (tras pago):', await rep.lookupArtifact(inputHash));
  await rep.postScore(1n);
  await rep.markDefault(2n);

  console.log('\n✓ smoke ok — cimientos listos para A/B/C');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
