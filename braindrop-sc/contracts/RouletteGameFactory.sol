// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RouletteGame.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RouletteGameFactory
 * @notice Factory contract for creating and managing roulette game instances on Mantle
 * @dev Manages platform fees and serves as registry for all games
 */
contract RouletteGameFactory is Ownable, ReentrancyGuard {
    // ========== STATE VARIABLES ==========
    address public platformWallet;
    uint256 public defaultPlatformFeePercent; // 200 = 2%, 500 = 5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant MIN_FEE_PERCENT = 200; // 2%
    uint256 public constant MAX_FEE_PERCENT = 500; // 5%
    uint256 public constant MIN_PLAYERS = 5;
    uint256 public constant MAX_PLAYERS = 100;
    
    mapping(bytes32 => address) public games; // roomCode => game contract address
    address[] public allGames;
    
    // ========== EVENTS ==========
    event GameCreated(
        bytes32 indexed roomCode, 
        address indexed gameAddress, 
        address indexed host,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 platformFeePercent
    );
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event PlatformWalletUpdated(address oldWallet, address newWallet);
    event PlatformFeesWithdrawn(address indexed to, uint256 amount);
    
    // ========== CONSTRUCTOR ==========
    constructor(address _platformWallet, uint256 _defaultPlatformFeePercent) Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_defaultPlatformFeePercent >= MIN_FEE_PERCENT && _defaultPlatformFeePercent <= MAX_FEE_PERCENT, 
                "Fee must be 2-5%");
        
        platformWallet = _platformWallet;
        defaultPlatformFeePercent = _defaultPlatformFeePercent;
    }
    
    // ========== GAME CREATION ==========
    
    /**
     * @notice Create a new roulette game instance
     * @param roomCode Unique identifier for the game room (bytes32 encoded)
     * @param entryFee Entry fee in wei (can be 0 for free games)
     * @param maxPlayers Maximum number of players (5-100)
     * @param platformFeePercent Platform fee for this game (200-500 = 2-5%)
     * @return gameAddress Address of the newly created game contract
     */
    function createGame(
        bytes32 roomCode,
        uint256 entryFee,
        uint256 maxPlayers,
        uint256 platformFeePercent
    ) external returns (address gameAddress) {
        require(games[roomCode] == address(0), "Room code already exists");
        require(maxPlayers >= MIN_PLAYERS && maxPlayers <= MAX_PLAYERS, "Max players must be 5-100");
        require(platformFeePercent >= MIN_FEE_PERCENT && platformFeePercent <= MAX_FEE_PERCENT, 
                "Platform fee must be 2-5%");
        
        RouletteGame newGame = new RouletteGame(
            msg.sender, // host
            roomCode,
            entryFee,
            maxPlayers,
            platformWallet,
            platformFeePercent
        );
        
        gameAddress = address(newGame);
        games[roomCode] = gameAddress;
        allGames.push(gameAddress);
        
        emit GameCreated(roomCode, gameAddress, msg.sender, entryFee, maxPlayers, platformFeePercent);
        
        return gameAddress;
    }
    
    /**
     * @notice Create a game with default platform fee
     * @param roomCode Unique room identifier
     * @param entryFee Entry fee in wei
     * @param maxPlayers Maximum players (5-100)
     */
    function createGameWithDefaults(
        bytes32 roomCode,
        uint256 entryFee,
        uint256 maxPlayers
    ) external returns (address) {
        require(games[roomCode] == address(0), "Room code already exists");
        require(maxPlayers >= MIN_PLAYERS && maxPlayers <= MAX_PLAYERS, "Max players must be 5-100");
        
        RouletteGame newGame = new RouletteGame(
            msg.sender,
            roomCode,
            entryFee,
            maxPlayers,
            platformWallet,
            defaultPlatformFeePercent
        );
        
        address gameAddress = address(newGame);
        games[roomCode] = gameAddress;
        allGames.push(gameAddress);
        
        emit GameCreated(roomCode, gameAddress, msg.sender, entryFee, maxPlayers, defaultPlatformFeePercent);
        
        return gameAddress;
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    /**
     * @notice Update default platform fee percentage
     * @param newFeePercent New fee (200-500 = 2-5%)
     */
    function updateDefaultPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent >= MIN_FEE_PERCENT && newFeePercent <= MAX_FEE_PERCENT, 
                "Fee must be 2-5%");
        
        uint256 oldFee = defaultPlatformFeePercent;
        defaultPlatformFeePercent = newFeePercent;
        
        emit PlatformFeeUpdated(oldFee, newFeePercent);
    }
    
    /**
     * @notice Update platform wallet address
     * @param newWallet New wallet address
     */
    function updatePlatformWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid address");
        
        address oldWallet = platformWallet;
        platformWallet = newWallet;
        
        emit PlatformWalletUpdated(oldWallet, newWallet);
    }
    
    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = platformWallet.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit PlatformFeesWithdrawn(platformWallet, balance);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @notice Get game address by room code
     */
    function getGameByRoomCode(bytes32 roomCode) external view returns (address) {
        return games[roomCode];
    }
    
    /**
     * @notice Get total number of games created
     */
    function getTotalGames() external view returns (uint256) {
        return allGames.length;
    }
    
    /**
     * @notice Get all game addresses
     */
    function getAllGames() external view returns (address[] memory) {
        return allGames;
    }
    
    /**
     * @notice Check if a room code is available
     */
    function isRoomCodeAvailable(bytes32 roomCode) external view returns (bool) {
        return games[roomCode] == address(0);
    }
    
    /**
     * @notice Get factory configuration
     */
    function getConfig() external view returns (
        address _platformWallet,
        uint256 _defaultFeePercent,
        uint256 _minPlayers,
        uint256 _maxPlayers,
        uint256 _totalGames
    ) {
        return (
            platformWallet,
            defaultPlatformFeePercent,
            MIN_PLAYERS,
            MAX_PLAYERS,
            allGames.length
        );
    }
    
    /**
     * @notice Receive function for platform fees from games
     */
    receive() external payable {}
}
