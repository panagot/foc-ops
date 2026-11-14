// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @title TierRegistry — warm PieceCID → cold archive mapping for foc-ops
/// @notice Minimal FVM/FEVM registry so promotions are auditable on-chain.
///         PieceCID / cold refs are stored as bytes32 digests (hash of CID string).
contract TierRegistry {
    struct Promotion {
        bytes32 coldRefHash;
        bytes32 policyId;
        uint64 promotedAt;
        address operator;
    }

    mapping(bytes32 => Promotion) public promotions;

    event Promoted(
        bytes32 indexed warmPieceCid,
        bytes32 coldRefHash,
        bytes32 policyId,
        address indexed operator,
        uint64 promotedAt
    );

    function recordPromotion(
        bytes32 warmPieceCid,
        bytes32 coldRefHash,
        bytes32 policyId
    ) external {
        require(warmPieceCid != bytes32(0), "warm=0");
        require(coldRefHash != bytes32(0), "cold=0");
        promotions[warmPieceCid] = Promotion({
            coldRefHash: coldRefHash,
            policyId: policyId,
            promotedAt: uint64(block.timestamp),
            operator: msg.sender
        });
        emit Promoted(
            warmPieceCid,
            coldRefHash,
            policyId,
            msg.sender,
            uint64(block.timestamp)
        );
    }

    function getPromotion(
        bytes32 warmPieceCid
    )
        external
        view
        returns (bytes32 coldRefHash, bytes32 policyId, uint64 promotedAt)
    {
        Promotion memory p = promotions[warmPieceCid];
        return (p.coldRefHash, p.policyId, p.promotedAt);
    }
}
