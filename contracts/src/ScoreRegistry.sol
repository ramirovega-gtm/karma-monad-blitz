// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {ReputationSBT} from "./ReputationSBT.sol";

/// @title ScoreRegistry — el context graph on-chain de Karma (anillo 1)
/// @notice Cada pago vía x402 escribe una arista (`PaymentRecorded`) y cachea el artefacto
///         (memoria → regalía al reúso). El oráculo off-chain firma scores (ECDSA) que se
///         postean acá; al cruzar el umbral se acuña GoodPayer, y `markDefault` acuña la calavera.
/// @dev El settle de x402 solo emite el `Transfer` del USDC; el puente a `recordPayment` lo
///      construye el backend en una 2ª TX (con DEMO_SAFE el grafo nunca depende del facilitator).
contract ScoreRegistry is Ownable {
    using ECDSA for bytes32;

    struct Score {
        int256 value;
        uint64 updatedAt;
        uint64 jobs;
    }

    struct Artifact {
        address producer;
        string uri;
        uint64 validUntil;
        uint16 royaltyBps;
    }

    /// @notice score por agente (agentId → Score).
    mapping(uint256 => Score) public scores;
    /// @notice artefacto cacheado por inputHash (memoria del grafo: no pagar dos veces lo mismo).
    mapping(bytes32 => Artifact) public artifacts;
    /// @notice anti-replay para firmas del oráculo.
    mapping(uint256 => bool) public nonceUsed;

    /// @notice firmante autorizado de scores (el oráculo off-chain).
    address public signer;
    /// @notice SBT de reputación; este registro es su único minter.
    ReputationSBT public immutable sbt;
    /// @notice umbral de score que dispara el badge GoodPayer.
    int256 public immutable goodThreshold;

    /// @notice regalía por defecto (basis points) que cachea un artefacto nuevo. 500 = 5%.
    uint16 public constant DEFAULT_ROYALTY_BPS = 500;

    event PaymentRecorded(uint256 indexed agentId, uint256 amount, bytes32 indexed inputHash, address payer);
    event ScoreUpdated(uint256 indexed agentId, int256 value);

    error NonceUsed();
    error BadSignature();
    error ZeroAddress();

    /// @param signer_ oráculo que firma los scores (ECDSA).
    /// @param sbt_ contrato ReputationSBT ya desplegado (este registro debe quedar autorizado en él).
    /// @param goodThreshold_ score mínimo para acuñar GoodPayer.
    constructor(address signer_, address sbt_, int256 goodThreshold_) Ownable(msg.sender) {
        if (signer_ == address(0) || sbt_ == address(0)) revert ZeroAddress();
        signer = signer_;
        sbt = ReputationSBT(sbt_);
        goodThreshold = goodThreshold_;
    }

    /// @notice Registra un pago: emite la arista del grafo y cachea el artefacto si es nuevo.
    /// @dev Cualquiera puede llamar (el backend lo hace tras el settle x402). El productor cacheado
    ///      es `msg.sender`; el reúso posterior se detecta porque `lookup(inputHash).producer != 0`.
    function recordPayment(uint256 agentId, uint256 amount, bytes32 inputHash) external {
        emit PaymentRecorded(agentId, amount, inputHash, msg.sender);
        unchecked {
            scores[agentId].jobs += 1;
        }
        if (artifacts[inputHash].producer == address(0)) {
            artifacts[inputHash] =
                Artifact({producer: msg.sender, uri: "", validUntil: 0, royaltyBps: DEFAULT_ROYALTY_BPS});
        }
    }

    /// @notice Consulta un artefacto cacheado. producer == address(0) ⇒ no hay reúso (se paga full).
    function lookup(bytes32 inputHash) external view returns (address, string memory, uint64, uint16) {
        Artifact storage a = artifacts[inputHash];
        return (a.producer, a.uri, a.validUntil, a.royaltyBps);
    }

    /// @notice Postea un score firmado por el oráculo. Verifica ECDSA + anti-replay (nonce).
    /// @dev Digest = keccak256(agentId, value, nonce, address(this), chainid), firmado EIP-191
    ///      (toEthSignedMessageHash). Si value >= goodThreshold, acuña GoodPayer.
    function setScore(uint256 agentId, int256 value, uint256 nonce, bytes calldata sig) external {
        if (nonceUsed[nonce]) revert NonceUsed();
        bytes32 digest = keccak256(abi.encodePacked(agentId, value, nonce, address(this), block.chainid));
        address recovered = MessageHashUtils.toEthSignedMessageHash(digest).recover(sig);
        if (recovered != signer) revert BadSignature();

        nonceUsed[nonce] = true;
        scores[agentId] = Score({value: value, updatedAt: uint64(block.timestamp), jobs: scores[agentId].jobs});
        emit ScoreUpdated(agentId, value);

        if (value >= goodThreshold) {
            sbt.mint(agentId, ReputationSBT.Tier.GoodPayer);
        }
    }

    /// @notice Marca a un agente en default → acuña la calavera (irrevocable). Solo owner.
    function markDefault(uint256 agentId) external onlyOwner {
        sbt.mint(agentId, ReputationSBT.Tier.Skull);
    }

    /// @notice Rota el firmante del oráculo. Solo owner.
    function setSigner(address signer_) external onlyOwner {
        if (signer_ == address(0)) revert ZeroAddress();
        signer = signer_;
    }
}
