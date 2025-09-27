
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { IdentificationIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useSelfVerification } from '../hooks/useSelfVerification';

export default function HomePage() {
  const { isVerified, verificationData, checkExistingVerification } = useSelfVerification();
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  useEffect(() => {
    checkExistingVerification();
  }, [checkExistingVerification]);

  return (
    <div>
      {/* Hero Section */}
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span style={{ 
              display: 'inline-block', 
              padding: '0.5rem 1rem', 
              backgroundColor: 'rgba(59, 130, 246, 0.2)', 
              color: '#93C5FD', 
              borderRadius: '20px',
              fontSize: '0.875rem'
            }}>
              Powered by Self Protocol & PYUSD
            </span>
          </div>
          
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem' 
          }}>
            ROSCA-Guard
          </h1>
          
          <h2 style={{ 
            fontSize: '1.25rem', 
            color: '#D1D5DB', 
            marginBottom: '2rem' 
          }}>
            Identity-Verified ROSCAs with PYUSD
          </h2>
          
          <p style={{ 
            color: '#9CA3AF', 
            marginBottom: '2rem', 
            lineHeight: '1.6' 
          }}>
            Join verified rotating savings and credit associations powered by Self Protocol's 
            zero-knowledge identity verification and automated PYUSD payments.
          </p>

          {/* Verification Status Banner */}
          {isVerified ? (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid #22C55E',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-green-400 font-medium">
                  Identity Verified ({verificationData?.verificationType === 'aadhaar' ? 'Aadhaar' : 'Passport'})
                </span>
              </div>
              <p className="text-green-200 text-sm mt-1">
                You can now create and join ROSCA circles
              </p>
            </div>
          ) : (
            <div style={{
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid #F59E0B',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem'
            }}>
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-400 font-medium">
                  Identity Verification Required
                </span>
              </div>
              <p className="text-yellow-200 text-sm mt-1">
                Complete KYC verification to access ROSCA circles
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isVerified ? (
              <>
                <Link 
                  to="/create" 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: '#2563EB', 
                    color: 'white', 
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Create ROSCA Circle
                </Link>
                <Link 
                  to="/browse" 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: '#059669', 
                    color: 'white', 
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Browse Circles
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/verify" 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: '#2563EB', 
                    color: 'white', 
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Verify Identity
                </Link>
                <Link 
                  to="/browse" 
                  style={{ 
                    padding: '0.75rem 1.5rem', 
                    backgroundColor: '#475569', 
                    color: 'white', 
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Learn More
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '3rem 2rem', 
        backgroundColor: 'rgba(30, 41, 59, 0.3)' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '2rem' 
          }}>
            <div style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.6)', 
              padding: '2rem', 
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <IdentificationIcon style={{ width: '2rem', height: '2rem', color: '#60A5FA', marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>KYC Verified</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Self Protocol zero-knowledge identity verification</p>
              <ul style={{ marginTop: '1rem', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Passport & Aadhaar support
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Privacy-preserving verification
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem' }}>
                  ✓ Sybil resistance built-in
                </li>
              </ul>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.6)', 
              padding: '2rem', 
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <BanknotesIcon style={{ width: '2rem', height: '2rem', color: '#34D399', marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>PYUSD Payments</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Automated stablecoin distributions</p>
              <ul style={{ marginTop: '1rem', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Automated monthly contributions
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Transparent payout system
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem' }}>
                  ✓ Low fees with yield bonuses
                </li>
              </ul>
            </div>
            
            <div style={{ 
              backgroundColor: 'rgba(30, 41, 59, 0.6)', 
              padding: '2rem', 
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}>
              <ShieldCheckIcon style={{ width: '2rem', height: '2rem', color: '#A78BFA', marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Cross-Chain Security</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>KYC on Celo, payments on Ethereum</p>
              <ul style={{ marginTop: '1rem', paddingLeft: '0', listStyle: 'none' }}>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Dual-chain architecture
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  ✓ Smart contract automation
                </li>
                <li style={{ color: '#34D399', fontSize: '0.875rem' }}>
                  ✓ Reputation-based selection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '3rem' 
          }}>
            How ROSCA-Guard Works
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '2rem' 
          }}>
            <div>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                backgroundColor: '#2563EB', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem auto' 
              }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>1</span>
              </div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>KYC Verification</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Complete identity verification using Self Protocol with passport or Aadhaar
              </p>
            </div>
            
            <div>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                backgroundColor: '#059669', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem auto' 
              }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>2</span>
              </div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Join/Create Circle</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Create new circles or join existing ones with verified members only
              </p>
            </div>
            
            <div>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                backgroundColor: '#D97706', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem auto' 
              }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>3</span>
              </div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Monthly Contributions</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Automated PYUSD contributions with smart contract enforcement
              </p>
            </div>
            
            <div>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                backgroundColor: '#7C3AED', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 1rem auto' 
              }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>4</span>
              </div>
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Receive Payout</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                Get your rotation payout with yield bonuses from DeFi protocols
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Types Section */}
      {!isVerified && (
        <div style={{ 
          padding: '3rem 2rem', 
          backgroundColor: 'rgba(30, 41, 59, 0.3)' 
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              Choose Your Verification Path
            </h2>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
              gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #475569',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#2563EB',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '1rem' }}>Global Access</h3>
                <p style={{ color: '#60A5FA', fontWeight: '500', marginBottom: '1rem' }}>Passport Verification</p>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Access global ROSCA circles using your passport for zero-knowledge identity verification
                </p>
                <Link
                  to="/verify"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#2563EB',
                    color: 'white',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Verify with Passport
                </Link>
              </div>

              <div style={{
                backgroundColor: 'rgba(30, 41, 59, 0.6)',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '1px solid #475569',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#EA580C',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <svg style={{ width: '2rem', height: '2rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '1rem' }}>India/Diaspora</h3>
                <p style={{ color: '#FB923C', fontWeight: '500', marginBottom: '1rem' }}>Aadhaar Verification</p>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  Access India-focused and diaspora circles using your Aadhaar for identity verification
                </p>
                <Link
                  to="/verify"
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#EA580C',
                    color: 'white',
                    borderRadius: '0.5rem',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Verify with Aadhaar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div style={{ 
        padding: '3rem 2rem', 
        backgroundColor: 'rgba(30, 41, 59, 0.3)', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '1rem' 
          }}>
            Solving Traditional ROSCA Trust Issues
          </h2>
          <p style={{ 
            color: '#D1D5DB', 
            marginBottom: '2rem' 
          }}>
            Secure, automated rotating savings circles with blockchain technology and identity verification
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/dashboard" 
              style={{ 
                display: 'inline-block', 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#475569', 
                color: 'white', 
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              View Platform Stats
            </Link>
            {!isVerified && (
              <Link 
                to="/verify" 
                style={{ 
                  display: 'inline-block', 
                  padding: '0.75rem 1.5rem', 
                  backgroundColor: '#2563EB', 
                  color: 'white', 
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}