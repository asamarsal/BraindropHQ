// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RouletteGame
 * @notice Individual roulette game instance with prize pool and automatic distribution
 * @dev Created by RouletteGameFactory for each game session
 */
contract RouletteGame is ReentrancyGuard {
    // ========== STATE VARIABLES ==========
    address public immutable host;
    address public immutable factory;
    bytes32 public immutable roomCode;
    
    uint256 public immutable entryFee;
    uint256 public immutable maxPlayers;
    uint256 public platformFeePercent; // 200 = 2%, 500 = 5%
    address public platformWallet;
    
    address[] public players;
    mapping(address => bool) public hasEntered;
    mapping(address => string) public playerNames;
    
    bytes32 public seedCommitment;
    uint256 public revealedSeed;
    
    enum GameState { OPEN, LOCKED, COMPLETED, CANCELLED }
    GameState public state;
    
    address public winner;
    uint256 public winnerPrize;
    
    // ========== EVENTS ==========
    event PlayerEntered(address indexed player, string name, uint256 totalPlayers, uint256 prizePool);
    event SeedCommitted(bytes32 seedHash, uint256 totalPlayers);
    event GameCompleted(address indexed winner, string winnerName, uint256 winnerPrize, uint256 platformFee, uint256 seed);
    event GameCancelled(uint256 refundCount);
    event PlayerRefunded(address indexed player, uint256 amount);
    
    // ========== MODIFIERS ==========
    modifier onlyHost() {
        require(msg.sender == host, "Only host");
        _;
    }
    
    modifier inState(GameState _state) {
        require(state == _state, "Invalid state");
        _;
    }
    
    // ========== CONSTRUCTOR ==========
    constructor(
        address _host,
        bytes32 _roomCode,
        uint256 _entryFee,
        uint256 _maxPlayers,
        address _platformWallet,
        uint256 _platformFeePercent
    ) {
        require(_host != address(0), "Invalid host");
        require(_maxPlayers >= 5 && _maxPlayers <= 100, "Max players must be 5-100");
        require(_platformFeePercent >= 200 && _platformFeePercent <= 500, "Platform fee must be 2-5%");
        
        host = _host;
        factory = msg.sender;
        roomCode = _roomCode;
        entryFee = _entryFee; // Can be 0 for free games
        maxPlayers = _maxPlayers;
        platformWallet = _platformWallet;
        platformFeePercent = _platformFeePercent;
        state = GameState.OPEN;
    }
    
    // ========== CORE FUNCTIONS ==========
    
    /**
     * @notice Player enters the game with optional entry fee
     * @param name Player's display name
     */
    function enter(string calldata name) 
        external 
        payable 
        nonReentrant
        inState(GameState.OPEN) 
    {
        require(msg.value == entryFee, "Incorrect entry fee");
        require(!hasEntered[msg.sender], "Already entered");
        require(players.length < maxPlayers, "Game full");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "Invalid name length");
        
        players.push(msg.sender);
        hasEntered[msg.sender] = true;
        playerNames[msg.sender] = name;
        
        emit PlayerEntered(msg.sender, name, players.length, getPrizePool());
    }
    
    /**
     * @notice Host commits seed hash before spin
     * @param _seedHash keccak256 hash of the random seed
     */
    function commitSeed(bytes32 _seedHash) 
        external 
        onlyHost 
        inState(GameState.OPEN) 
    {
        require(players.length >= 2, "Need at least 2 players");
        require(_seedHash != bytes32(0), "Invalid seed hash");
        
        seedCommitment = _seedHash;
        state = GameState.LOCKED;
        
        emit SeedCommitted(_seedHash, players.length);
    }
    
    /**
     * @notice Host reveals seed, determines winner, and triggers automatic distribution
     * @param _seed The original seed that was hashed
     */
    function revealAndDistribute(uint256 _seed) 
        external 
        onlyHost 
        nonReentrant
        inState(GameState.LOCKED) 
    {
        // Verify commitment
        require(keccak256(abi.encodePacked(_seed)) == seedCommitment, "Invalid seed");
        
        revealedSeed = _seed;
        
        // Determine winner
        uint256 winnerIndex = _seed % players.length;
        winner = players[winnerIndex];
        
        // Calculate distribution
        uint256 totalPrize = address(this).balance;
        uint256 platformFee = 0;
        
        // Only take platform fee if there's a prize pool (entry fee > 0)
        if (totalPrize > 0) {
            platformFee = (totalPrize * platformFeePercent) / 10000;
            winnerPrize = totalPrize - platformFee;
            
            // Transfer platform fee
            if (platformFee > 0) {
                (bool successPlatform, ) = platformWallet.call{value: platformFee}("");
                require(successPlatform, "Platform transfer failed");
            }
            
            // Transfer winner prize
            if (winnerPrize > 0) {
                (bool successWinner, ) = winner.call{value: winnerPrize}("");
                require(successWinner, "Winner transfer failed");
            }
        }
        
        state = GameState.COMPLETED;
        
        emit GameCompleted(winner, playerNames[winner], winnerPrize, platformFee, _seed);
    }
    
    /**
     * @notice Emergency cancel - refunds all players
     */
    function cancel() 
        external 
        onlyHost 
        nonReentrant
    {
        require(state == GameState.OPEN || state == GameState.LOCKED, "Cannot cancel");
        
        uint256 refundAmount = entryFee;
        uint256 refundCount = 0;
        
        if (refundAmount > 0) {
            for (uint256 i = 0; i < players.length; i++) {
                (bool success, ) = players[i].call{value: refundAmount}("");
                if (success) {
                    emit PlayerRefunded(players[i], refundAmount);
                    refundCount++;
                }
            }
        } else {
            refundCount = players.length;
        }
        
        state = GameState.CANCELLED;
        emit GameCancelled(refundCount);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @notice Get all player addresses
     */
    function getPlayers() external view returns (address[] memory) {
        return players;
    }
    
    /**
     * @notice Get current player count
     */
    function getPlayerCount() external view returns (uint256) {
        return players.length;
    }
    
    /**
     * @notice Get current prize pool
     */
    function getPrizePool() public view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @notice Get player info by address
     */
    function getPlayerInfo(address player) external view returns (
        bool entered,
        string memory name
    ) {
        return (hasEntered[player], playerNames[player]);
    }
    
    /**
     * @notice Get game info
     */
    function getGameInfo() external view returns (
        address _host,
        bytes32 _roomCode,
        uint256 _entryFee,
        uint256 _maxPlayers,
        uint256 _playerCount,
        uint256 _prizePool,
        GameState _state,
        address _winner
    ) {
        return (
            host,
            roomCode,
            entryFee,
            maxPlayers,
            players.length,
            getPrizePool(),
            state,
            winner
        );
    }
    
    /**
     * @notice Receive function to accept MNT
     */
    receive() external payable {}
}
