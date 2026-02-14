// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IPredictionMarket.sol";

/**
 * @title PredictionMarket
 * @notice Binary prediction market for BTC, ETH, and KOSPI assets
 * @dev Supports 15-minute and daily rounds with pool-based payouts
 */
contract PredictionMarket is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable,
    IPredictionMarket
{
    // ============ Constants ============
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_FEE = 500; // 5%
    uint256 public constant MIN_BET = 0.001 ether;

    // ============ State Variables ============
    uint256 public currentRoundId;
    uint256 public feeRate; // in basis points (e.g., 300 = 3%)
    address public treasury;

    // Round ID => Round data
    mapping(uint256 => Round) public rounds;

    // Round ID => User => Bet
    mapping(uint256 => mapping(address => Bet)) public userBets;

    // Accumulated treasury
    uint256 public accumulatedFees;

    // ============ Modifiers ============
    modifier onlyValidRound(uint256 roundId) {
        require(roundId > 0 && roundId <= currentRoundId, "Invalid round");
        _;
    }

    // ============ Initializer ============
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _treasury,
        uint256 _feeRate
    ) external initializer {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        require(_treasury != address(0), "Invalid treasury");
        require(_feeRate <= MAX_FEE, "Fee too high");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);
        _grantRole(KEEPER_ROLE, _admin);

        treasury = _treasury;
        feeRate = _feeRate;
    }

    // ============ User Functions ============

    /**
     * @notice Place a bet on a round
     * @param roundId The round to bet on
     * @param position Up or Down
     */
    function bet(
        uint256 roundId,
        Position position
    ) external payable override nonReentrant whenNotPaused onlyValidRound(roundId) {
        require(msg.value >= MIN_BET, "Bet too small");
        require(position == Position.Up || position == Position.Down, "Invalid position");

        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.Open, "Round not open");
        require(block.timestamp < round.lockTime, "Betting closed");

        Bet storage userBet = userBets[roundId][msg.sender];
        require(userBet.amount == 0, "Already bet");

        userBet.amount = msg.value;
        userBet.position = position;
        userBet.claimed = false;

        if (position == Position.Up) {
            round.totalUpAmount += msg.value;
        } else {
            round.totalDownAmount += msg.value;
        }

        emit BetPlaced(roundId, msg.sender, position, msg.value);
    }

    /**
     * @notice Claim rewards for multiple rounds
     * @param roundIds Array of round IDs to claim
     */
    function claim(
        uint256[] calldata roundIds
    ) external override nonReentrant whenNotPaused {
        uint256 totalPayout = 0;

        for (uint256 i = 0; i < roundIds.length; i++) {
            uint256 roundId = roundIds[i];
            uint256 payout = _claimRound(roundId, msg.sender);
            totalPayout += payout;
        }

        require(totalPayout > 0, "Nothing to claim");

        (bool success, ) = msg.sender.call{value: totalPayout}("");
        require(success, "Transfer failed");

        emit RewardClaimed(msg.sender, totalPayout);
    }

    // ============ Keeper Functions ============

    /**
     * @notice Start a new round
     * @param duration Round duration in seconds
     * @param lockBuffer Time before end when betting closes
     */
    function startRound(
        uint256 duration,
        uint256 lockBuffer
    ) external onlyRole(KEEPER_ROLE) whenNotPaused {
        currentRoundId++;

        uint256 startTime = block.timestamp;
        uint256 lockTime = startTime + duration - lockBuffer;
        uint256 endTime = startTime + duration;

        rounds[currentRoundId] = Round({
            roundId: currentRoundId,
            startTime: startTime,
            lockTime: lockTime,
            endTime: endTime,
            startPrice: 0,
            lockPrice: 0,
            endPrice: 0,
            totalUpAmount: 0,
            totalDownAmount: 0,
            status: RoundStatus.Open,
            outcome: Position.None
        });

        emit RoundStarted(currentRoundId, startTime, lockTime, endTime);
    }

    /**
     * @notice Lock betting for a round and set lock price
     * @param roundId Round to lock
     * @param lockPrice Price at lock time
     */
    function lockRound(
        uint256 roundId,
        uint256 lockPrice
    ) external onlyRole(KEEPER_ROLE) onlyValidRound(roundId) {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.Open, "Not open");
        require(block.timestamp >= round.lockTime, "Too early");

        round.lockPrice = lockPrice;
        round.status = RoundStatus.Locked;

        emit RoundLocked(roundId, lockPrice);
    }

    /**
     * @notice Settle a round with end price
     * @param roundId Round to settle
     * @param endPrice Price at settlement time
     */
    function settleRound(
        uint256 roundId,
        uint256 endPrice
    ) external onlyRole(KEEPER_ROLE) onlyValidRound(roundId) {
        Round storage round = rounds[roundId];
        require(round.status == RoundStatus.Locked, "Not locked");
        require(block.timestamp >= round.endTime, "Too early");

        round.endPrice = endPrice;

        // Determine outcome
        if (endPrice > round.lockPrice) {
            round.outcome = Position.Up;
        } else if (endPrice < round.lockPrice) {
            round.outcome = Position.Down;
        } else {
            // Draw - treat as cancelled (refund)
            round.status = RoundStatus.Cancelled;
            emit RoundCancelled(roundId);
            return;
        }

        // Calculate and collect fees
        uint256 totalPool = round.totalUpAmount + round.totalDownAmount;
        uint256 fee = (totalPool * feeRate) / BASIS_POINTS;
        accumulatedFees += fee;

        round.status = RoundStatus.Settled;

        emit RoundSettled(roundId, endPrice, round.outcome);
    }

    /**
     * @notice Cancel a round (refund all bets)
     * @param roundId Round to cancel
     */
    function cancelRound(
        uint256 roundId
    ) external onlyRole(OPERATOR_ROLE) onlyValidRound(roundId) {
        Round storage round = rounds[roundId];
        require(
            round.status == RoundStatus.Open || round.status == RoundStatus.Locked,
            "Cannot cancel"
        );

        round.status = RoundStatus.Cancelled;

        emit RoundCancelled(roundId);
    }

    // ============ Admin Functions ============

    function setFeeRate(uint256 _feeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeRate <= MAX_FEE, "Fee too high");
        feeRate = _feeRate;
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;

        (bool success, ) = treasury.call{value: amount}("");
        require(success, "Transfer failed");
    }

    function pause() external onlyRole(OPERATOR_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(OPERATOR_ROLE) {
        _unpause();
    }

    // ============ View Functions ============

    function getRound(uint256 roundId) external view override returns (Round memory) {
        return rounds[roundId];
    }

    function getUserBet(
        uint256 roundId,
        address user
    ) external view override returns (Bet memory) {
        return userBets[roundId][user];
    }

    function getClaimable(
        uint256 roundId,
        address user
    ) external view override returns (uint256) {
        return _calculatePayout(roundId, user);
    }

    function getCurrentRound() external view override returns (uint256) {
        return currentRoundId;
    }

    // ============ Internal Functions ============

    function _claimRound(uint256 roundId, address user) internal returns (uint256) {
        Round storage round = rounds[roundId];
        Bet storage userBet = userBets[roundId][user];

        if (userBet.amount == 0 || userBet.claimed) {
            return 0;
        }

        uint256 payout = _calculatePayout(roundId, user);

        if (payout > 0) {
            userBet.claimed = true;
            emit Claimed(roundId, user, payout);
        }

        return payout;
    }

    function _calculatePayout(uint256 roundId, address user) internal view returns (uint256) {
        Round storage round = rounds[roundId];
        Bet storage userBet = userBets[roundId][user];

        if (userBet.amount == 0 || userBet.claimed) {
            return 0;
        }

        // Cancelled round - full refund
        if (round.status == RoundStatus.Cancelled) {
            return userBet.amount;
        }

        // Not settled yet
        if (round.status != RoundStatus.Settled) {
            return 0;
        }

        // Lost
        if (userBet.position != round.outcome) {
            return 0;
        }

        // Won - calculate payout
        uint256 totalPool = round.totalUpAmount + round.totalDownAmount;
        uint256 fee = (totalPool * feeRate) / BASIS_POINTS;
        uint256 rewardPool = totalPool - fee;

        uint256 winnerPool = round.outcome == Position.Up
            ? round.totalUpAmount
            : round.totalDownAmount;

        if (winnerPool == 0) {
            return userBet.amount; // Edge case: return original bet
        }

        return (userBet.amount * rewardPool) / winnerPool;
    }

    // ============ UUPS ============

    function _authorizeUpgrade(
        address newImplementation
    ) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // ============ Receive ============

    receive() external payable {}
}
