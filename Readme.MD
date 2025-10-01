# ROSCA-Guard 🛡️

[![Backend](https://img.shields.io/badge/Backend-Live-success)](https://rosca-guard.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Self Protocol](https://img.shields.io/badge/Self%20Protocol-Integrated-purple)](https://self.xyz)
[![PYUSD](https://img.shields.io/badge/PYUSD-Enabled-green)](https://paxos.com/pyusd)

> Privacy-preserving identity verification for decentralized Rotating Savings and Credit Associations (ROSCAs) powered by Self Protocol and PYUSD.

## 🌟 Overview

ROSCA-Guard revolutionizes traditional rotating savings circles by combining blockchain technology with zero-knowledge identity verification. Built for the Self Protocol hackathon, this platform enables verified users to participate in automated savings circles while maintaining complete privacy.

### Key Features

- 🔐 **Zero-Knowledge KYC**: Identity verification using Self Protocol (Passport & Aadhaar support)
- 💰 **PYUSD Integration**: Stablecoin-based automated payments and payouts
- ⛓️ **Cross-Chain Architecture**: KYC on Celo, ROSCA operations on Ethereum
- 📊 **Smart Contract Automation**: No manual coordination required
- 🎯 **Reputation System**: Merit-based payout selection
- 📈 **DeFi Yield**: Earn additional returns on pooled funds
- 🌍 **Global Access**: Support for region-specific and international circles

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - RainbowKit Wallet Connection                         │
│  - Self Protocol QR Code Integration                    │
│  - ROSCA Circle Management UI                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Backend (Express.js + TypeScript)           │
│  - Self Protocol Backend Verifier                       │
│  - Cross-Chain Bridge Service                           │
│  - API Gateway                                          │
└──────┬─────────────────────────────┬────────────────────┘
       │                             │
       ▼                             ▼
┌─────────────────┐          ┌─────────────────┐
│   Celo Testnet  │          │ Ethereum Sepolia│
│                 │          │                 │
│  KYC Verifier   │          │  ROSCA Factory  │
│  (Self Protocol)│          │  ROSCA Circles  │
│                 │          │  PYUSD Token    │
└─────────────────┘          └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0
- MetaMask or compatible Web3 wallet
- Self Protocol mobile app ([iOS](https://apps.apple.com/app/self/id6443957663) / [Android](https://play.google.com/store/apps/details?id=com.proofofpassportapp))

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/anumukul/ROSCA-Guard.git
cd ROSCA-Guard
```

2. **Install Backend Dependencies**

```bash
cd backend
npm install
```

3. **Configure Backend Environment**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3001

# Blockchain RPCs
CELO_RPC_URL=https://alfajores-forno.celo-testnet.org
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Contract Addresses
KYC_VERIFIER_ADDRESS=0xAE8d27497451A252815B86898CDAd029be1417e9
ROSCA_FACTORY_ADDRESS=0x9F01d0beE74AC0aF15a390cF5bd54E28EF4BbBac

# Self Protocol
SELF_CONFIG_ID=0x766466f264a44af31cd388cd05801bcc5dfff4980ee97503579db8b3d0742a7e

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

4. **Start Backend**

```bash
npm run dev
```

5. **Install Frontend Dependencies**

```bash
cd ../frontend
npm install --legacy-peer-deps
```

6. **Configure Frontend Environment**

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SELF_CONFIG_ID=0x766466f264a44af31cd388cd05801bcc5dfff4980ee97503579db8b3d0742a7e
```

7. **Start Frontend**

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📱 Usage

### For Users

1. **Verify Identity**

   - Connect your Web3 wallet
   - Choose verification method (Passport or Aadhaar)
   - Scan QR code with Self Protocol app
   - Complete zero-knowledge verification

2. **Create or Join ROSCA Circle**

   - Browse available circles or create new one
   - Set monthly contribution amount in PYUSD
   - Define circle parameters (size, duration, eligibility)

3. **Participate in Circles**
   - Make monthly PYUSD contributions automatically
   - Receive payouts when it's your turn
   - Earn yield on pooled funds
   - Build reputation through consistent participation

### For Developers

#### Deploy Smart Contracts

```bash
cd contracts

# Install dependencies
npm install
forge install

# Configure deployment
cp .env.example .env
# Edit .env with your private key and RPC URLs

# Deploy KYC Verifier on Celo
forge script script/DeployKYC.s.sol --rpc-url $CELO_RPC_URL --broadcast --verify

# Deploy ROSCA Factory on Ethereum
forge script script/DeployFactory.s.sol --rpc-url $ETHEREUM_RPC_URL --broadcast --verify
```

#### Run Tests

```bash
# Backend tests
cd backend
npm test

# Smart contract tests
cd contracts
forge test

# Frontend tests
cd frontend
npm test
```

## 🔧 Technology Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Web3**: RainbowKit + wagmi + viem
- **Identity**: Self Protocol SDK (`@selfxyz/core`, `@selfxyz/qrcode`)
- **State Management**: React Query
- **Routing**: React Router v6

### Backend

- **Runtime**: Node.js + Express.js
- **Language**: TypeScript
- **Identity Verification**: Self Protocol Backend Verifier
- **Blockchain Interaction**: ethers.js v5
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: express-validator

### Smart Contracts

- **Language**: Solidity 0.8.28
- **Framework**: Foundry
- **Identity**: Self Protocol Verification Root
- **Standards**: ERC-20 (PYUSD), Custom ROSCA logic
- **Networks**: Celo (KYC), Ethereum (ROSCAs)

### DevOps

- **Backend Hosting**: Render
- **Frontend Hosting**: Vercel
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions (optional)

## 📊 Smart Contracts

### Deployed Contracts

#### Celo Alfajores Testnet

- **KYC Verifier**: `0xAE8d27497451A252815B86898CDAd029be1417e9`
- **Network**: Celo Alfajores
- **Explorer**: [View on CeloScan](https://celo-alfajores.blockscout.com/)

#### Ethereum Sepolia Testnet

- **ROSCA Factory**: `0x9F01d0beE74AC0aF15a390cF5bd54E28EF4BbBac`
- **ROSCA Analytics**: `0x45Fdf95185922b91627F0B340AFA3DF0fED650E7`
- **Mock PYUSD**: `0x1e4e7e50E176A66BBEFC61331898F5ffdE49DBd6`
- **Network**: Ethereum Sepolia
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/)

### Key Contracts

#### KYCVerifier.sol

Extends Self Protocol's `SelfVerificationRoot` for on-chain identity verification.

```solidity
function isEligibleForROSCA(
    address user,
    string memory requiredCountry,
    uint256 circleMinAge,
    uint256 circleMaxAge
) external view returns (bool eligible, string memory reason);
```

#### ROSCAFactory.sol

Factory pattern for creating and managing ROSCA circles.

```solidity
function createCircle(
    uint256 monthlyAmount,
    uint256 maxMembers,
    uint256 duration,
    string memory country,
    uint256 minAge,
    uint256 maxAge
) external returns (uint256 circleId);
```

#### ROSCACircle.sol

Individual ROSCA circle with automated payment cycles and reputation tracking.

```solidity
function joinCircle() external onlyKYCVerified;
function makeContribution() external onlyMember;
function distributePayout() external onlyOwner;
```

## 🔐 Self Protocol Integration

### Backend Verification

```typescript
import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

const verifier = new SelfBackendVerifier(
  "rosca-guard-v1",
  "https://rosca-guard.onrender.com/api/self/verify-self",
  false, // production mode
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: true,
  }),
  "uuid"
);

const result = await verifier.verify(
  attestationId,
  proof,
  publicSignals,
  userContextData
);
```

### Contract Verification

```solidity
contract KYCVerifier is SelfVerificationRoot {
    function customVerificationHook(
        ISelfVerificationRoot.GenericDiscloseOutputV2 memory output,
        bytes memory userData
    ) internal override {
        // Store verified user data on-chain
        verifiedUsers[userAddress] = VerifiedUser({
            nationality: output.nationality,
            age: calculatedAge,
            verificationTimestamp: block.timestamp,
            isVerified: true
        });
    }
}
```

## 🌐 API Documentation

### Base URL

- **Production**: `https://rosca-guard.onrender.com`
- **Development**: `http://localhost:3001`

### Endpoints

#### Health Check

```http
GET /health
```

#### Verify Identity (Self Protocol)

```http
POST /api/self/verify-self
Content-Type: application/json

{
  "attestationId": "1",
  "proof": {...},
  "publicSignals": {...},
  "userContextData": "..."
}
```

#### Get KYC Status

```http
GET /api/self/kyc-status/:address
```

#### Check ROSCA Eligibility

```http
POST /api/self/check-eligibility
Content-Type: application/json

{
  "userAddress": "0x...",
  "circleId": 1
}
```

#### Get Platform Statistics

```http
GET /api/bridge/stats
```

#### Create ROSCA Circle

```http
POST /api/bridge/create-circle
Content-Type: application/json

{
  "monthlyAmount": 100,
  "maxMembers": 5,
  "duration": 12,
  "country": "IN",
  "minAge": 18,
  "maxAge": 65
}
```

For complete API documentation, see [API.md](./docs/API.md)

## 🧪 Testing

### Get Testnet Tokens

**Celo Alfajores (for KYC transactions)**

- Faucet: https://faucet.celo.org/celo-sepolia
- Request: 0.5 CELO per day

**Ethereum Sepolia (for ROSCA operations)**

- Faucet: https://sepoliafaucet.com
- Request: 0.5 ETH per day

**Mock PYUSD**

- Use the faucet function in the deployed contract
- Or call `faucet(amount)` to mint test tokens

### Test Self Protocol Verification

1. Install Self Protocol app on your mobile device
2. Set up test passport in the app (staging mode)
3. Run the frontend locally
4. Scan QR code to initiate verification
5. Complete the verification flow

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Project Structure

```
ROSCA-Guard/
├── backend/
│   ├── src/
│   │   ├── api/              # API routes
│   │   │   ├── bridgeRoutes.ts
│   │   │   └── selfRoutes.ts
│   │   ├── services/         # Business logic
│   │   │   ├── CrossChainBridge.ts
│   │   │   └── SelfVerificationService.ts
│   │   └── app.ts           # Express app
│   ├── package.json
│   └── tsconfig.json
├── contracts/
│   ├── src/
│   │   ├── KYCVerifier.sol
│   │   ├── ROSCAFactory.sol
│   │   ├── ROSCACircle.sol
│   │   ├── ROSCAAnalytics.sol
│   │   ├── YieldManager.sol
│   │   └── DateParser.sol
│   ├── script/              # Deployment scripts
│   ├── test/                # Contract tests
│   └── foundry.toml
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── config/          # Configuration
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🏆 Hackathon Submission

### Self Protocol Integration

- **Backend SDK**: SelfBackendVerifier for proof verification
- **Smart Contracts**: SelfVerificationRoot integration
- **Zero-Knowledge Proofs**: Privacy-preserving identity verification
- **Multi-Document Support**: Passport and Aadhaar verification

### PYUSD Integration

- **Primary Currency**: All ROSCA contributions in PYUSD
- **Smart Contract Integration**: ERC-20 standard implementation
- **Automated Payments**: Monthly contributions and payouts
- **Yield Generation**: DeFi integration for returns

### Innovation

- **Cross-Chain Architecture**: KYC on Celo, operations on Ethereum
- **Reputation System**: Merit-based payout selection
- **Sybil Resistance**: Identity verification prevents fake accounts
- **Financial Inclusion**: Accessible global savings circles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Self Protocol** for zero-knowledge identity verification
- **PayPal/Paxos** for PYUSD stablecoin
- **Celo Foundation** for affordable blockchain infrastructure
- **Ethereum Foundation** for smart contract platform
- **ETHGlobal** for hosting hackathons and fostering innovation

## 📞 Contact & Links

- **Live Demo**: [Frontend URL] (Coming soon on Vercel)
- **Backend API**: https://rosca-guard.onrender.com
- **GitHub**: https://github.com/anumukul/ROSCA-Guard
- **Demo Video**: [YouTube Link] (Coming soon)

### Team

- **Developer**: Anumukul
- **Email**: anumukul009@gmail.com
- **Twitter**: [@anumukul](https://twitter.com/anumukul)
- **GitHub**: [@anumukul](https://github.com/anumukul)

## 🚧 Roadmap

- [x] Self Protocol KYC integration
- [x] PYUSD smart contract implementation
- [x] Cross-chain bridge architecture
- [x] Backend API deployment
- [ ] Frontend deployment on Vercel
- [ ] Mainnet deployment
- [ ] Mobile app integration
- [ ] Additional DeFi yield sources
- [ ] Governance features
- [ ] Multi-language support

---

**Built with ❤️ for the EthGlobal New-Delhi Hackathon**

_Empowering financial inclusion through privacy-preserving identity verification_
