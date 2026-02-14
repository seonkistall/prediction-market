import { expect } from 'chai';
import { ethers, upgrades } from 'hardhat';
import { time } from '@nomicfoundation/hardhat-network-helpers';
import { PredictionMarket } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('PredictionMarket', function () {
  let predictionMarket: PredictionMarket;
  let admin: SignerWithAddress;
  let keeper: SignerWithAddress;
  let treasury: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const FEE_RATE = 300; // 3%
  const ROUND_DURATION = 900; // 15 minutes
  const LOCK_BUFFER = 180; // 3 minutes

  beforeEach(async function () {
    [admin, keeper, treasury, user1, user2] = await ethers.getSigners();

    const PredictionMarket = await ethers.getContractFactory('PredictionMarket');
    predictionMarket = (await upgrades.deployProxy(PredictionMarket, [
      admin.address,
      treasury.address,
      FEE_RATE,
    ])) as unknown as PredictionMarket;

    await predictionMarket.waitForDeployment();

    // Grant keeper role
    const KEEPER_ROLE = await predictionMarket.KEEPER_ROLE();
    await predictionMarket.grantRole(KEEPER_ROLE, keeper.address);
  });

  describe('Initialization', function () {
    it('Should initialize with correct values', async function () {
      expect(await predictionMarket.treasury()).to.equal(treasury.address);
      expect(await predictionMarket.feeRate()).to.equal(FEE_RATE);
      expect(await predictionMarket.currentRoundId()).to.equal(0);
    });
  });

  describe('Round Management', function () {
    it('Should start a new round', async function () {
      await predictionMarket.connect(keeper).startRound(ROUND_DURATION, LOCK_BUFFER);

      expect(await predictionMarket.currentRoundId()).to.equal(1);

      const round = await predictionMarket.getRound(1);
      expect(round.status).to.equal(1); // Open
    });

    it('Should lock a round', async function () {
      await predictionMarket.connect(keeper).startRound(ROUND_DURATION, LOCK_BUFFER);

      // Fast forward to lock time
      await time.increase(ROUND_DURATION - LOCK_BUFFER);

      const lockPrice = ethers.parseUnits('50000', 8);
      await predictionMarket.connect(keeper).lockRound(1, lockPrice);

      const round = await predictionMarket.getRound(1);
      expect(round.status).to.equal(2); // Locked
      expect(round.lockPrice).to.equal(lockPrice);
    });

    it('Should settle a round', async function () {
      await predictionMarket.connect(keeper).startRound(ROUND_DURATION, LOCK_BUFFER);

      // Place bets
      await predictionMarket.connect(user1).bet(1, 1, { value: ethers.parseEther('1') }); // Up
      await predictionMarket.connect(user2).bet(1, 2, { value: ethers.parseEther('1') }); // Down

      // Lock
      await time.increase(ROUND_DURATION - LOCK_BUFFER);
      const lockPrice = ethers.parseUnits('50000', 8);
      await predictionMarket.connect(keeper).lockRound(1, lockPrice);

      // Settle (price went up)
      await time.increase(LOCK_BUFFER);
      const endPrice = ethers.parseUnits('51000', 8);
      await predictionMarket.connect(keeper).settleRound(1, endPrice);

      const round = await predictionMarket.getRound(1);
      expect(round.status).to.equal(3); // Settled
      expect(round.outcome).to.equal(1); // Up
    });
  });

  describe('Betting', function () {
    beforeEach(async function () {
      await predictionMarket.connect(keeper).startRound(ROUND_DURATION, LOCK_BUFFER);
    });

    it('Should allow placing bets', async function () {
      const betAmount = ethers.parseEther('1');
      await predictionMarket.connect(user1).bet(1, 1, { value: betAmount }); // Up

      const userBet = await predictionMarket.getUserBet(1, user1.address);
      expect(userBet.amount).to.equal(betAmount);
      expect(userBet.position).to.equal(1);
    });

    it('Should reject duplicate bets', async function () {
      const betAmount = ethers.parseEther('1');
      await predictionMarket.connect(user1).bet(1, 1, { value: betAmount });

      await expect(
        predictionMarket.connect(user1).bet(1, 2, { value: betAmount })
      ).to.be.revertedWith('Already bet');
    });

    it('Should reject bets after lock time', async function () {
      await time.increase(ROUND_DURATION - LOCK_BUFFER + 1);

      await expect(
        predictionMarket.connect(user1).bet(1, 1, { value: ethers.parseEther('1') })
      ).to.be.revertedWith('Betting closed');
    });
  });

  describe('Claiming', function () {
    beforeEach(async function () {
      await predictionMarket.connect(keeper).startRound(ROUND_DURATION, LOCK_BUFFER);

      // Place bets
      await predictionMarket.connect(user1).bet(1, 1, { value: ethers.parseEther('1') }); // Up
      await predictionMarket.connect(user2).bet(1, 2, { value: ethers.parseEther('1') }); // Down

      // Lock and settle (Up wins)
      await time.increase(ROUND_DURATION - LOCK_BUFFER);
      await predictionMarket.connect(keeper).lockRound(1, ethers.parseUnits('50000', 8));
      await time.increase(LOCK_BUFFER);
      await predictionMarket.connect(keeper).settleRound(1, ethers.parseUnits('51000', 8));
    });

    it('Should allow winners to claim', async function () {
      const claimable = await predictionMarket.getClaimable(1, user1.address);
      expect(claimable).to.be.gt(0);

      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await predictionMarket.connect(user1).claim([1]);
      const balanceAfter = await ethers.provider.getBalance(user1.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it('Should return nothing for losers', async function () {
      const claimable = await predictionMarket.getClaimable(1, user2.address);
      expect(claimable).to.equal(0);
    });

    it('Should calculate correct payout with fees', async function () {
      const totalPool = ethers.parseEther('2'); // 1 ETH from each user
      const expectedFee = (totalPool * BigInt(FEE_RATE)) / BigInt(10000);
      const rewardPool = totalPool - expectedFee;

      const claimable = await predictionMarket.getClaimable(1, user1.address);
      expect(claimable).to.equal(rewardPool); // Winner takes all (minus fees)
    });
  });
});
