import express from 'express';
import { body, validationResult } from 'express-validator';
import { SelfVerificationService } from '../services/SelfVerificationService';
import { CrossChainBridge } from '../services/CrossChainBridge';

const router = express.Router();

const selfVerificationService = new SelfVerificationService();
const bridge = new CrossChainBridge(
  process.env.CELO_RPC_URL!,
  process.env.ETHEREUM_RPC_URL!,
  process.env.KYC_VERIFIER_ADDRESS!,
  process.env.ROSCA_FACTORY_ADDRESS!
);

// Self Protocol verification endpoint - FIXED with better error handling
router.post('/verify-self', 
  [
    body('attestationId').notEmpty().withMessage('Attestation ID is required'),
    body('proof').notEmpty().withMessage('Proof is required'),
    body('publicSignals').notEmpty().withMessage('Public signals are required'),
    body('userContextData').notEmpty().withMessage('User context data is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('❌ Validation failed:', errors.array());
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { attestationId, proof, publicSignals, userContextData } = req.body;

      console.log('📨 Received Self Protocol verification request');
      console.log('📊 Request details:', {
        attestationId,
        hasProof: !!proof,
        hasPublicSignals: !!publicSignals,
        hasUserContextData: !!userContextData,
        userContextDataType: typeof userContextData,
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin')
      });

      // FIXED: Enhanced verification with better error handling
      const verificationResult = await selfVerificationService.verifyProof(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      console.log('📋 Verification result:', {
        isValid: verificationResult.isValid,
        hasUserData: !!verificationResult.userData,
        error: verificationResult.error
      });

      if (verificationResult.isValid && verificationResult.userData) {
        console.log('✅ Verification successful for user:', {
          nationality: verificationResult.userData.nationality,
          age: verificationResult.userData.age,
          verificationType: verificationResult.userData.verificationType
        });

        res.json({
          success: true,
          verified: true,
          data: {
            nationality: verificationResult.userData.nationality,
            age: verificationResult.userData.age,
            verificationType: verificationResult.userData.verificationType,
            isHuman: verificationResult.userData.isHuman,
            passedOFACCheck: verificationResult.userData.passedOFACCheck,
            userIdentifier: verificationResult.userData.userIdentifier,
            attestationId: verificationResult.userData.attestationId
          }
        });
      } else {
        console.error('❌ Verification failed:', verificationResult.error);
        res.status(400).json({
          success: false,
          verified: false,
          error: verificationResult.error || 'Verification failed'
        });
      }

    } catch (error: any) {
      console.error('💥 Self verification endpoint error:', error);
      
      // Enhanced error response
      const errorMessage = error.message || 'Internal server error during verification';
      const statusCode = error.status || 500;
      
      res.status(statusCode).json({
        success: false,
        verified: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error.stack,
          details: error 
        })
      });
    }
  }
);

// Get user's KYC status
router.get('/kyc-status/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }

    console.log('🔍 Checking KYC status for:', address);
    const kycStatus = await bridge.checkKYCStatus(address);
    
    console.log('📊 KYC status result:', {
      address,
      isVerified: kycStatus.isVerified,
      nationality: kycStatus.nationality
    });

    res.json({
      success: true,
      data: kycStatus
    });

  } catch (error: any) {
    console.error('❌ KYC status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check KYC status'
    });
  }
});

// Check ROSCA eligibility
router.post('/check-eligibility',
  [
    body('userAddress').isEthereumAddress().withMessage('Valid user address is required'),
    body('circleId').isInt({ min: 0 }).withMessage('Valid circle ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userAddress, circleId } = req.body;

      console.log('🔍 Checking eligibility:', { userAddress, circleId });
      const eligibility = await bridge.validateROSCAEligibility(userAddress, parseInt(circleId));
      
      console.log('📊 Eligibility result:', {
        userAddress,
        circleId,
        eligible: eligibility.eligible,
        reason: eligibility.reason
      });

      res.json({
        success: true,
        data: eligibility
      });

    } catch (error: any) {
      console.error('❌ Eligibility check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check eligibility'
      });
    }
  }
);

// Get verification service stats
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Fetching verification stats...');
    
    const stats = {
      self: selfVerificationService.getStats(),
      platform: await bridge.getPlatformStats(),
      health: await bridge.healthCheck()
    };

    console.log('✅ Stats retrieved successfully');
    res.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

// Health check endpoint for Self service
router.get('/health', async (req, res) => {
  try {
    const healthCheck = await selfVerificationService.healthCheck();
    
    res.json({
      success: true,
      ...healthCheck
    });
  } catch (error: any) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Add this to backend/src/api/selfRoutes.ts
router.get('/test-sdk', async (req, res) => {
  try {
    const stats = selfVerificationService.getStats();
    const health = await selfVerificationService.healthCheck();
    
    res.json({
      success: true,
      stats,
      health,
      message: 'SDK initialization test'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;