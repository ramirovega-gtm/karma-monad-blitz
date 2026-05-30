// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReputationSBT} from "../src/ReputationSBT.sol";
import {ScoreRegistry} from "../src/ScoreRegistry.sol";

contract KarmaTest is Test {
    ReputationSBT sbt;
    ScoreRegistry registry;

    uint256 constant SIGNER_PK = 0xA11CE;
    address signer;
    int256 constant GOOD_THRESHOLD = 100;

    uint256 constant AGENT = 1;
    bytes32 constant INPUT_HASH = keccak256("artefacto-A");

    event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer);
    event ScoreUpdated(uint256 indexed agentId, int256 value);
    event Locked(uint256 tokenId);

    function setUp() public {
        signer = vm.addr(SIGNER_PK);
        sbt = new ReputationSBT();
        registry = new ScoreRegistry(signer, address(sbt), GOOD_THRESHOLD);
        sbt.setScoreRegistry(address(registry));
    }

    /// @dev firma un score con el mismo digest que computa el contrato.
    function _sign(uint256 agentId, int256 value, uint256 nonce) internal view returns (bytes memory) {
        bytes32 digest = keccak256(abi.encodePacked(agentId, value, nonce, address(registry), block.chainid));
        bytes32 ethHash = MessageHashUtils.toEthSignedMessageHash(digest);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(SIGNER_PK, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // ───────────────────────── recordPayment / lookup ─────────────────────────

    function test_RecordPayment_EmitsAndCaches() public {
        vm.expectEmit(true, true, true, true);
        emit PaymentRecorded(AGENT, 1000, INPUT_HASH, address(this));
        registry.recordPayment(AGENT, 1000, INPUT_HASH);

        (address producer, string memory uri, uint64 validUntil, uint16 royaltyBps) = registry.lookup(INPUT_HASH);
        assertEq(producer, address(this), "producer cacheado");
        assertEq(uri, "");
        assertEq(validUntil, 0);
        assertEq(royaltyBps, registry.DEFAULT_ROYALTY_BPS());

        (,, uint64 jobs) = registry.scores(AGENT);
        assertEq(jobs, 1, "jobs incrementa");
    }

    function test_RecordPayment_DoesNotOverwriteCache() public {
        registry.recordPayment(AGENT, 1000, INPUT_HASH);
        address other = address(0xBEEF);
        vm.prank(other);
        registry.recordPayment(2, 2000, INPUT_HASH); // mismo inputHash, otro payer

        (address producer,,,) = registry.lookup(INPUT_HASH);
        assertEq(producer, address(this), "el primer productor persiste");
    }

    function test_Lookup_EmptyReturnsZero() public view {
        (address producer,, uint64 validUntil, uint16 royaltyBps) = registry.lookup(keccak256("inexistente"));
        assertEq(producer, address(0));
        assertEq(validUntil, 0);
        assertEq(royaltyBps, 0);
    }

    // ───────────────────────── setScore (ECDSA + threshold) ─────────────────────────

    function test_SetScore_ValidMintsGoodPayerOnThreshold() public {
        bytes memory sig = _sign(AGENT, GOOD_THRESHOLD, 1);

        vm.expectEmit(true, false, false, true);
        emit ScoreUpdated(AGENT, GOOD_THRESHOLD);
        registry.setScore(AGENT, GOOD_THRESHOLD, 1, sig);

        (int256 value,,) = registry.scores(AGENT);
        assertEq(value, GOOD_THRESHOLD);
        assertTrue(sbt.hasBadge(AGENT), "GoodPayer minted");
        assertEq(uint8(sbt.tierOf(AGENT)), uint8(ReputationSBT.Tier.GoodPayer));
        assertFalse(sbt.hasSkull(AGENT));
    }

    function test_SetScore_BelowThresholdNoMint() public {
        bytes memory sig = _sign(AGENT, GOOD_THRESHOLD - 1, 1);
        registry.setScore(AGENT, GOOD_THRESHOLD - 1, 1, sig);

        (int256 value,,) = registry.scores(AGENT);
        assertEq(value, GOOD_THRESHOLD - 1);
        assertFalse(sbt.hasBadge(AGENT), "sin badge bajo umbral");
    }

    function test_SetScore_BadSignatureReverts() public {
        // firma un value distinto del que se envía → recover != signer
        bytes memory sig = _sign(AGENT, 50, 1);
        vm.expectRevert(ScoreRegistry.BadSignature.selector);
        registry.setScore(AGENT, 999, 1, sig);
    }

    function test_SetScore_ReplayReverts() public {
        bytes memory sig = _sign(AGENT, GOOD_THRESHOLD, 7);
        registry.setScore(AGENT, GOOD_THRESHOLD, 7, sig);

        vm.expectRevert(ScoreRegistry.NonceUsed.selector);
        registry.setScore(AGENT, GOOD_THRESHOLD, 7, sig);
    }

    // ───────────────────────── markDefault / calavera ─────────────────────────

    function test_MarkDefault_MintsSkull() public {
        registry.markDefault(AGENT);
        assertTrue(sbt.hasSkull(AGENT), "skull minted");
        assertEq(uint8(sbt.tierOf(AGENT)), uint8(ReputationSBT.Tier.Skull));
    }

    function test_MarkDefault_OnlyOwner() public {
        vm.prank(address(0xBEEF));
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, address(0xBEEF)));
        registry.markDefault(AGENT);
    }

    function test_Skull_IsIrrevocable() public {
        // 1) cruza umbral → GoodPayer
        bytes memory sig1 = _sign(AGENT, GOOD_THRESHOLD, 1);
        registry.setScore(AGENT, GOOD_THRESHOLD, 1, sig1);
        assertEq(uint8(sbt.tierOf(AGENT)), uint8(ReputationSBT.Tier.GoodPayer));

        // 2) default → calavera
        registry.markDefault(AGENT);
        assertTrue(sbt.hasSkull(AGENT));

        // 3) un nuevo score alto NO revierte la calavera
        bytes memory sig2 = _sign(AGENT, GOOD_THRESHOLD + 500, 2);
        registry.setScore(AGENT, GOOD_THRESHOLD + 500, 2, sig2);
        assertTrue(sbt.hasSkull(AGENT), "la calavera es irrevocable");
        assertEq(uint8(sbt.tierOf(AGENT)), uint8(ReputationSBT.Tier.Skull));
    }

    // ───────────────────────── soulbound (EIP-5192) ─────────────────────────

    function test_Soulbound_TransferReverts() public {
        registry.markDefault(AGENT); // acuña token para AGENT
        address holder = address(uint160(AGENT));

        vm.prank(holder);
        vm.expectRevert(ReputationSBT.Soulbound.selector);
        sbt.transferFrom(holder, address(0xBEEF), AGENT);
    }

    function test_Locked_IsTrue() public {
        registry.markDefault(AGENT);
        assertTrue(sbt.locked(AGENT));
    }

    function test_SupportsInterface_5192() public view {
        assertTrue(sbt.supportsInterface(0xb45a3c0e), "IERC5192");
        assertTrue(sbt.supportsInterface(0x80ac58cd), "ERC721");
        assertFalse(sbt.supportsInterface(0xffffffff));
    }

    function test_OnlyRegistryCanMint() public {
        vm.expectRevert(ReputationSBT.NotRegistry.selector);
        sbt.mint(AGENT, ReputationSBT.Tier.GoodPayer);
    }

    function test_SetScoreRegistry_OnlyOnce() public {
        vm.expectRevert(ReputationSBT.RegistryAlreadySet.selector);
        sbt.setScoreRegistry(address(0xBEEF));
    }
}
