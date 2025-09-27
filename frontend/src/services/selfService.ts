import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface SelfVerificationData {
  attestationId: string;
  proof: any;
  publicSignals: any;
  userContextData: any;
}

export interface VerificationResult {
  success: boolean;
  verified: boolean;
  data?: {
    nationality: string;
    age: number;
    verificationType: 'passport' | 'aadhaar';
    isHuman: boolean;
    passedOFACCheck: boolean;
    userIdentifier: string;
    attestationId: string;
  };
  error?: string;
}

class SelfService {
  private apiClient;

  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_URL}/api/self`,
      timeout: 60000, // Increased timeout for verification
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Enhanced response interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log('✅ Self Service API Response:', response.status, response.data?.success);
        return response;
      },
      (error) => {
        console.error('❌ Self Service API Error:', {
          status: error.response?.status,
          message: error.response?.data?.error || error.message,
          url: error.config?.url
        });
        throw error;
      }
    );

    // Request interceptor for debugging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log('📡 Self Service API Request:', config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error('💥 Self Service Request Error:', error);
        throw error;
      }
    );
  }

  // Verify Self Protocol proof using REAL backend SDK
  async verifySelfProof(verificationData: SelfVerificationData): Promise<VerificationResult> {
    try {
      console.log('🔍 Sending verification request to backend...');
      console.log('📊 Verification data summary:', {
        hasAttestationId: !!verificationData.attestationId,
        hasProof: !!verificationData.proof,
        hasPublicSignals: !!verificationData.publicSignals,
        hasUserContextData: !!verificationData.userContextData,
        attestationId: verificationData.attestationId
      });

      const response = await this.apiClient.post('/verify-self', verificationData);
      
      console.log('✅ Verification response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Verification request failed:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Verification request failed';
      
      return {
        success: false,
        verified: false,
        error: errorMessage
      };
    }
  }

  // Get user's KYC status from blockchain
  async getKYCStatus(userAddress: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Checking KYC status for:', userAddress);
      const response = await this.apiClient.get(`/kyc-status/${userAddress}`);
      console.log('✅ KYC status retrieved:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ KYC status check failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get KYC status'
      };
    }
  }

  // Check ROSCA eligibility
  async checkEligibility(
    userAddress: string,
    circleId: number
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Checking eligibility for circle:', { userAddress, circleId });
      const response = await this.apiClient.post('/check-eligibility', {
        userAddress,
        circleId
      });
      console.log('✅ Eligibility check result:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Eligibility check failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check eligibility'
      };
    }
  }

  // Get verification service statistics
  async getStats(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.apiClient.get('/stats');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get stats'
      };
    }
  }
}

export const selfService = new SelfService();