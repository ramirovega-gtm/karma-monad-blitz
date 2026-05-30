// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @dev Lectura mínima del ScoreRegistry desplegado (getter público del mapping `scores`).
interface IScoreReader {
    function scores(uint256 agentId) external view returns (int256 value, uint64 updatedAt, uint64 jobs);
}

/// @dev Lectura mínima del ReputationSBT desplegado.
interface ISkullReader {
    function hasSkull(uint256 agentId) external view returns (bool);
}

/// @title ReverseAuction — subasta inversa ponderada por reputación (stretch S1 de Karma)
/// @notice Los proveedores pujan BAJANDO el precio. El bid se pondera por la reputación on-chain:
///         peor `score` ⇒ bid EFECTIVO más caro. Un agente con SBT calavera NO puede pujar —
///         su bid REVIERTE on-chain (exclusión real). Implementa el bid-weighting-by-reputation
///         que el paper Agent Exchange dejó en teoría. Solo LEE ScoreRegistry + ReputationSBT.
contract ReverseAuction {
    struct Job {
        uint256 budget; // tope del orquestador (en unidades de USDC, 6 dec)
        bool open;
        bool hasBid;
        uint256 bestEffective; // menor bid efectivo hasta ahora
        uint256 bestPrice; // precio nominal del mejor bid
        uint256 winner; // agentId ganador provisorio
    }

    IScoreReader public immutable scoreReg;
    ISkullReader public immutable sbt;
    mapping(bytes32 => Job) public jobs;

    event JobOpened(bytes32 indexed jobId, uint256 budget);
    event BidPlaced(bytes32 indexed jobId, uint256 indexed agentId, uint256 price, uint256 effective);
    event JobClosed(bytes32 indexed jobId, uint256 indexed winner, uint256 price, uint256 effective);

    error JobAlreadyOpen();
    error JobNotOpen();
    error AgentExcluded(); // tiene calavera
    error AboveBudget();
    error NoBids();

    constructor(address scoreReg_, address sbt_) {
        scoreReg = IScoreReader(scoreReg_);
        sbt = ISkullReader(sbt_);
    }

    /// @notice Un orquestador publica una tarea con su presupuesto tope.
    function openJob(bytes32 jobId, uint256 budget) external {
        if (jobs[jobId].open) revert JobAlreadyOpen();
        jobs[jobId] =
            Job({budget: budget, open: true, hasBid: false, bestEffective: 0, bestPrice: 0, winner: 0});
        emit JobOpened(jobId, budget);
    }

    /// @notice Puja del proveedor `agentId` por `price`. Revierte si el agente tiene calavera.
    /// @dev effective = price * (200 - score) / 100, con score clamp a [0,100].
    ///      score 100 ⇒ effective = price ; score 0 ⇒ effective = 2*price (peor reputación, más caro).
    function bid(bytes32 jobId, uint256 agentId, uint256 price) external {
        Job storage jb = jobs[jobId];
        if (!jb.open) revert JobNotOpen();
        if (sbt.hasSkull(agentId)) revert AgentExcluded(); // ← exclusión on-chain (el momento de aplauso)

        (int256 raw,,) = scoreReg.scores(agentId);
        uint256 score = raw <= 0 ? 0 : (raw >= 100 ? 100 : uint256(raw));
        uint256 effective = (price * (200 - score)) / 100;
        if (effective > jb.budget) revert AboveBudget();

        emit BidPlaced(jobId, agentId, price, effective);
        if (!jb.hasBid || effective < jb.bestEffective) {
            jb.hasBid = true;
            jb.bestEffective = effective;
            jb.bestPrice = price;
            jb.winner = agentId;
        }
    }

    /// @notice Cierra la subasta: gana el menor bid efectivo. (El pago x402 al ganador lo dispara el backend.)
    function close(bytes32 jobId) external returns (uint256 winner, uint256 price) {
        Job storage jb = jobs[jobId];
        if (!jb.open) revert JobNotOpen();
        if (!jb.hasBid) revert NoBids();
        jb.open = false;
        emit JobClosed(jobId, jb.winner, jb.bestPrice, jb.bestEffective);
        return (jb.winner, jb.bestPrice);
    }
}
