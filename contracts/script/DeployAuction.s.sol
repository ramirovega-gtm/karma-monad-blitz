// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console2} from "forge-std/Script.sol";
import {ReverseAuction} from "../src/ReverseAuction.sol";

/// @notice Despliega ReverseAuction (stretch S1) leyendo los contratos ya desplegados de A.
/// @dev Env requeridas: DEPLOYER_PRIVATE_KEY, SCORE_REGISTRY, REPUTATION_SBT.
contract DeployAuction is Script {
    function run() external returns (ReverseAuction auction) {
        uint256 deployerPk = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address scoreReg = vm.envAddress("SCORE_REGISTRY");
        address sbt = vm.envAddress("REPUTATION_SBT");

        console2.log("Deployer:", vm.addr(deployerPk));
        console2.log("ScoreRegistry:", scoreReg);
        console2.log("ReputationSBT:", sbt);

        vm.startBroadcast(deployerPk);
        auction = new ReverseAuction(scoreReg, sbt);
        vm.stopBroadcast();

        console2.log("ReverseAuction:", address(auction));
    }
}
