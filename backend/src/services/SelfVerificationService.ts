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
    
    // FIXED: Use UUID to match frontend
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
      'uuid' // CHANGED BACK: Match frontend UUID format
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

      const result = await this.verifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      if (result?.isValidDetails?.isValid && result?.discloseOutput) {
        const userData = {
          nationality: result.discloseOutput.nationality || 'Unknown',
          age: result.discloseOutput.olderThan || 18,
          isHuman: true,
          passedOFACCheck: true,
          verificationType: attestationId === '3' ? 'aadhaar' : 'passport',
          userIdentifier: result.discloseOutput.userIdentifier || 'unknown',
          attestationId: attestationId
        };

        console.log('Verification successful:', userData);
        return { isValid: true, userData };
      } else {
        const error = result?.isValidDetails?.invalidDetails || 'Verification failed';
        console.error('Verification failed:', error);
        return { isValid: false, error };
      }

    } catch (error: any) {
      console.error('Verification error:', error.message);
      return { isValid: false, error: error.message };
    }
  }

  getStats() {
    return {
      service: 'Self Protocol Backend Verifier',
      userIdType: 'address',
      configId: process.env.SELF_CONFIG_ID
    };
  }

  async healthCheck() {
    return {
      status: 'healthy',
      details: { sdkInitialized: !!this.verifier }
    };
  }
}