# BrainDrop Smart Contracts

GameFi Roulette smart contracts for **Mantle Blockchain**.

## 🌐 Networks

| Network | Chain ID | RPC | Explorer |
|---------|----------|-----|----------|
| Mantle Sepolia (Testnet) | 5003 | https://rpc.sepolia.mantle.xyz | https://sepolia.mantlescan.xyz |
| Mantle Mainnet | 5000 | https://rpc.mantle.xyz | https://mantlescan.xyz |

## 📦 Setup

```bash
cd braindrop-sc
npm install
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your private key (without 0x prefix):
```
PRIVATE_KEY=your_private_key_here
```

3. Get testnet MNT from faucet: https://faucet.sepolia.mantle.xyz/

## 🔨 Commands

```bash
# Compile contracts
npm run compile

# Run tests
npm run test

# Deploy to local network
npm run deploy:local

# Deploy to Mantle Sepolia Testnet
npm run deploy:testnet
```

## 📄 Contracts

### RouletteGameFactory.sol
Factory contract for creating game instances.

**Features:**
- Create games with custom entry fee (0 or any amount)
- Platform fee: 2-5% configurable
- Max players: 5-100
- Game registry and discovery

### RouletteGame.sol
Individual game logic with automatic prize distribution.

**Features:**
- Automated prize distribution to winner
- Commit-reveal randomness scheme
- Emergency cancel with refunds
- Events for real-time tracking

## 🔐 Security

- ReentrancyGuard on all value transfers
- Commit-reveal for verifiable randomness
- Access control for host functions
- Input validation on all parameters

## 📊 Gas Estimates

| Function | Estimated Gas |
|----------|--------------|
| createGame | ~2,500,000 |
| enter | ~100,000 |
| commitSeed | ~50,000 |
| revealAndDistribute | ~150,000 |
| cancel (10 players) | ~200,000 |

## 📝 License

MIT
