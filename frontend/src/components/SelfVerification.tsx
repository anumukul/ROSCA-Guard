import React, { useState, useEffect } from 'react';
import { SelfAppBuilder, SelfQRcodeWrapper, type SelfApp } from '@selfxyz/qrcode';
import { getUniversalLink } from '@selfxyz/core';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';

interface SelfVerificationProps {
  onVerificationSuccess: (verificationData: any) => void;
  onError: (error: string) => void;
}

export default function SelfVerification({ onVerificationSuccess, onError }: SelfVerificationProps) {
  const [verificationType, setVerificationType] = useState<'passport' | 'aadhaar' | null>(null);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState<string>('');
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [userId] = useState(() => ethers.utils.hexlify(ethers.utils.randomBytes(16)));

  useEffect(() => {
    if (!verificationType) return;

    try {
      console.log('🔧 Initializing Self Protocol SDK...');
      console.log('Config ID:', process.env.REACT_APP_SELF_CONFIG_ID);
      console.log('Verification Type:', verificationType);

      // Configure disclosures based on verification type
      const disclosures = verificationType === 'aadhaar' 
        ? {
            // Aadhaar-specific disclosures
            minimumAge: 18,
            nationality: true,
            excludedCountries: [], // India typically doesn't exclude countries for Aadhaar users
            ofac: true,
            // Add specific Aadhaar requirements if needed
          }
        : {
            // Passport disclosures
            minimumAge: 18,
            nationality: true,
            excludedCountries: ['IRN', 'PRK', 'RUS', 'SYR'], // Exclude sanctioned countries
            ofac: true,
            // Add specific passport requirements if needed
          };

      console.log('📋 Disclosures configuration:', disclosures);

      // Create the REAL Self App using official SDK
      const app = new SelfAppBuilder({
        appName: "ROSCA-Guard Identity Verification",
        scope: "rosca-guard-v1", // Must match backend scope exactly
        endpoint: `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/self/verify-self`,
        userId: userId,
        version: 2, // Use version 2 for latest features
        userDefinedData: Buffer.from(JSON.stringify({
          action: verificationType === 'aadhaar' ? 'aadhaar_verification' : 'passport_verification',
          platform: 'rosca-guard',
          timestamp: Date.now(),
          verificationType,
          configId: process.env.REACT_APP_SELF_CONFIG_ID
        })).toString('hex').padEnd(128, '0'), // Ensure proper padding
        disclosures
      }).build();

      console.log('✅ Self App created successfully');
      setSelfApp(app);

      // Generate universal link for mobile deep linking
      const link = getUniversalLink(app);
      setUniversalLink(link);
      console.log('🔗 Universal link generated:', link);

    } catch (error) {
      console.error('💥 Error initializing Self app:', error);
      onError(`Failed to initialize verification: ${error.message}`);
    }
  }, [verificationType, userId, onError]);

  const handleVerificationSuccess = async (verificationResult: any) => {
    console.log('🎉 Verification successful:', verificationResult);
    setVerificationStatus('success');
    
    const successMessage = verificationType === 'aadhaar' 
      ? 'Aadhaar verification successful! You can now access India/Diaspora circles.'
      : 'Passport verification successful! You can now access global circles.';
    
    toast.success(successMessage);
    
    // Pass verification data to parent component with additional context
    onVerificationSuccess({
      verificationType,
      userId,
      timestamp: Date.now(),
      ...verificationResult
    });
  };

  const handleVerificationError = (error: any) => {
    console.error('❌ Verification error:', error);
    setVerificationStatus('failed');
    
    let errorMessage = 'Verification failed. ';
    
    if (error?.message) {
      if (error.message.includes('timeout')) {
        errorMessage += 'The verification timed out. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('cancelled')) {
        errorMessage += 'Verification was cancelled.';
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += 'Please ensure you have the Self app installed and try again.';
    }
    
    toast.error(errorMessage);
    onError(errorMessage);
  };

  const resetVerification = () => {
    setVerificationType(null);
    setSelfApp(null);
    setUniversalLink('');
    setVerificationStatus('idle');
  };

  if (verificationStatus === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">Verification Complete!</h3>
        <p className="text-gray-300">
          Your identity has been verified with {verificationType === 'aadhaar' ? 'Aadhaar' : 'Passport'}.
        </p>
        <div className="space-y-2 text-sm text-gray-400">
          <p>✅ Identity verified through Self Protocol</p>
          <p>✅ Zero-knowledge proof generated</p>
          <p>✅ Ready to join ROSCA circles</p>
        </div>
        <button
          onClick={resetVerification}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Verify Another Document
        </button>
      </div>
    );
  }

  if (!verificationType) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Choose Your Verification Method
          </h2>
          <p className="text-gray-300">
            Select how you'd like to verify your identity to join ROSCA circles
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Passport Verification */}
          <div 
            onClick={() => setVerificationType('passport')}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 cursor-pointer transition-all hover:bg-slate-750"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Global Access</h3>
                <p className="text-blue-400 text-sm">Passport Verification</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Access global ROSCA circles</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Zero-knowledge passport verification</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>International participation</span>
              </li>
            </ul>
          </div>

          {/* Aadhaar Verification */}
          <div 
            onClick={() => setVerificationType('aadhaar')}
            className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-orange-500 cursor-pointer transition-all hover:bg-slate-750"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">India/Diaspora</h3>
                <p className="text-orange-400 text-sm">Aadhaar Verification</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Access India-focused circles</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Zero-knowledge Aadhaar verification</span>
              </li>
              <li className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Diaspora community access</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-blue-400 font-medium">Download Self App First</h4>
              <p className="text-blue-200 text-sm mt-1">
                Make sure you have the Self app installed on your mobile device before proceeding.
              </p>
              <div className="flex space-x-4 mt-2">
                <a 
                  href="https://apps.apple.com/app/self-identity-verification/id6443934390" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs underline"
                >
                  📱 iOS App Store
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.proofofpassportapp" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-300 hover:text-blue-200 text-xs underline"
                >
                  🤖 Google Play Store
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-6">
        <button
          onClick={resetVerification}
          className="mb-4 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to verification options</span>
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2">
          {verificationType === 'aadhaar' ? 'Aadhaar' : 'Passport'} Verification
        </h2>
        <p className="text-gray-300 text-sm">
          Scan the QR code with your Self app to verify your identity
        </p>
      </div>

      {selfApp && (
        <div className="space-y-6">
          {/* REAL Self Protocol QR Code Component */}
          <div className="bg-white p-6 rounded-xl">
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleVerificationSuccess}
              onError={handleVerificationError}
              size={280}
              // Optional: Add styling props
              style={{
                width: '100%',
                height: 'auto'
              }}
            />
          </div>

          {/* Verification Status */}
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-lg">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 text-sm font-medium">
                Self Protocol - Waiting for verification...
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
              <span className="text-gray-300 text-sm">Open the Self app on your mobile device</span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
              <span className="text-gray-300 text-sm">
                Scan the QR code above with your Self app
              </span>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
              <span className="text-gray-300 text-sm">
                Scan your {verificationType === 'aadhaar' ? 'Aadhaar card' : 'passport'} with NFC
              </span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
              <span className="text-gray-300 text-sm">Generate and submit your zero-knowledge proof</span>
            </div>
          </div>

          {/* Mobile Deep Link */}
          {universalLink && (
            <div className="text-center">
              <a
                href={universalLink}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>Open in Self App</span>
              </a>
              <p className="text-xs text-gray-400 mt-1">
                Click if scanning QR code doesn't work
              </p>
            </div>
          )}

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 p-2 bg-gray-900 rounded">
              <div>Config ID: {process.env.REACT_APP_SELF_CONFIG_ID}</div>
              <div>User ID: {userId}</div>
              <div>Verification Type: {verificationType}</div>
              <div>Endpoint: {process.env.REACT_APP_API_URL}/api/self/verify-self</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}