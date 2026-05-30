// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ReputationSBT} from "../src/ReputationSBT.sol";
import {ScoreRegistry} from "../src/ScoreRegistry.sol";

/// @notice Despliega la capa de contratos de Karma a Monad testnet (chain 10143).
/// @dev Ciclo: SBT → ScoreRegistry(signer, sbt, threshold) → autorizar registro como minter.
///      Env requeridas: DEPLOYER_PRIVATE_KEY, GOOD_THRESHOLD y (SIGNER_ADDRESS | ORACLE_PRIVATE_KEY).
contract Deploy is Script {
    function run() external returns (ReputationSBT sbt, ScoreRegistry registry) {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        int256 goodThreshold = vm.envInt("GOOD_THRESHOLD");
        address signer = _resolveSigner();

        console2.log("Deployer:", vm.addr(deployerPk));
        console2.log("Oracle signer:", signer);
        console2.log("Good threshold:");
        console2.logInt(goodThreshold);

        vm.startBroadcast(deployerPk);

        sbt = new ReputationSBT();
        registry = new ScoreRegistry(signer, address(sbt), goodThreshold);
        sbt.setScoreRegistry(address(registry));

        vm.stopBroadcast();

        console2.log("ReputationSBT:", address(sbt));
        console2.log("ScoreRegistry:", address(registry));
    }

    /// @dev Prefiere SIGNER_ADDRESS explícita; si no, deriva del ORACLE_PRIVATE_KEY (mismo .env del merge).
    function _resolveSigner() internal view returns (address) {
        try vm.envAddress("SIGNER_ADDRESS") returns (address s) {
            if (s != address(0)) return s;
        } catch {}
        return vm.addr(vm.envUint("ORACLE_PRIVATE_KEY"));
    }
}
