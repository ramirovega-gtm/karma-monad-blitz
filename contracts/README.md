# Karma — Contratos (Sesión A)

Capa de contratos de Karma (anillo 1) en **Monad testnet** (chain `10143`). Foundry + Solidity `0.8.28` + OpenZeppelin v5. Verificación vía **Sourcify** (NO Etherscan).

## Contratos

- **`ScoreRegistry.sol`** — el context graph on-chain. `recordPayment` (arista + cache de artefacto), `lookup` (memoria → regalía), `setScore` (score firmado por el oráculo, ECDSA + anti-replay, mintea GoodPayer al cruzar el umbral), `markDefault` (owner → calavera).
- **`ReputationSBT.sol`** — SBT soulbound EIP-5192 e irrevocable. Tiers `GoodPayer` / `Skull`. Un token por agente (`tokenId == agentId`). Toda transferencia revierte (`_update` guard). La **calavera es terminal**: una vez `Skull`, no se degrada.

## Setup (deps no commiteadas — `contracts/lib/` está en .gitignore)

```bash
forge install foundry-rs/forge-std --no-git
forge install OpenZeppelin/openzeppelin-contracts@v5.1.0 --no-git
forge build
forge test -vvv
```

## Esquema de firma del oráculo (lo consume la Sesión C)

`setScore(agentId, value, nonce, sig)` verifica:

```
digest  = keccak256(abi.encodePacked(agentId, value, nonce, address(scoreRegistry), block.chainid))
ethHash = toEthSignedMessageHash(digest)          // EIP-191
signer  == ECDSA.recover(ethHash, sig)
```

En viem (oráculo): firmar con `account.signMessage({ message: { raw: digest } })` donde
`digest = keccak256(encodePacked(['uint256','int256','uint256','address','uint256'], [agentId, value, nonce, scoreRegistry, chainId]))`.
`nonce` no se puede reusar (`nonceUsed[nonce]`).

## Deploy a Monad testnet

Requiere `.env` (en la raíz del repo) con `DEPLOYER_PRIVATE_KEY` (wallet con MON de gas — faucet `testnet-faucet.monad.xyz`), `GOOD_THRESHOLD` y el firmante del oráculo (`SIGNER_ADDRESS` o, en su defecto, `ORACLE_PRIVATE_KEY`).

```bash
# desde contracts/
forge script script/Deploy.s.sol:Deploy \
  --rpc-url https://testnet-rpc.monad.xyz \
  --broadcast \
  --verify --verifier sourcify \
  --verifier-url https://sourcify-api-monad.blockvision.org
```

El ciclo: `ReputationSBT` → `ScoreRegistry(signer, sbt, threshold)` → `sbt.setScoreRegistry(registry)`.
Tras deployar, copiar las addresses a `abi/deployments.json` y exportar ABIs:

```bash
forge inspect src/ScoreRegistry.sol:ScoreRegistry abi --json > ../abi/ScoreRegistry.json
forge inspect src/ReputationSBT.sol:ReputationSBT abi --json > ../abi/ReputationSBT.json
```

> Monad cobra por **gas limit** (no usado). Si hace falta, ajustá con `--gas-estimate-multiplier`.
