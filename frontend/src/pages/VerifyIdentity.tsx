import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SelfVerification from '../components/SelfVerification';
import { useSelfVerification } from '../hooks/useSelfVerification';

export default function VerifyIdentity() {
  const {
    verificationData,
    isVerified,
    handleVerificationSuccess,
    handleVerificationError,
    clearVerification,
    checkExistingVerification
  } = useSelfVerification();

  useEffect(() => {
    checkExistingVerification();
  }, [checkExistingVerification]);

  if (isVerified && verificationData) {
    return (
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '2rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">Identity Verified!</h1>
          
          <div className="space-y-2 mb-6">
            <p className="text-gray-300">
              Verification Type: <span className="text-white font-semibold capitalize">{verificationData.verificationType}</span>
            </p>
            <p className="text-gray-300">
              Nationality: <span className="text-white font-semibold">{verificationData.nationality}</span>
            </p>
            <p className="text-gray-300">
              Age: <span className="text-white font-semibold">{verificationData.age}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/create"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create ROSCA Circle
            </Link>
            <Link
              to="/browse"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Circles
            </Link>
            <button
              onClick={clearVerification}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Re-verify Identity
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#60A5FA', textDecoration: 'none' }}>← Back to Home</Link>
      </div>

      <div style={{
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        padding: '2rem',
        borderRadius: '0.5rem',
        border: '1px solid #475569'
      }}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">Verify Your Identity</h1>
          <p className="text-gray-300">
            Complete KYC verification using Self Protocol to access ROSCA circles
          </p>
        </div>

        <SelfVerification
          onVerificationSuccess={handleVerificationSuccess}
          onError={handleVerificationError}
        />
      </div>
    </div>
  );
}