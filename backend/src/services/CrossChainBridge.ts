// backend/src/services/CrossChainBridge.ts
import { ethers } from 'ethers';
import axios from 'axios';
import { SelfVerificationService } from './SelfVerificationService';

interface KYCVerificationResult {
  isVerified: boolean;
  nationality: string;
  ageAtVerification: number;
  verificationTimestamp: number;
  isHuman: boolean;
  passedOFACCheck: boolean;
  verificationType: 'passport' | 'aadhaar';
  userIdentifier: string;
  attestationId?: string;
}

interface EligibilityCheck {
  eligible: boolean;
  reason: string;
  userInfo?: {
    nationality: string;
    age: number;
    verifiedAt: string;
    verificationType: string;
  };
}

interface PlatformStats {
  kyc: {
    totalVerifiedUsers: number;
    totalCountries: number;
    configScope: string;
  };
  rosca: {
    totalCircles: number;
    activeCircles: number;
    completedCircles: number;
    totalMembers: number;
    totalValueLocked: string;
    totalRevenue: string;
    successRate: number;
  };
}

interface HealthCheckResult {
  celo: {
    connected: boolean;
    latestBlock?: number;
    kycContract?: string;
    error?: string;
  };
  ethereum: {
    connected: boolean;
    latestBlock?: number;
    roscaFactory?: string;
    error?: string;
  };
  selfProtocol: {
    status: string;
    details?: any;
    error?: string;
  };
  timestamp: string;
}

export class CrossChainBridge {
  private celoProvider: ethers.providers.JsonRpcProvider;
  private ethereumProvider: ethers.providers.JsonRpcProvider;
  private kycContract: ethers.Contract;
  private roscaFactory: ethers.Contract;
  private selfVerificationService: SelfVerificationService;
  private isInitialized: boolean = false;

  constructor(
    celoRpcUrl: string,
    ethereumRpcUrl: string,
    kycContractAddress: string,
    roscaFactoryAddress: string
  ) {
    console.log('🌉 Initializing CrossChain Bridge...');
    console.log(`📍 Celo RPC: ${celoRpcUrl}`);
    console.log(`📍 Ethereum RPC: ${ethereumRpcUrl}`);
    console.log(`📍 KYC Contract: ${kycContractAddress}`);
    console.log(`📍 ROSCA Factory: ${roscaFactoryAddress}`);

    // Initialize providers
    this.celoProvider = new ethers.providers.JsonRpcProvider(celoRpcUrl);
    this.ethereumProvider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
    
    // Initialize REAL Self verification service
    this.selfVerificationService = new SelfVerificationService();
    
    // Enhanced KYC contract ABI with Self Protocol integration
    const kycABI = [
      "function isUserVerified(address user) view returns (bool)",
      "function getUserVerificationDetails(address user) view returns (bool, string, uint256, uint256, bool, bool)",
      "function isEligibleForROSCA(address user, string country, uint256 minAge, uint256 maxAge) view returns (bool, string)",
      "function getTotalStats() view returns (uint256, uint256, uint256)",
      // Additional functions your KYC contract might have
      "function verifyUser(address user, string nationality, uint256 age, uint8 verificationType) external",
      "function updateUserVerification(address user, string nationality, uint256 age, uint8 verificationType) external",
      "function revokeVerification(address user) external",
      "function configId() view returns (bytes32)",
      "function scope() view returns (uint256)"
    ];

    // ROSCA Factory ABI (keeping your existing structure)
    const factoryABI = [
      "function getCircleInfo(uint256 circleId) view returns (tuple)",
      "function createCircle(uint256, uint256, uint256, string, uint256, uint256) returns (uint256)",
      "function joinCircle(uint256) external",
      "function getPlatformStats() view returns (tuple)",
      "function totalCircles() view returns (uint256)",
      "function circles(uint256) view returns (address)",
      "function userCircles(address) view returns (uint256[] memory)",
      "function circlesByCountry(string memory) view returns (uint256[] memory)",
      "function totalPlatformRevenue() view returns (uint256)",
      "function PYUSD() view returns (address)"
    ];

    // Initialize contracts
    this.kycContract = new ethers.Contract(kycContractAddress, kycABI, this.celoProvider);
    this.roscaFactory = new ethers.Contract(roscaFactoryAddress, factoryABI, this.ethereumProvider);
    
    this.isInitialized = true;
    console.log('✅ CrossChain Bridge initialized successfully');
  }

