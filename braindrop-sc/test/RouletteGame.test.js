const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RouletteGameFactory", function () {
    let factory;
    let owner;
    let player1;
    let player2;
    let player3;
    let player4;
    let player5;

    const DEFAULT_FEE = 300; // 3%

    beforeEach(async function () {
        [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

        const RouletteGameFactory = await ethers.getContractFactory("RouletteGameFactory");
        factory = await RouletteGameFactory.deploy(owner.address, DEFAULT_FEE);
        await factory.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right platform wallet", async function () {
            expect(await factory.platformWallet()).to.equal(owner.address);
        });

        it("Should set the right default fee", async function () {
            expect(await factory.defaultPlatformFeePercent()).to.equal(DEFAULT_FEE);
        });

        it("Should start with 0 games", async function () {
            expect(await factory.getTotalGames()).to.equal(0);
        });
    });

    describe("Game Creation", function () {
        const roomCode = ethers.encodeBytes32String("TEST01");
        const entryFee = ethers.parseEther("0.01");
        const maxPlayers = 10;

        it("Should create a new game", async function () {
            const tx = await factory.createGame(roomCode, entryFee, maxPlayers, DEFAULT_FEE);
            await tx.wait();

            expect(await factory.getTotalGames()).to.equal(1);
            expect(await factory.getGameByRoomCode(roomCode)).to.not.equal(ethers.ZeroAddress);
        });

        it("Should emit GameCreated event", async function () {
            await expect(factory.createGame(roomCode, entryFee, maxPlayers, DEFAULT_FEE))
                .to.emit(factory, "GameCreated");
        });

        it("Should reject duplicate room codes", async function () {
            await factory.createGame(roomCode, entryFee, maxPlayers, DEFAULT_FEE);

            await expect(factory.createGame(roomCode, entryFee, maxPlayers, DEFAULT_FEE))
                .to.be.revertedWith("Room code already exists");
        });

        it("Should reject invalid max players (< 5)", async function () {
            await expect(factory.createGame(roomCode, entryFee, 2, DEFAULT_FEE))
                .to.be.revertedWith("Max players must be 5-100");
        });

        it("Should reject invalid max players (> 100)", async function () {
            await expect(factory.createGame(roomCode, entryFee, 101, DEFAULT_FEE))
                .to.be.revertedWith("Max players must be 5-100");
        });

        it("Should allow free games (entry fee = 0)", async function () {
            await expect(factory.createGame(roomCode, 0, maxPlayers, DEFAULT_FEE)).to.not.be.reverted;
        });
    });
});

describe("RouletteGame", function () {
    let factory;
    let game;
    let owner;
    let player1;
    let player2;
    let player3;
    let player4;
    let player5;

    const roomCode = ethers.encodeBytes32String("GAME01");
    const entryFee = ethers.parseEther("0.01");
    const maxPlayers = 10;
    const platformFee = 300; // 3%

    beforeEach(async function () {
        [owner, player1, player2, player3, player4, player5] = await ethers.getSigners();

        const RouletteGameFactory = await ethers.getContractFactory("RouletteGameFactory");
        factory = await RouletteGameFactory.deploy(owner.address, platformFee);
        await factory.waitForDeployment();

        const tx = await factory.createGame(roomCode, entryFee, maxPlayers, platformFee);
        await tx.wait();

        const gameAddress = await factory.getGameByRoomCode(roomCode);
        game = await ethers.getContractAt("RouletteGame", gameAddress);
    });

    describe("Player Entry", function () {
        it("Should allow players to enter with correct fee", async function () {
            await game.connect(player1).enter("Player1", { value: entryFee });

            expect(await game.getPlayerCount()).to.equal(1);
            expect(await game.hasEntered(player1.address)).to.be.true;
        });

        it("Should reject entry with wrong fee", async function () {
            await expect(game.connect(player1).enter("Player1", { value: ethers.parseEther("0.005") }))
                .to.be.revertedWith("Incorrect entry fee");
        });

        it("Should reject duplicate entry", async function () {
            await game.connect(player1).enter("Player1", { value: entryFee });

            await expect(game.connect(player1).enter("Player1Again", { value: entryFee }))
                .to.be.revertedWith("Already entered");
        });

        it("Should track prize pool correctly", async function () {
            await game.connect(player1).enter("Player1", { value: entryFee });
            await game.connect(player2).enter("Player2", { value: entryFee });

            expect(await game.getPrizePool()).to.equal(entryFee * 2n);
        });
    });

    describe("Game Flow", function () {
        const seed = 12345n;
        let seedHash;

        beforeEach(async function () {
            seedHash = ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [seed]));

            // Add 5 players minimum
            await game.connect(player1).enter("Player1", { value: entryFee });
            await game.connect(player2).enter("Player2", { value: entryFee });
            await game.connect(player3).enter("Player3", { value: entryFee });
            await game.connect(player4).enter("Player4", { value: entryFee });
            await game.connect(player5).enter("Player5", { value: entryFee });
        });

        it("Should allow host to commit seed", async function () {
            await expect(game.connect(owner).commitSeed(seedHash)).to.not.be.reverted;
            expect(await game.state()).to.equal(1); // LOCKED
        });

        it("Should reject non-host from committing seed", async function () {
            await expect(game.connect(player1).commitSeed(seedHash))
                .to.be.revertedWith("Only host");
        });

        it("Should reveal seed and distribute prizes", async function () {
            await game.connect(owner).commitSeed(seedHash);

            const prizePoolBefore = await game.getPrizePool();

            await expect(game.connect(owner).revealAndDistribute(seed))
                .to.emit(game, "GameCompleted");

            expect(await game.state()).to.equal(2); // COMPLETED
            expect(await game.winner()).to.not.equal(ethers.ZeroAddress);
        });

        it("Should reject invalid seed reveal", async function () {
            await game.connect(owner).commitSeed(seedHash);

            await expect(game.connect(owner).revealAndDistribute(99999n))
                .to.be.revertedWith("Invalid seed");
        });
    });

    describe("Game Cancellation", function () {
        beforeEach(async function () {
            await game.connect(player1).enter("Player1", { value: entryFee });
            await game.connect(player2).enter("Player2", { value: entryFee });
        });

        it("Should allow host to cancel and refund", async function () {
            const player1BalanceBefore = await ethers.provider.getBalance(player1.address);

            await expect(game.connect(owner).cancel())
                .to.emit(game, "GameCancelled");

            const player1BalanceAfter = await ethers.provider.getBalance(player1.address);
            expect(player1BalanceAfter).to.be.gt(player1BalanceBefore);
        });
    });
});
