// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ReputationSBT — el SBT de reputación de Karma (anillo 1)
/// @notice Soulbound (EIP-5192) e irrevocable. Un token por agente (tokenId == agentId).
///         `GoodPayer` se acuña al cruzar el umbral de score; `Skull` (la calavera) al
///         caer en default. La calavera es el héroe del demo: excluye al agente del mercado.
/// @dev Fork mínimo de ERC721 con guard en `_update` para bloquear toda transferencia.
contract ReputationSBT is ERC721, Ownable {
    enum Tier {
        GoodPayer,
        Skull
    }

    /// @dev EIP-5192: emitido al acuñar (el token nace bloqueado y nunca se desbloquea).
    event Locked(uint256 tokenId);

    /// @notice Tier actual de cada agente (solo significativo si el token existe).
    mapping(uint256 => Tier) public tierOf;

    /// @notice Único contrato autorizado a acuñar (ScoreRegistry). Se fija una sola vez.
    address public scoreRegistry;

    error Soulbound();
    error NotRegistry();
    error RegistryAlreadySet();
    error ZeroAddress();

    modifier onlyRegistry() {
        if (msg.sender != scoreRegistry) revert NotRegistry();
        _;
    }

    constructor() ERC721("Karma Reputation", "KARMA") Ownable(msg.sender) {}

    /// @notice Autoriza al ScoreRegistry como único minter. Inmutable tras fijarse.
    function setScoreRegistry(address registry) external onlyOwner {
        if (registry == address(0)) revert ZeroAddress();
        if (scoreRegistry != address(0)) revert RegistryAlreadySet();
        scoreRegistry = registry;
    }

    /// @notice Acuña/actualiza el SBT de un agente. Solo desde ScoreRegistry.
    /// @dev Primera vez: acuña token (tokenId == agentId) al holder determinístico del agente.
    ///      Reacuñaciones (p.ej. GoodPayer → Skull) solo actualizan el tier; el token persiste.
    function mint(uint256 agentId, Tier tier) external onlyRegistry {
        if (_ownerOf(agentId) == address(0)) {
            _mint(address(uint160(agentId)), agentId);
            emit Locked(agentId);
            tierOf[agentId] = tier;
            return;
        }
        // El token ya existe: la calavera es terminal e irrevocable.
        // GoodPayer → Skull se permite; cualquier intento de degradar Skull se ignora.
        if (tierOf[agentId] == Tier.Skull) return;
        tierOf[agentId] = tier;
    }

    /// @notice ¿El agente carga la calavera? (excluido del mercado on-chain).
    function hasSkull(uint256 agentId) external view returns (bool) {
        return _ownerOf(agentId) != address(0) && tierOf[agentId] == Tier.Skull;
    }

    /// @notice ¿El agente tiene algún badge acuñado?
    function hasBadge(uint256 agentId) external view returns (bool) {
        return _ownerOf(agentId) != address(0);
    }

    /// @notice EIP-5192: todo token de Karma está bloqueado de por vida.
    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    /// @inheritdoc ERC721
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        // 0xb45a3c0e = IERC5192
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    /// @dev Guard soulbound: permite mint (from==0) y burn (to==0), revierte toda transferencia.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
