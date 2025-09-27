import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { contractService } from '../services/contractService';

export default function CreateCircle() {
  const { address, connect } = useWallet();
  const [formData, setFormData] = useState({
    monthlyAmount: '',
    maxMembers: '5',
    duration: '12',
    country: 'IN',
    minAge: '18',
    maxAge: '65'
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      await connect();
      return;
    }

    setCreating(true);
    try {
      const receipt = await contractService.createCircle({
        monthlyAmount: formData.monthlyAmount,
        maxMembers: parseInt(formData.maxMembers),
        duration: parseInt(formData.duration),
        country: formData.country,
        minAge: parseInt(formData.minAge),
        maxAge: parseInt(formData.maxAge)
      });
      
      console.log('Circle created:', receipt);
      alert('Circle created successfully!');
    } catch (error) {
      console.error('Creation failed:', error);
      alert('Failed to create circle');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/" style={{ color: '#60A5FA', textDecoration: 'none' }}>← Back to Home</Link>
      </div>

      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Create ROSCA Circle
      </h1>
      
      {!address && (
        <div style={{ 
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid #3B82F6',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <p style={{ color: '#93C5FD', marginBottom: '1rem' }}>
            Connect your wallet to create a ROSCA circle
          </p>
          <button
            onClick={connect}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Connect Wallet
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ 
        backgroundColor: 'rgba(30, 41, 59, 0.6)', 
        padding: '2rem', 
        borderRadius: '0.5rem',
        border: '1px solid #475569'
      }}>
        {/* Rest of the form remains the same */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '0.5rem' }}>
            Monthly Amount (PYUSD)
          </label>
          <input
            type="number"
            value={formData.monthlyAmount}
            onChange={(e) => setFormData({...formData, monthlyAmount: e.target.value})}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1F2937',
              border: '1px solid #475569',
              borderRadius: '0.375rem',
              color: 'white'
            }}
            placeholder="Enter amount in PYUSD"
            required
          />
        </div>

        {/* Include other form fields here */}

        <button
          type="submit"
          disabled={creating}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: creating ? '#6B7280' : '#2563EB',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: creating ? 'not-allowed' : 'pointer'
          }}
        >
          {creating ? 'Creating...' : address ? 'Create ROSCA Circle' : 'Connect Wallet to Create'}
        </button>
      </form>
    </div>
  );
}