  /**
   * Verify Self Protocol proof and update blockchain (REAL IMPLEMENTATION)
   */
  async verifySelfProofAndUpdateBlockchain(
    userAddress: string,
    attestationId: string,
    proof: any,
    publicSignals: any,
    userContextData: any,
    signer?: ethers.Signer
  ): Promise<{ success: boolean; txHash?: string; error?: string; verificationData?: any }> {
    try {
      console.log('🔄 Starting Self proof verification and blockchain update for:', userAddress);
      console.log('📊 Verification request details:', {
        attestationId,
        hasProof: !!proof,
        hasPublicSignals: !!publicSignals,
        hasUserContextData: !!userContextData,
        hasSigner: !!signer
      });

      // First verify the proof with REAL Self Protocol SDK
      const verificationResult = await this.selfVerificationService.verifyProof(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      if (!verificationResult.isValid || !verificationResult.userData) {
        console.error('❌ Self Protocol verification failed:', verificationResult.error);
        return {
          success: false,
          error: verificationResult.error || 'Self Protocol verification failed'
        };
      }

      console.log('✅ Self Protocol verification successful:', verificationResult.userData);

      // If signer is provided, update the blockchain
      if (signer) {
        console.log('📝 Updating KYC contract on Celo blockchain...');
        
        try {
          const kycContractWithSigner = this.kycContract.connect(signer);
          const verificationType = verificationResult.userData.verificationType === 'aadhaar' ? 1 : 0;

          // Check if the contract has the updateUserVerification function
          const tx = await kycContractWithSigner.updateUserVerification(
            userAddress,
            verificationResult.userData.nationality,
            verificationResult.userData.age,
            verificationType
          );

          const receipt = await tx.wait();
          console.log('⛓️ Blockchain update successful:', receipt.transactionHash);

          return {
            success: true,
            txHash: receipt.transactionHash,
            verificationData: verificationResult.userData
          };
        } catch (blockchainError) {
          console.warn('⚠️ Blockchain update failed, but Self verification succeeded:', blockchainError.message);
          // Return success even if blockchain update fails
          return {
            success: true,
            verificationData: verificationResult.userData,
            error: `Verification successful, but blockchain update failed: ${blockchainError.message}`
          };
        }
      }

      // If no signer provided, just return the verification result
      return {
        success: true,
        verificationData: verificationResult.userData
      };

    } catch (error) {
      console.error('💥 Error in Self proof verification and blockchain update:', error);
      return {
        success: false,
        error: `Verification failed: ${error.message}`
      };
    }
  }

  /**
   * Core bridge function: Check KYC status on Celo (Enhanced)
   */
  async checkKYCStatus(userAddress: string): Promise<KYCVerificationResult> {
    try {
      console.log('🔍 Checking KYC status for:', userAddress);

      if (!ethers.utils.isAddress(userAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      const [isVerified, nationality, ageAtVerification, verificationTimestamp, isHuman, passedOFACCheck] = 
        await this.kycContract.getUserVerificationDetails(userAddress);

      const result: KYCVerificationResult = {
        isVerified,
        nationality,
        ageAtVerification: ageAtVerification.toNumber(),
        verificationTimestamp: verificationTimestamp.toNumber(),
        isHuman,
        passedOFACCheck,
        verificationType: 'passport', // Default - could be enhanced to store in contract
        userIdentifier: '' // Could be enhanced to store in contract
      };

      console.log('📊 KYC status result:', {
        isVerified: result.isVerified,
        nationality: result.nationality,
        age: result.ageAtVerification
      });

      return result;
    } catch (error) {
      console.error('❌ Error checking KYC status:', error);
      return {
        isVerified: false,
        nationality: '',
        ageAtVerification: 0,
        verificationTimestamp: 0,
        isHuman: false,
        passedOFACCheck: false,
        verificationType: 'passport',
        userIdentifier: ''
      };
    }
  }

  /**
   * Validate eligibility for ROSCA participation (Enhanced)
   */
  async validateROSCAEligibility(
    userAddress: string,
    circleId: number
  ): Promise<EligibilityCheck> {
    try {
      console.log('🔍 Validating ROSCA eligibility:', { userAddress, circleId });

      if (!ethers.utils.isAddress(userAddress)) {
        return {
          eligible: false,
          reason: 'Invalid user address'
        };
      }

      if (circleId < 0) {
        return {
          eligible: false,
          reason: 'Invalid circle ID'
        };
      }

      // Get circle info from Ethereum
      const circleInfo = await this.roscaFactory.getCircleInfo(circleId);
      console.log('📊 Circle info retrieved:', {
        circleId,
        country: circleInfo.params?.country,
        minAge: circleInfo.params?.minAge?.toString(),
        maxAge: circleInfo.params?.maxAge?.toString()
      });
      
      // Check KYC status on Celo
      const kycResult = await this.checkKYCStatus(userAddress);
      
      if (!kycResult.isVerified) {
        return {
          eligible: false,
          reason: 'KYC verification required - please complete identity verification first'
        };
      }

      // Check eligibility on Celo contract
      const [eligible, reason] = await this.kycContract.isEligibleForROSCA(
        userAddress,
        circleInfo.params.country || 'GLOBAL',
        circleInfo.params.minAge || 18,
        circleInfo.params.maxAge || 100
      );

      const result: EligibilityCheck = {
        eligible,
        reason,
        userInfo: eligible ? {
          nationality: kycResult.nationality,
          age: kycResult.ageAtVerification,
          verifiedAt: new Date(kycResult.verificationTimestamp * 1000).toISOString(),
          verificationType: kycResult.verificationType
        } : undefined
      };

      console.log('✅ Eligibility check result:', result);
      return result;

    } catch (error) {
      console.error('❌ Error validating ROSCA eligibility:', error);
      return {
        eligible: false,
        reason: `Validation failed: ${error.message}`
      };
    }
  }

  /**
   * Monitor KYC events on Celo
   */
  async startKYCEventMonitoring(callback: (event: any) => void): Promise<void> {
    try {
      console.log('👂 Starting KYC event monitoring on Celo...');
      
      const eventFilter = this.kycContract.filters.UserVerified();
      
      this.kycContract.on(eventFilter, (userAddress, userIdentifier, nationality, age, timestamp, event) => {
        const eventData = {
          type: 'USER_VERIFIED',
          userAddress,
          userIdentifier,
          nationality,
          age: age.toNumber(),
          timestamp: timestamp.toNumber(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };
        
        console.log('📡 KYC Event detected:', eventData);
        callback(eventData);
      });

      console.log('✅ KYC event monitoring started successfully');
    } catch (error) {
      console.error('❌ Failed to start KYC event monitoring:', error);
      throw error;
    }
  }

  /**
   * Monitor ROSCA events on Ethereum
   */
  async startROSCAEventMonitoring(callback: (event: any) => void): Promise<void> {
    try {
      console.log('👂 Starting ROSCA event monitoring on Ethereum...');
      
      const circleCreatedFilter = this.roscaFactory.filters.CircleCreated();
      const circleJoinedFilter = this.roscaFactory.filters.CircleJoined();

      this.roscaFactory.on(circleCreatedFilter, (circleId, creator, circleAddress, monthlyAmount, country, maxMembers, event) => {
        const eventData = {
          type: 'CIRCLE_CREATED',
          circleId: circleId.toNumber(),
          creator,
          circleAddress,
          monthlyAmount: monthlyAmount.toString(),
          country,
          maxMembers: maxMembers.toNumber(),
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };
        
        console.log('📡 ROSCA Event detected:', eventData);
        callback(eventData);
      });

      this.roscaFactory.on(circleJoinedFilter, (circleId, member, event) => {
        const eventData = {
          type: 'CIRCLE_JOINED',
          circleId: circleId.toNumber(),
          member,
          txHash: event.transactionHash,
          blockNumber: event.blockNumber
        };
        
        console.log('📡 ROSCA Event detected:', eventData);
        callback(eventData);
      });

      console.log('✅ ROSCA event monitoring started successfully');
    } catch (error) {
      console.error('❌ Failed to start ROSCA event monitoring:', error);
      throw error;
    }
  }

  /**
   * Get platform statistics across both chains
   */
  async getPlatformStats(): Promise<PlatformStats> {
    try {
      console.log('📊 Fetching platform statistics...');
      
      const [kycStats, roscaStats] = await Promise.all([
        this.kycContract.getTotalStats(),
        this.roscaFactory.getPlatformStats()
      ]);

      const stats: PlatformStats = {
        kyc: {
          totalVerifiedUsers: kycStats.totalUsers?.toNumber() || 0,
          totalCountries: kycStats.totalCountries?.toNumber() || 0,
          configScope: kycStats.configScope?.toString() || '0'
        },
        rosca: {
          totalCircles: roscaStats.totalCircles?.toNumber() || 0,
          activeCircles: roscaStats.activeCircles?.toNumber() || 0,
          completedCircles: roscaStats.completedCircles?.toNumber() || 0,
          totalMembers: roscaStats.totalMembers?.toNumber() || 0,
          totalValueLocked: roscaStats.totalValueLocked?.toString() || '0',
          totalRevenue: roscaStats.totalRevenue?.toString() || '0',
          successRate: roscaStats.avgSuccessRate?.toNumber() || 0
        }
      };

      console.log('✅ Platform stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting platform stats:', error);
      throw new Error(`Failed to get platform stats: ${error.message}`);
    }
  }

  /**
   * Batch eligibility checking for multiple users
   */
  async batchCheckEligibility(
    userAddresses: string[],
    circleId: number
  ): Promise<Map<string, EligibilityCheck>> {
    console.log(`🔍 Batch checking eligibility for ${userAddresses.length} addresses`);
    
    const results = new Map<string, EligibilityCheck>();
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < userAddresses.length; i += batchSize) {
      const batch = userAddresses.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(userAddresses.length/batchSize)}`);
      
      const batchPromises = batch.map(async (address) => {
        try {
          const result = await this.validateROSCAEligibility(address, circleId);
          return { address, result };
        } catch (error) {
          console.error(`❌ Error checking eligibility for ${address}:`, error);
          return { 
            address, 
            result: { 
              eligible: false, 
              reason: `Error: ${error.message}` 
            } 
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ address, result }) => {
        results.set(address, result);
      });

      // Small delay between batches
      if (i + batchSize < userAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Batch eligibility check completed for ${results.size} addresses`);
    return results;
  }

  /**
   * Health check for both chains and Self Protocol
   */
  async healthCheck(): Promise<HealthCheckResult> {
    console.log('🏥 Performing health check...');
    
    const result: HealthCheckResult = {
      celo: { connected: false },
      ethereum: { connected: false },
      selfProtocol: { status: 'unknown' },
      timestamp: new Date().toISOString()
    };

    try {
      // Check Celo connection
      try {
        const celoBlock = await this.celoProvider.getBlockNumber();
        result.celo = {
          connected: true,
          latestBlock: celoBlock,
          kycContract: this.kycContract.address
        };
        console.log(`✅ Celo connected - Block: ${celoBlock}`);
      } catch (celoError) {
        result.celo = {
          connected: false,
          error: celoError.message
        };
        console.error('❌ Celo connection failed:', celoError.message);
      }

      // Check Ethereum connection
      try {
        const ethereumBlock = await this.ethereumProvider.getBlockNumber();
        result.ethereum = {
          connected: true,
          latestBlock: ethereumBlock,
          roscaFactory: this.roscaFactory.address
        };
        console.log(`✅ Ethereum connected - Block: ${ethereumBlock}`);
      } catch (ethereumError) {
        result.ethereum = {
          connected: false,
          error: ethereumError.message
        };
        console.error('❌ Ethereum connection failed:', ethereumError.message);
      }

      // Check Self Protocol service
      try {
        const selfHealth = await this.selfVerificationService.healthCheck();
        result.selfProtocol = selfHealth;
        console.log(`✅ Self Protocol status: ${selfHealth.status}`);
      } catch (selfError) {
        result.selfProtocol = {
          status: 'unhealthy',
          error: selfError.message
        };
        console.error('❌ Self Protocol health check failed:', selfError.message);
      }

    } catch (error) {
      console.error('💥 Health check failed:', error);
      result.selfProtocol = {
        status: 'error',
        error: error.message
      };
    }

    return result;
  }

  /**
   * Get Self verification service stats
   */
  getSelfVerificationStats() {
    return this.selfVerificationService.getStats();
  }

  /**
   * Get contract configuration information
   */
  async getContractConfig(): Promise<any> {
    try {
      const [configId, scope] = await Promise.all([
        this.kycContract.configId().catch(() => 'Not available'),
        this.kycContract.scope().catch(() => 'Not available')
      ]);

      return {
        kyc: {
          address: this.kycContract.address,
          configId: configId.toString(),
          scope: scope.toString(),
          network: 'Celo'
        },
        rosca: {
          address: this.roscaFactory.address,
          network: 'Ethereum'
        },
        self: this.getSelfVerificationStats()
      };
    } catch (error) {
      console.error('❌ Error getting contract config:', error);
      return {
        error: error.message,
        kyc: { address: this.kycContract.address },
        rosca: { address: this.roscaFactory.address }
      };
    }
  }

  /**
   * Verify if the bridge is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && 
           !!this.celoProvider && 
           !!this.ethereumProvider && 
           !!this.kycContract && 
           !!this.roscaFactory && 
           !!this.selfVerificationService;
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      celo: {
        network: this.celoProvider.network,
        connection: this.celoProvider.connection
      },
      ethereum: {
        network: this.ethereumProvider.network,
        connection: this.ethereumProvider.connection
      }
    };
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down CrossChain Bridge...');
    
    try {
      // Remove all event listeners
      this.kycContract.removeAllListeners();
      this.roscaFactory.removeAllListeners();
      
      console.log('✅ CrossChain Bridge shutdown completed');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}