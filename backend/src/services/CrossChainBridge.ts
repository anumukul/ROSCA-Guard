// backend/src/services/CrossChainBridge.ts
import { ethers } from 'ethers';
import axios from 'axios';

interface KYCVerificationResult {
  isVerified: boolean;
  nationality: string;
  ageAtVerification: number;
  verificationTimestamp: number;
  isHuman: boolean;
  passedOFACCheck: boolean;
}

interface EligibilityCheck {
  eligible: boolean;
  reason: string;
  userInfo?: {
    nationality: string;
    age: number;
    verifiedAt: string;
  };
}

export class CrossChainBridge {
  private celoProvider: ethers.providers.JsonRpcProvider;
  private ethereumProvider: ethers.providers.JsonRpcProvider;
  private kycContract: ethers.Contract;
  private roscaFactory: ethers.Contract;

  constructor(
    celoRpcUrl: string,
    ethereumRpcUrl: string,
    kycContractAddress: string,
    roscaFactoryAddress: string
  ) {
    this.celoProvider = new ethers.providers.JsonRpcProvider(celoRpcUrl);
    this.ethereumProvider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
    
    // KYC contract ABI (simplified)
    const kycABI = [
      "function isUserVerified(address user) view returns (bool)",
      "function getUserVerificationDetails(address user) view returns (bool, string, uint256, uint256, bool, bool)",
      "function isEligibleForROSCA(address user, string country, uint256 minAge, uint256 maxAge) view returns (bool, string)",
      "function getTotalStats() view returns (uint256, uint256, uint256)"
    ];

    // ROSCA Factory ABI (simplified)
    const factoryABI = [
      "function getCircleInfo(uint256 circleId) view returns (tuple)",
      "function createCircle(uint256, uint256, uint256, string, uint256, uint256) returns (uint256)",
      "function joinCircle(uint256) external",
      "function getPlatformStats() view returns (tuple)"
    ];

    this.kycContract = new ethers.Contract(kycContractAddress, kycABI, this.celoProvider);
    this.roscaFactory = new ethers.Contract(roscaFactoryAddress, factoryABI, this.ethereumProvider);
  }

  // Core bridge function: Check KYC status on Celo
  async checkKYCStatus(userAddress: string): Promise<KYCVerificationResult> {
    try {
      const [isVerified, nationality, ageAtVerification, verificationTimestamp, isHuman, passedOFACCheck] = 
        await this.kycContract.getUserVerificationDetails(userAddress);

      return {
        isVerified,
        nationality,
        ageAtVerification: ageAtVerification.toNumber(),
        verificationTimestamp: verificationTimestamp.toNumber(),
        isHuman,
        passedOFACCheck
      };
    } catch (error) {
      console.error('Error checking KYC status:', error);
      return {
        isVerified: false,
        nationality: '',
        ageAtVerification: 0,
        verificationTimestamp: 0,
        isHuman: false,
        passedOFACCheck: false
      };
    }
  }

  // Validate eligibility for ROSCA participation
  async validateROSCAEligibility(
    userAddress: string,
    circleId: number
  ): Promise<EligibilityCheck> {
    try {
      // Get circle info from Ethereum
      const circleInfo = await this.roscaFactory.getCircleInfo(circleId);
      
      // Check KYC status on Celo
      const kycResult = await this.checkKYCStatus(userAddress);
      
      if (!kycResult.isVerified) {
        return {
          eligible: false,
          reason: 'KYC verification required'
        };
      }

      // Check eligibility on Celo contract
      const [eligible, reason] = await this.kycContract.isEligibleForROSCA(
        userAddress,
        circleInfo.params.country,
        circleInfo.params.minAge,
        circleInfo.params.maxAge
      );

      return {
        eligible,
        reason,
        userInfo: eligible ? {
          nationality: kycResult.nationality,
          age: kycResult.ageAtVerification,
          verifiedAt: new Date(kycResult.verificationTimestamp * 1000).toISOString()
        } : undefined
      };

    } catch (error) {
      console.error('Error validating ROSCA eligibility:', error);
      return {
        eligible: false,
        reason: 'Validation failed'
      };
    }
  }

