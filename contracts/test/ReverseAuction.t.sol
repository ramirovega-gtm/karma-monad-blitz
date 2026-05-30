// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {ReverseAuction} from "../src/ReverseAuction.sol";

/// @dev Mock configurable que implementa las lecturas que ReverseAuction necesita.
contract MockReg {
    mapping(uint256 => int256) public score;
    mapping(uint256 => bool) public skull;

    function setScore(uint256 id, int256 v) external {
        score[id] = v;
    }

    function setSkull(uint256 id, bool s) external {
        skull[id] = s;
    }

    // forma del getter público `scores(uint256)` del ScoreRegistry real
    function scores(uint256 id) external view returns (int256, uint64, uint64) {
        return (score[id], 0, 0);
    }

    function hasSkull(uint256 id) external view returns (bool) {
        return skull[id];
    }
}

contract ReverseAuctionTest is Test {
    ReverseAuction auction;
    MockReg reg;

    bytes32 constant JOB = keccak256("job-1");

    function setUp() public {
        reg = new MockReg();
        auction = new ReverseAuction(address(reg), address(reg));
        // agente 1: score 80 (bueno) · agente 2: score 0 (nuevo) · agente 3: calavera
        reg.setScore(1, 80);
        reg.setScore(2, 0);
        reg.setSkull(3, true);
    }

    function test_openJob() public {
        auction.openJob(JOB, 1_000_000);
        (uint256 budget, bool open,,,,) = auction.jobs(JOB);
        assertEq(budget, 1_000_000);
        assertTrue(open);
    }

    function test_weightingByReputation() public {
        auction.openJob(JOB, 1_000_000);
        // agente 1 (score 80): effective = 100000 * (200-80)/100 = 120000
        auction.bid(JOB, 1, 100_000);
        (,,, uint256 best1,, uint256 winner1) = auction.jobs(JOB);
        assertEq(best1, 120_000);
        assertEq(winner1, 1);

        // agente 2 (score 0): mismo precio nominal → effective = 100000 * 2 = 200000 (peor) → NO desplaza
        auction.bid(JOB, 2, 100_000);
        (,,, uint256 best2,, uint256 winner2) = auction.jobs(JOB);
        assertEq(best2, 120_000);
        assertEq(winner2, 1);
    }

    function test_skullBidReverts() public {
        auction.openJob(JOB, 1_000_000);
        vm.expectRevert(ReverseAuction.AgentExcluded.selector);
        auction.bid(JOB, 3, 50_000); // agente con calavera → excluido on-chain
    }

    function test_aboveBudgetReverts() public {
        auction.openJob(JOB, 100_000);
        // agente 2 (score 0): effective = 80000*2 = 160000 > budget 100000
        vm.expectRevert(ReverseAuction.AboveBudget.selector);
        auction.bid(JOB, 2, 80_000);
    }

    function test_closePicksLowestEffective() public {
        auction.openJob(JOB, 1_000_000);
        auction.bid(JOB, 2, 90_000); // effective 180000
        auction.bid(JOB, 1, 90_000); // effective 108000 (gana)
        (uint256 winner, uint256 price) = auction.close(JOB);
        assertEq(winner, 1);
        assertEq(price, 90_000);
        (, bool open,,,,) = auction.jobs(JOB);
        assertFalse(open);
    }

    function test_bidOnClosedReverts() public {
        auction.openJob(JOB, 1_000_000);
        auction.bid(JOB, 1, 100_000);
        auction.close(JOB);
        vm.expectRevert(ReverseAuction.JobNotOpen.selector);
        auction.bid(JOB, 1, 90_000);
    }

    function test_closeNoBidsReverts() public {
        auction.openJob(JOB, 1_000_000);
        vm.expectRevert(ReverseAuction.NoBids.selector);
        auction.close(JOB);
    }
}
