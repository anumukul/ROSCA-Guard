import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { CrossChainBridge } from '../services/CrossChainBridge';

const router = express.Router();

const bridge = new CrossChainBridge(
  process.env.CELO_RPC_URL!,
  process.env.ETHEREUM_RPC_URL!,
  process.env.KYC_VERIFIER_ADDRESS!,
  process.env.ROSCA_FACTORY_ADDRESS!
);

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await bridge.healthCheck();
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Bridge health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

// Get platform statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await bridge.getPlatformStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch platform stats'
    });
  }
});

// Create ROSCA Circle (basic endpoint)
router.post('/create-circle',
  [
    body('monthlyAmount').isNumeric().withMessage('Monthly amount must be a number'),
    body('maxMembers').isInt({ min: 2, max: 20 }).withMessage('Max members must be between 2 and 20'),
    body('duration').isInt({ min: 1, max: 36 }).withMessage('Duration must be between 1 and 36 months'),
    body('country').isString().withMessage('Country is required'),
    body('minAge').isInt({ min: 18 }).withMessage('Minimum age must be at least 18'),
    body('maxAge').isInt({ max: 100 }).withMessage('Maximum age cannot exceed 100'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      // This would typically create a circle through the factory contract
      // For now, return a success response
      res.json({
        success: true,
        message: 'Circle creation endpoint ready',
        data: req.body
      });

    } catch (error) {
      console.error('Create circle error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create circle'
      });
    }
  }
);

// Get circle information
router.get('/circle/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // This would typically fetch circle data from the contract
    res.json({
      success: true,
      message: 'Circle info endpoint ready',
      circleId: id
    });

  } catch (error) {
    console.error('Get circle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get circle information'
    });
  }
});

// Batch eligibility check
router.post('/batch-eligibility',
  [
    body('userAddresses').isArray().withMessage('User addresses must be an array'),
    body('circleId').isInt({ min: 0 }).withMessage('Valid circle ID is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { userAddresses, circleId } = req.body;

      const results = await bridge.batchCheckEligibility(userAddresses, circleId);
      
      res.json({
        success: true,
        data: Object.fromEntries(results)
      });

    } catch (error) {
      console.error('Batch eligibility check error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check batch eligibility'
      });
    }
  }
);

// Get contract configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await bridge.getContractConfig();
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration'
    });
  }
});

export default router;