import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface VerificationData {
  verificationType: 'passport' | 'aadhaar';
  userId: string;
  nationality: string;
  age: number;
  isVerified: boolean;
}

export function useSelfVerification() {
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerificationSuccess = useCallback((data: VerificationData) => {
    setVerificationData(data);
    setIsVerified(true);
    setLoading(false);
    
    // Store in localStorage for persistence
    localStorage.setItem('rosca_verification', JSON.stringify(data));
    
    toast.success('Identity verification successful!');
  }, []);

  const handleVerificationError = useCallback((error: string) => {
    setLoading(false);
    toast.error(error);
  }, []);

  const clearVerification = useCallback(() => {
    setVerificationData(null);
    setIsVerified(false);
    localStorage.removeItem('rosca_verification');
  }, []);

  // Check for existing verification on mount
  const checkExistingVerification = useCallback(() => {
    const stored = localStorage.getItem('rosca_verification');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setVerificationData(data);
        setIsVerified(true);
      } catch (error) {
        console.error('Error parsing stored verification:', error);
        localStorage.removeItem('rosca_verification');
      }
    }
  }, []);

  return {
    verificationData,
    isVerified,
    loading,
    handleVerificationSuccess,
    handleVerificationError,
    clearVerification,
    checkExistingVerification
  };
}