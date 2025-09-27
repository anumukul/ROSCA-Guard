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

// Self Protocol verification endpoint
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
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { attestationId, proof, publicSignals, userContextData } = req.body;

      console.log('Received Self Protocol verification request');

      const verificationResult = await selfVerificationService.verifyProof(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      if (verificationResult.isValid && verificationResult.userData) {
        res.json({
          success: true,
          verified: true,
          data: {
            nationality: verificationResult.userData.nationality,
            age: verificationResult.userData.age,
            verificationType: verificationResult.userData.verificationType,
            isHuman: verificationResult.userData.isHuman,
            passedOFACCheck: verificationResult.userData.passedOFACCheck
          }
        });
      } else {
        res.status(400).json({
          success: false,
          verified: false,
          error: verificationResult.error || 'Verification failed'
        });
      }

    } catch (error) {
      console.error('Self verification endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during verification'
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

    const kycStatus = await bridge.checkKYCStatus(address);
    
    res.json({
      success: true,
      data: kycStatus
    });

  } catch (error) {
    console.error('KYC status check error:', error);
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

      const eligibility = await bridge.validateROSCAEligibility(userAddress, parseInt(circleId));
      
      res.json({
        success: true,
        data: eligibility
      });

    } catch (error) {
      console.error('Eligibility check error:', error);
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
    const stats = {
      self: bridge.getSelfVerificationStats(),
      platform: await bridge.getPlatformStats(),
      health: await bridge.healthCheck()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

export default router;