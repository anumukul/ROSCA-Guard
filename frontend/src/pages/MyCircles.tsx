import { Link } from 'react-router-dom';

export default function MyCircles() {
  const mockUserCircles = [
    {
      id: 1,
      monthlyAmount: 100,
      currentMembers: 5,
      maxMembers: 5,
      currentRound: 3,
      totalRounds: 5,
      status: 'active',
      nextPayment: '2024-02-15',
      myTurn: false,
      role: 'member'
    },
    {
      id: 2,
      monthlyAmount: 50,
      currentMembers: 3,
      maxMembers: 8,
      currentRound: 1,
      totalRounds: 8,
      status: 'waiting',
      nextPayment: null,
      myTurn: false,
      role: 'creator'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          My ROSCA Circles
        </h1>
        <p style={{ color: '#9CA3AF' }}>
          Manage your active and pending ROSCA circles
        </p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <Link
          to="/create"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#2563EB',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.375rem',
            fontWeight: '600'
          }}
        >
          Create New Circle
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {mockUserCircles.map((circle) => (
          <div
            key={circle.id}
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.6)',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #475569'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {circle.monthlyAmount} PYUSD Circle
                </h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{
                    backgroundColor: circle.role === 'creator' ? '#7C3AED' : '#059669',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    {circle.role === 'creator' ? 'Creator' : 'Member'}
                  </span>
                  <span style={{
                    backgroundColor: circle.status === 'active' ? '#059669' : '#D97706',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem'
                  }}>
                    {circle.status === 'active' ? 'Active' : 'Waiting for Members'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Progress</p>
                <p style={{ color: 'white', fontWeight: '600' }}>
                  Round {circle.currentRound} of {circle.totalRounds}
                </p>
                <div style={{
                  width: '100%',
                  height: '0.25rem',
                  backgroundColor: '#374151',
                  borderRadius: '0.125rem',
                  marginTop: '0.25rem'
                }}>
                  <div style={{
                    width: `${(circle.currentRound / circle.totalRounds) * 100}%`,
                    height: '100%',
                    backgroundColor: '#2563EB',
                    borderRadius: '0.125rem'
                  }}></div>
                </div>
              </div>
              
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Members</p>
                <p style={{ color: 'white', fontWeight: '600' }}>
                  {circle.currentMembers}/{circle.maxMembers}
                </p>
              </div>
              
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Next Payment</p>
                <p style={{ color: 'white', fontWeight: '600' }}>
                  {circle.nextPayment || 'Pending'}
                </p>
              </div>
              
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Total Pool</p>
                <p style={{ color: 'white', fontWeight: '600' }}>
                  {circle.monthlyAmount * circle.maxMembers} PYUSD
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                View Details
              </button>
              
              {circle.status === 'active' && (
                <button
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Make Payment
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {mockUserCircles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>No Circles Yet</h3>
          <p style={{ color: '#9CA3AF', marginBottom: '1.5rem' }}>
            You haven't joined any ROSCA circles yet. Create one or browse existing circles to get started.
          </p>
          <Link
            to="/browse"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#2563EB',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '0.375rem'
            }}
          >
            Browse Circles
          </Link>
        </div>
      )}
    </div>
  );
}