// Move dotenv config to THE VERY TOP
import { config } from 'dotenv';
config(); // ← This MUST be before any other imports that use process.env

// Now import everything else
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import routes (these will now have access to env vars)
import bridgeRoutes from './api/bridgeRoutes';
import selfRoutes from './api/selfRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Add this debug to verify env vars are loaded
console.log('🔍 Environment Variables Check:');
console.log('CELO_RPC_URL:', process.env.CELO_RPC_URL ? 'SET ✅' : 'MISSING ❌');
console.log('ETHEREUM_RPC_URL:', process.env.ETHEREUM_RPC_URL ? 'SET ✅' : 'MISSING ❌');
console.log('KYC_VERIFIER_ADDRESS:', process.env.KYC_VERIFIER_ADDRESS ? 'SET ✅' : 'MISSING ❌');
console.log('ROSCA_FACTORY_ADDRESS:', process.env.ROSCA_FACTORY_ADDRESS ? 'SET ✅' : 'MISSING ❌');

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalRateLimit);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    selfConfigId: process.env.SELF_CONFIG_ID
  });
});

// API routes
app.use('/api/bridge', bridgeRoutes);
app.use('/api/self', selfRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ROSCA-Guard Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Self verification: http://localhost:${PORT}/api/self/verify-self`);
  console.log(`🆔 Self Config ID: ${process.env.SELF_CONFIG_ID}`);
});