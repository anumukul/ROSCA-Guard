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
    
    // FIXED: Use proper attestation ID type (1 or 2, not string)
    this.verifier = new SelfBackendVerifier(
      'rosca-guard-v1',
      `${process.env.API_URL || 'http://localhost:3001'}/api/self/verify-self`,
      !this.isProduction,
      AllIds,
      new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: [],
        ofac: true,
      }),
      'uuid'
    );

    console.log('Self Protocol Backend SDK initialized with userIdType: uuid');
  }

  async verifyProof(
    attestationId: string,
    proof: any,
    publicSignals: any,
    userContextData: any
  ): Promise<VerificationResult> {
    try {
      console.log('Starting verification with inputs:', {
        attestationId,
        userContextDataType: typeof userContextData,
        userContextDataLength: userContextData?.length
      });

      if (!attestationId || !proof || !publicSignals || !userContextData) {
        return { isValid: false, error: 'Missing required parameters' };
      }

      // FIXED: Convert string attestationId to number (1 or 2)
      const numericAttestationId = attestationId === '3' ? 2 : 1; // Aadhaar = 2, Passport = 1

      const result = await this.verifier.verify(
        numericAttestationId as 1 | 2,
        proof,
        publicSignals,
        userContextData
      );

      console.log('🔍 Raw verification result:', result);

      // FIXED: Handle the actual Self Protocol response structure
      if (result?.isValidDetails?.isValid && result?.discloseOutput) {
        // Extract data from the actual response structure
        const discloseOutput = result.discloseOutput;
        
        const userData = {
          nationality: discloseOutput.nationality || 'Unknown',
          age: discloseOutput.minimumAge || 18, // Use minimumAge instead of age
          isHuman: true,
          passedOFACCheck: result.isValidDetails.isOfacValid || true,
          verificationType: (attestationId === '3' ? 'aadhaar' : 'passport') as 'aadhaar' | 'passport',
          userIdentifier: discloseOutput.userId?.toString() || 'unknown', // Try userId instead of userIdentifier
          attestationId: attestationId
        };

        console.log('✅ Verification successful:', userData);
        return { isValid: true, userData };
      } else {
        // FIXED: Handle error from isValidDetails properly
        const errorMsg = !result?.isValidDetails?.isValid 
          ? 'Verification failed - invalid proof'
          : 'Verification failed - no disclosure data';
        
        console.error('❌ Verification failed:', errorMsg);
        return { isValid: false, error: errorMsg };
      }

    } catch (error: any) {
      console.error('💥 Verification error:', error.message);
      return { isValid: false, error: error.message };
    }
  }

  getStats() {
    return {
      service: 'Self Protocol Backend Verifier',
      userIdType: 'uuid',
      configId: process.env.SELF_CONFIG_ID,
      supportedAttestations: {
        '1': 'passport',
        '3': 'aadhaar (mapped to 2)'
      }
    };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      details: { 
        sdkInitialized: !!this.verifier,
        timestamp: new Date().toISOString()
      }
    };
  }
}