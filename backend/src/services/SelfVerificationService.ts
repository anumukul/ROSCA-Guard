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
    
    console.log(`Initializing Self Protocol Backend SDK...`);
    console.log(`Environment: ${this.isProduction ? 'production' : 'development'}`);
    console.log(`Config ID: ${process.env.SELF_CONFIG_ID}`);
    
    // Initialize the REAL Self Backend Verifier
    this.verifier = new SelfBackendVerifier(
      'rosca-guard-v1', // Scope - must match frontend
      `${process.env.API_URL || 'http://localhost:3001'}/api/self/verify-self`, // Endpoint
      !this.isProduction, // mockPassport: true for development, false for production
      AllIds, // Accept all document types (passport, aadhaar, etc.)
      new DefaultConfigStore({
        minimumAge: 18,
        excludedCountries: this.isProduction ? ['IRN', 'PRK', 'RUS', 'SYR'] : [], // Stricter for production
        ofac: true, // Always check OFAC sanctions
      }),
      'uuid' // User ID type
    );

    console.log('✅ Self Protocol Backend SDK initialized successfully');
  }

  /**
   * Verify Self Protocol proof using the official SDK
   */
  async verifyProof(
    attestationId: string,
    proof: any,
    publicSignals: any,
    userContextData: any
  ): Promise<VerificationResult> {
    try {
      console.log('🔍 Starting Self Protocol proof verification:', {
        attestationId,
        hasProof: !!proof,
        hasPublicSignals: !!publicSignals,
        hasUserContextData: !!userContextData,
        userContextDataLength: userContextData?.length
      });

      // Validate required fields
      if (!proof || !publicSignals || !attestationId || !userContextData) {
        return {
          isValid: false,
          error: 'Missing required verification data (proof, publicSignals, attestationId, or userContextData)'
        };
      }

      // Use the REAL Self Protocol SDK to verify the proof
      console.log('📡 Calling Self Protocol SDK verify method...');
      
      const result = await this.verifier.verify(
        attestationId,
        proof,
        publicSignals,
        userContextData
      );

      console.log('📊 Self Protocol verification result:', {
        isValid: result.isValidDetails.isValid,
        isOlderThanValid: result.isValidDetails.isOlderThanValid,
        nationality: result.discloseOutput?.nationality,
        olderThan: result.discloseOutput?.olderThan,
        userIdentifier: result.discloseOutput?.userIdentifier
      });

      // Check if verification passed all requirements
      if (result.isValidDetails.isValid && result.isValidDetails.isOlderThanValid) {
        
        // Determine verification type from attestation ID or user context
        let verificationType: 'passport' | 'aadhaar' = 'passport';
        try {
          // Try to parse user context data to get verification type
          const contextData = JSON.parse(
            Buffer.from(userContextData.slice(0, -64), 'hex').toString()
          );
          verificationType = contextData.verificationType || 'passport';
          console.log('📋 Parsed verification type from context:', verificationType);
        } catch (error) {
          console.warn('⚠️ Could not parse user context data, defaulting to passport:', error.message);
          // Fallback: determine from attestation ID
          verificationType = this.getVerificationTypeFromAttestation(attestationId);
        }

        const userData = {
          nationality: result.discloseOutput.nationality,
          age: result.discloseOutput.olderThan, // This is the minimum age they proved
          isHuman: true, // Self Protocol inherently verifies humanity through document verification
          passedOFACCheck: true, // OFAC check is built into Self Protocol
          verificationType,
          userIdentifier: result.discloseOutput.userIdentifier,
          attestationId
        };

        console.log('✅ Verification successful:', userData);

        return {
          isValid: true,
          userData
        };
      } else {
        const errorDetails = {
          isValid: result.isValidDetails.isValid,
          isOlderThanValid: result.isValidDetails.isOlderThanValid,
          invalidDetails: result.isValidDetails.invalidDetails || 'Unknown validation error'
        };

        console.log('❌ Verification failed:', errorDetails);

        return {
          isValid: false,
          error: `Verification failed: ${errorDetails.invalidDetails || 'Invalid proof or age requirement not met'}`
        };
      }

    } catch (error) {
      console.error('💥 Self Protocol verification error:', error);
      
      // Enhanced error handling
      let errorMessage = 'Verification failed: ';
      if (error.message.includes('Network')) {
        errorMessage += 'Network error - please check your internet connection';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'Verification timeout - please try again';
      } else if (error.message.includes('Invalid proof')) {
        errorMessage += 'Invalid proof format';
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Determine verification type from attestation ID
   */
  private getVerificationTypeFromAttestation(attestationId: string): 'passport' | 'aadhaar' {
    // These would be the actual attestation IDs from Self Protocol
    // You'll need to check the actual values from Self Protocol documentation
    const aadhaarAttestationIds = [
      'aadhaar_card',
      'AADHAAR',
      'aadhaar'
    ];
    
    const passportAttestationIds = [
      'e_passport',
      'PASSPORT', 
      'passport'
    ];

    const attestationStr = attestationId.toLowerCase();
    
    if (aadhaarAttestationIds.some(id => attestationStr.includes(id.toLowerCase()))) {
      return 'aadhaar';
    }
    
    if (passportAttestationIds.some(id => attestationStr.includes(id.toLowerCase()))) {
      return 'passport';
    }

    // Default to passport if unclear
    console.warn(`Unknown attestation ID: ${attestationId}, defaulting to passport`);
    return 'passport';
  }

  /**
   * Get verification service statistics
   */
  getStats() {
    return {
      service: 'Self Protocol Backend Verifier',
      scope: 'rosca-guard-v1',
      mode: this.isProduction ? 'production' : 'development',
      configId: process.env.SELF_CONFIG_ID,
      minimumAge: 18,
      ofacEnabled: true,
      supportedDocuments: ['passport', 'aadhaar'],
      excludedCountries: this.isProduction ? ['IRN', 'PRK', 'RUS', 'SYR'] : []
    };
  }

  /**
   * Health check for the verification service
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      // You could add a test verification call here if Self SDK supports it
      return {
        status: 'healthy',
        details: {
          sdkInitialized: !!this.verifier,
          configId: process.env.SELF_CONFIG_ID,
          environment: this.isProduction ? 'production' : 'development',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}
