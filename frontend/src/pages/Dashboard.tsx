export default function Dashboard() {
  const mockStats = {
    totalCircles: 247,
    activeCircles: 189,
    totalMembers: 1542,
    totalValueLocked: 2400000,
    successRate: 98.5,
    avgYield: 3.2
  };

  const mockRecentActivity = [
    { type: 'circle_created', user: '0x1234...5678', amount: 100, time: '2 hours ago' },
    { type: 'payment_made', user: '0x9876...5432', amount: 50, time: '4 hours ago' },
    { type: 'member_joined', user: '0x5555...7777', amount: 75, time: '6 hours ago' }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Platform Dashboard
      </h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#60A5FA', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {mockStats.totalCircles}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Total Circles</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#34D399', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {mockStats.activeCircles}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Active Circles</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#FBBF24', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {mockStats.totalMembers}
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Total Members</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#A78BFA', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            ${(mockStats.totalValueLocked / 1000000).toFixed(1)}M
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Total Value Locked</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#10B981', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {mockStats.successRate}%
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Success Rate</p>
        </div>

        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#F59E0B', fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {mockStats.avgYield}%
          </h3>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>Average Yield</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Recent Activity */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Recent Activity
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mockRecentActivity.map((activity, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '0.375rem'
              }}>
                <div>
                  <p style={{ color: 'white', fontWeight: '500', marginBottom: '0.25rem' }}>
                    {activity.type === 'circle_created' && 'New Circle Created'}
                    {activity.type === 'payment_made' && 'Payment Made'}
                    {activity.type === 'member_joined' && 'Member Joined'}
                  </p>
                  <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                    {activity.user} • {activity.amount} PYUSD
                  </p>
                </div>
                <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'rgba(30, 41, 59, 0.6)',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #475569'
        }}>
          <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Quick Actions
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#2563EB',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              Create New Circle
            </button>
            
            <button style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              Browse Circles
            </button>
            
            <button style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              View My Circles
            </button>
            
            <button style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}>
              Request PYUSD Faucet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}