  // Monitor KYC events on Celo
  async startKYCEventMonitoring(callback: (event: any) => void) {
    const eventFilter = this.kycContract.filters.UserVerified();
    
    this.kycContract.on(eventFilter, (userAddress, userIdentifier, nationality, age, timestamp, event) => {
      callback({
        type: 'USER_VERIFIED',
        userAddress,
        userIdentifier,
        nationality,
        age: age.toNumber(),
        timestamp: timestamp.toNumber(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    console.log('Started monitoring KYC events on Celo');
  }

  // Monitor ROSCA events on Ethereum
  async startROSCAEventMonitoring(callback: (event: any) => void) {
    const circleCreatedFilter = this.roscaFactory.filters.CircleCreated();
    const circleJoinedFilter = this.roscaFactory.filters.CircleJoined();

    this.roscaFactory.on(circleCreatedFilter, (circleId, creator, circleAddress, monthlyAmount, country, maxMembers, event) => {
      callback({
        type: 'CIRCLE_CREATED',
        circleId: circleId.toNumber(),
        creator,
        circleAddress,
        monthlyAmount: monthlyAmount.toString(),
        country,
        maxMembers: maxMembers.toNumber(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    this.roscaFactory.on(circleJoinedFilter, (circleId, member, event) => {
      callback({
        type: 'CIRCLE_JOINED',
        circleId: circleId.toNumber(),
        member,
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    console.log('Started monitoring ROSCA events on Ethereum');
  }

  // Get platform statistics across both chains
  async getPlatformStats() {
    try {
      const [kycStats, roscaStats] = await Promise.all([
        this.kycContract.getTotalStats(),
        this.roscaFactory.getPlatformStats()
      ]);

      return {
        kyc: {
          totalVerifiedUsers: kycStats.totalUsers.toNumber(),
          totalCountries: kycStats.totalCountries.toNumber(),
          configScope: kycStats.configScope.toString()
        },
        rosca: {
          totalCircles: roscaStats.totalCircles.toNumber(),
          activeCircles: roscaStats.activeCircles.toNumber(),
          completedCircles: roscaStats.completedCircles.toNumber(),
          totalMembers: roscaStats.totalMembers.toNumber(),
          totalValueLocked: roscaStats.totalValueLocked.toString(),
          totalRevenue: roscaStats.totalRevenue.toString(),
          successRate: roscaStats.avgSuccessRate.toNumber()
        }
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      throw error;
    }
  }

  // Batch eligibility checking for multiple users
  async batchCheckEligibility(
    userAddresses: string[],
    circleId: number
  ): Promise<Map<string, EligibilityCheck>> {
    const results = new Map<string, EligibilityCheck>();
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < userAddresses.length; i += batchSize) {
      const batch = userAddresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (address) => {
        const result = await this.validateROSCAEligibility(address, circleId);
        return { address, result };
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ address, result }) => {
        results.set(address, result);
      });
    }

    return results;
  }

  // Health check for both chains
  async healthCheck() {
    try {
      const [celoBlock, ethereumBlock] = await Promise.all([
        this.celoProvider.getBlockNumber(),
        this.ethereumProvider.getBlockNumber()
      ]);

      return {
        celo: {
          connected: true,
          latestBlock: celoBlock,
          kycContract: this.kycContract.address
        },
        ethereum: {
          connected: true,
          latestBlock: ethereumBlock,
          roscaFactory: this.roscaFactory.address
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        celo: { connected: false, error: error.message },
        ethereum: { connected: false, error: error.message },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// backend/src/api/bridgeRoutes.ts
import express from 'express';
import { CrossChainBridge } from '../services/CrossChainBridge';

const router = express.Router();

// Initialize bridge service
const bridge = new CrossChainBridge(
  process.env.CELO_RPC_URL!,
  process.env.ETHEREUM_RPC_URL!,
  process.env.KYC_VERIFIER_ADDRESS!,
  process.env.ROSCA_FACTORY_ADDRESS!
);

// Check KYC status endpoint
router.get('/kyc/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    const kycResult = await bridge.checkKYCStatus(address);
    res.json(kycResult);
  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({ error: 'Failed to check KYC status' });
  }
});

// Validate ROSCA eligibility endpoint
router.post('/validate-eligibility', async (req, res) => {
  try {
    const { userAddress, circleId } = req.body;

    if (!ethers.utils.isAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }

    if (typeof circleId !== 'number' || circleId < 0) {
      return res.status(400).json({ error: 'Invalid circle ID' });
    }

    const eligibility = await bridge.validateROSCAEligibility(userAddress, circleId);
    res.json(eligibility);
  } catch (error) {
    console.error('Eligibility validation error:', error);
    res.status(500).json({ error: 'Failed to validate eligibility' });
  }
});

// Batch eligibility check endpoint
router.post('/batch-validate', async (req, res) => {
  try {
    const { userAddresses, circleId } = req.body;

    if (!Array.isArray(userAddresses)) {
      return res.status(400).json({ error: 'userAddresses must be an array' });
    }

    if (userAddresses.length > 50) {
      return res.status(400).json({ error: 'Too many addresses (max 50)' });
    }

    const results = await bridge.batchCheckEligibility(userAddresses, circleId);
    
    // Convert Map to Object for JSON response
    const resultsObject = Object.fromEntries(results);
    res.json(resultsObject);
  } catch (error) {
    console.error('Batch validation error:', error);
    res.status(500).json({ error: 'Failed to validate batch eligibility' });
  }
});

// Platform statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await bridge.getPlatformStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await bridge.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

export default router;

// backend/src/services/EventProcessor.ts
import { CrossChainBridge } from './CrossChainBridge';
import { EventEmitter } from 'events';

export class EventProcessor extends EventEmitter {
  private bridge: CrossChainBridge;
  private isProcessing: boolean = false;

  constructor(bridge: CrossChainBridge) {
    super();
    this.bridge = bridge;
  }

  async start() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    console.log('Starting cross-chain event processing...');

    // Start monitoring both chains
    await this.bridge.startKYCEventMonitoring((event) => {
      this.processKYCEvent(event);
    });

    await this.bridge.startROSCAEventMonitoring((event) => {
      this.processROSCAEvent(event);
    });

    console.log('Event processing started successfully');
  }

  private async processKYCEvent(event: any) {
    console.log('Processing KYC event:', event);
    
    try {
      switch (event.type) {
        case 'USER_VERIFIED':
          await this.handleUserVerified(event);
          break;
        default:
          console.log('Unknown KYC event type:', event.type);
      }
    } catch (error) {
      console.error('Error processing KYC event:', error);
      this.emit('error', { type: 'KYC_EVENT_ERROR', event, error });
    }
  }

  private async processROSCAEvent(event: any) {
    console.log('Processing ROSCA event:', event);
    
    try {
      switch (event.type) {
        case 'CIRCLE_CREATED':
          await this.handleCircleCreated(event);
          break;
        case 'CIRCLE_JOINED':
          await this.handleCircleJoined(event);
          break;
        default:
          console.log('Unknown ROSCA event type:', event.type);
      }
    } catch (error) {
      console.error('Error processing ROSCA event:', error);
      this.emit('error', { type: 'ROSCA_EVENT_ERROR', event, error });
    }
  }

  private async handleUserVerified(event: any) {
    // Update internal user database
    // Send notification to user
    // Update analytics
    
    this.emit('userVerified', {
      userAddress: event.userAddress,
      nationality: event.nationality,
      age: event.age,
      timestamp: new Date(event.timestamp * 1000)
    });

    console.log(`User ${event.userAddress} verified with nationality ${event.nationality}`);
  }

  private async handleCircleCreated(event: any) {
    // Update circle database
    // Notify potential members
    // Update platform statistics
    
    this.emit('circleCreated', {
      circleId: event.circleId,
      creator: event.creator,
      circleAddress: event.circleAddress,
      country: event.country,
      maxMembers: event.maxMembers
    });

    console.log(`Circle ${event.circleId} created by ${event.creator}`);
  }

  private async handleCircleJoined(event: any) {
    // Validate the member was KYC verified
    // Update circle membership
    // Check if circle is full and should start
    
    const eligibility = await this.bridge.validateROSCAEligibility(event.member, event.circleId);
    
    if (!eligibility.eligible) {
      console.warn(`Non-eligible user ${event.member} joined circle ${event.circleId}`);
      this.emit('warning', {
        type: 'INELIGIBLE_MEMBER_JOINED',
        member: event.member,
        circleId: event.circleId,
        reason: eligibility.reason
      });
    }

    this.emit('circleJoined', {
      circleId: event.circleId,
      member: event.member,
      eligibility
    });

    console.log(`Member ${event.member} joined circle ${event.circleId}`);
  }

  stop() {
    this.isProcessing = false;
    console.log('Event processing stopped');
  }
}