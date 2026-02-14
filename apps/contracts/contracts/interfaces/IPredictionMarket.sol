// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPredictionMarket {
    // ============ Enums ============
    enum Position { None, Up, Down }
    enum RoundStatus { Pending, Open, Locked, Settled, Cancelled }

    // ============ Structs ============
    struct Round {
        uint256 roundId;
        uint256 startTime;
        uint256 lockTime;
        uint256 endTime;
        uint256 startPrice;
        uint256 lockPrice;
        uint256 endPrice;
        uint256 totalUpAmount;
        uint256 totalDownAmount;
        RoundStatus status;
        Position outcome;
    }

    struct Bet {
        uint256 amount;
        Position position;
        bool claimed;
    }

    // ============ Events ============
    event RoundStarted(uint256 indexed roundId, uint256 startTime, uint256 lockTime, uint256 endTime);
    event RoundLocked(uint256 indexed roundId, uint256 lockPrice);
    event RoundSettled(uint256 indexed roundId, uint256 endPrice, Position outcome);
    event RoundCancelled(uint256 indexed roundId);
    event BetPlaced(uint256 indexed roundId, address indexed user, Position position, uint256 amount);
    event Claimed(uint256 indexed roundId, address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);

    // ============ User Functions ============
    function bet(uint256 roundId, Position position) external payable;
    function claim(uint256[] calldata roundIds) external;

    // ============ View Functions ============
    function getRound(uint256 roundId) external view returns (Round memory);
    function getUserBet(uint256 roundId, address user) external view returns (Bet memory);
    function getClaimable(uint256 roundId, address user) external view returns (uint256);
    function getCurrentRound() external view returns (uint256);
}
