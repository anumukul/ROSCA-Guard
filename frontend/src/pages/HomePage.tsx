import { Link } from 'react-router-dom';
import { IdentificationIcon, BanknotesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
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

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/create" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#2563EB', 
                color: 'white', 
                borderRadius: '0.5rem',
                textDecoration: 'none'
              }}
            >
              Create ROSCA Circle
            </Link>
            <Link 
              to="/browse" 
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#475569', 
                color: 'white', 
                borderRadius: '0.5rem',
                textDecoration: 'none'
              }}
            >
              Browse Circles
            </Link>
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
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Complete identity verification using Self Protocol</p>
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
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Join Circle</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Create or join circles with verified members</p>
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
              <h3 style={{ color: 'white', fontWeight: '600', marginBottom: '0.5rem' }}>Monthly Payments</h3>
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Automated PYUSD contributions</p>
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
              <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Get your rotation payout</p>
            </div>
          </div>
        </div>
      </div>

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
            Secure, automated rotating savings circles with blockchain technology
          </p>
          <Link 
            to="/dashboard" 
            style={{ 
              display: 'inline-block', 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#2563EB', 
              color: 'white', 
              borderRadius: '0.5rem',
              textDecoration: 'none'
            }}
          >
            View Platform Stats
          </Link>
        </div>
      </div>
    </div>
  );
}