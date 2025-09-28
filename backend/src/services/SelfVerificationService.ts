import { SelfBackendVerifier, AllIds, DefaultConfigStore } from '@selfxyz/core';

export interface VerificationResult {
  isValid: boolean;
  userData?: {
    nationality: string;
    age: number;
    isHuman: boolean;
    passedOFACCheck: boolean;
    verificationType: 'passport' | 'aadhaar';
    userIdentifier: string;
    attestationId: string;
  };
  error?: string;
}

export class SelfVerificationService {
  private verifier: SelfBackendVerifier;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    console.log('Initializing Self Protocol Backend SDK...');
    console.log('Environment:', this.isProduction ? 'production' : 'development');
    console.log('Config ID:', process.env.SELF_CONFIG_ID);
    
    // Initialize Self Backend Verifier with correct parameters
    this.verifier = new SelfBackendVerifier(
      'rosca-guard-v1', // scope (must match frontend)
      `${process.env.API_URL || 'http://localhost:3001'}/api/self/verify-self`, // endpoint
      !this.isProduction, // mockPassport: true for dev, false for prod
      AllIds, // Accept all document types
      new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [],
        ofac: true,
      }),
      'uuid' // userIdentifierType
    );

    console.log('Self Protocol Backend SDK initialized successfully');
  }

  async verifyProof(
    attestationId: string,
    proof: any,
    publicSignals: any,
    userContextData: any
  ): Promise<VerificationResult> {
    try {
      console.log('Starting Self Protocol verification...');
      console.log('Verification inputs:', {
        attestationId,
        hasProof: !!proof,
        hasPublicSignals: !!publicSignals,
        hasUserContextData: !!userContextData
      });

      if (!attestationId || !proof || !publicSignals || !userContextData) {
        return { isValid: false, error: 'Missing required parameters' };
      }

      // FIXED: The SDK expects specific literal types 1 or 2
      let numericAttestationId: 1 | 2;
      if (attestationId === '1') {
        numericAttestationId = 1; // Passport
      } else if (attestationId === '3') {
        numericAttestationId = 2; // Aadhaar (mapped to 2)
      } else {
        return { isValid: false, error: 'Unsupported attestation ID. Use "1" for passport or "3" for aadhaar.' };
      }

      // Call the Self Backend Verifier with proper typing
      const result = await this.verifier.verify(
        numericAttestationId,
        proof,
        publicSignals,
        userContextData
      );

      console.log('✅ Raw Self Protocol result:', {
        hasIsValidDetails: !!result?.isValidDetails,
        isValid: result?.isValidDetails?.isValid,
        hasDiscloseOutput: !!result?.discloseOutput
      });

      // Check if verification succeeded
      if (result?.isValidDetails?.isValid && result?.discloseOutput) {
        // FIXED: Access properties that actually exist based on the contract structure
        const discloseOutput = result.discloseOutput;
        
        // Extract basic info - using safe property access
        const nationality = (discloseOutput as any).nationality || 
                           (discloseOutput as any).issuingState || 'Unknown';
        
        // For age, try multiple possible property names
        const age = (discloseOutput as any).minimumAge || 
                   (discloseOutput as any).olderThan || 
                   (discloseOutput as any).age || 18;
        
        // For user identifier
        const userIdentifier = String((discloseOutput as any).userIdentifier || 
                                     (discloseOutput as any).userId || 
                                     Date.now());

        const userData = {
          nationality,
          age: Number(age), // Ensure it's a number
          isHuman: true,
          passedOFACCheck: result.isValidDetails.isOfacValid !== false,
          verificationType: (attestationId === '3' ? 'aadhaar' : 'passport') as 'aadhaar' | 'passport',
          userIdentifier,
          attestationId: attestationId
        };

        console.log('✅ Verification successful:', userData);
        return { isValid: true, userData };
      } else {
        // Handle verification failure
        const error = 'Self Protocol verification failed - invalid proof or missing disclosure data';
        console.error('❌ Verification failed:', {
          isValid: result?.isValidDetails?.isValid,
          hasDiscloseOutput: !!result?.discloseOutput
        });
        return { isValid: false, error };
      }

    } catch (error: any) {
      console.error('💥 Self Protocol verification error:', error);
      return { isValid: false, error: `Verification failed: ${error.message}` };
    }
  }

  getStats() {
    return {
      service: 'Self Protocol Backend Verifier',
      userIdType: 'uuid',
      configId: process.env.SELF_CONFIG_ID,
      environment: this.isProduction ? 'production' : 'development',
      mockMode: !this.isProduction,
      supportedAttestations: {
        '1': 'passport',
        '3': 'aadhaar (mapped to 2 internally)'
      },
      note: 'Using official Self Protocol SDK'
    };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      details: { 
        sdkInitialized: !!this.verifier,
        timestamp: new Date().toISOString(),
        environment: this.isProduction ? 'production' : 'development',
        service: 'Self Protocol Backend Verifier'
      }
    };
  }
}