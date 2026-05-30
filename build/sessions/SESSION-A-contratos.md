# Sesión A — Contratos (Foundry)

> **Pegá este archivo como primer mensaje de una sesión Claude nueva.** Autocontenido.
> **Branch:** `session/a-contratos` (parte de `main` **después** de mergeada la Sesión 0).
> **Corre en paralelo con B y C — no dependés de ellos.**

## Rol y misión

Sos el dueño de los **contratos** de Karma (anillo 1) en Monad testnet (chain `10143`, RPC `https://testnet-rpc.monad.xyz`). Stack: **Foundry + Solidity + OpenZeppelin v5**, verificación **Sourcify** (NO Etherscan: `etherscan.enabled = false`). Implementás 2 contratos, los testeás, los deployás y **publicás addresses + ABIs reales** para que C y el front se enganchen.

## FILES I OWN
```
contracts/**          (src/, test/, script/, foundry.toml)
abi/deployments.json  (solo ESCRIBIR addresses al final)
abi/ScoreRegistry.json, abi/ReputationSBT.json  (ABIs reales exportados)
```
## READ-ONLY (no tocar)
`backend/**` completo, `package.json`, `.env.example`. Tu ABI **debe matchear** `abi/ISCoreRegistry.json` y `abi/IReputationSBT.json` (los dejó la Sesión 0) — son tu spec.

---

## Spec de los contratos (implementá exactamente esto)

```solidity
// ScoreRegistry.sol  (~80-110 líneas)
struct Score    { int256 value; uint64 updatedAt; uint64 jobs; }
struct Artifact { address producer; string uri; uint64 validUntil; uint16 royaltyBps; }
mapping(uint256 => Score)    public scores;     // agentId
mapping(bytes32 => Artifact) public artifacts;  // inputHash

event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer);
event ScoreUpdated(uint256 indexed agentId, int256 value);

function recordPayment(uint256 agentId, uint256 amount, bytes32 inputHash) external;
//   ↑ emite PaymentRecorded; si artifacts[inputHash] vacío, lo cachea (producer=msg.sender o param).
function lookup(bytes32 inputHash) external view returns (address, string memory, uint64, uint16);
function setScore(uint256 agentId, int256 value, uint256 nonce, bytes calldata sig) external;
//   ↑ verifica ECDSA contra `signer` (OZ ECDSA + MessageHashUtils), guarda, emite ScoreUpdated,
//     y si value >= GOOD_THRESHOLD llama sbt.mint(agentId, GoodPayer). Anti-replay con nonce.
function markDefault(uint256 agentId) external onlyOwner;   // → sbt.mint(agentId, Skull)

// ReputationSBT.sol  (~80 líneas) — EIP-5192
enum Tier { GoodPayer, Skull }
function mint(uint256 agentId, Tier tier) external;          // solo desde ScoreRegistry (auth)
function locked(uint256) external view returns (bool);       // = true
function tierOf(uint256 agentId) external view returns (Tier);
function hasSkull(uint256 agentId) external view returns (bool);
// fork OZ ERC721 + guard en _update: revert si (from != address(0) && to != address(0))
// supportsInterface incluye 0xb45a3c0e (IERC5192)
```

Constructor: `ScoreRegistry(address signer, address sbt, int256 goodThreshold)`; `ReputationSBT(address scoreRegistry)` o setter con auth. Coordiná el ciclo de despliegue (SBT primero, luego ScoreRegistry, luego autorizar).

## Pasos

1. `forge init` (o template `monad-developers/foundry-monad`) dentro de `contracts/`. `foundry.toml` con `eth-rpc-url`, `chain_id = 10143`, OZ v5 como dep (`forge install OpenZeppelin/openzeppelin-contracts`).
2. Implementá `ReputationSBT.sol` (EIP-5192, guard `_update`, tiers, getters).
3. Implementá `ScoreRegistry.sol` (mappings, eventos, `recordPayment`, `lookup`, `setScore` con ECDSA, `markDefault`).
4. Tests Foundry mínimos: `recordPayment` emite y cachea; `lookup` devuelve; `setScore` válida/rechaza firma + anti-replay; cruce de threshold mintea GoodPayer; `markDefault` mintea Skull; SBT no transferible (transfer revierte); `locked()==true`.
5. `Deploy.s.sol`: deploya SBT → ScoreRegistry → autoriza, a testnet. Faucet `testnet-faucet.monad.xyz` (MON para gas).
6. Verificá en Sourcify. Exportá ABIs (`forge inspect ... abi`) a `abi/ScoreRegistry.json` y `abi/ReputationSBT.json`.
7. Escribí addresses en `abi/deployments.json` (`scoreRegistry`, `reputationSBT`, `deployedAt`).
8. Actualizá la sección **A** del `../CHANGELOG.md`. Commit en `session/a-contratos`.

## Cómo testear aislado
`forge test -vvv` — no necesitás backend ni front. El deploy a testnet es tu integración.

## Definition of Done
- [ ] `forge test` verde (todos los casos de arriba).
- [ ] Contratos deployados a testnet + verificados (Sourcify).
- [ ] ABI real **matchea** `abi/ISCoreRegistry.json` / `IReputationSBT.json` (mismas funciones/eventos/tipos).
- [ ] `abi/deployments.json` con addresses reales; ABIs exportados a `abi/`.
- [ ] CHANGELOG sección A actualizada.

## Qué publicás
`abi/deployments.json` (addresses) + ABIs reales → los consumen C (writes/reads on-chain) y el front (eventos + getters de Tier).

## ⚠️ Notas Monad
- Monad cobra por **gas limit**, no usado → hardcodeá gas limit ajustado en el deploy/scripts si hace falta.
- Verificá addresses ERC-8004 en `docs.monad.xyz/guides/erc-8004` (no las usás para escribir, pero el front las lee).
