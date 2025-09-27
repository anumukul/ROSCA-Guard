export default function BrowseCircles() {
  const mockCircles = [
    {
      id: 1,
      monthlyAmount: 100,
      members: 3,
      maxMembers: 5,
      country: 'India',
      duration: 12,
      creator: '0x1234...5678'
    },
    {
      id: 2,
      monthlyAmount: 50,
      members: 2,
      maxMembers: 8,
      country: 'Global',
      duration: 6,
      creator: '0x9876...5432'
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Browse ROSCA Circles
      </h1>
      
      <p style={{ color: '#9CA3AF', marginBottom: '2rem' }}>
        Join existing circles or discover new saving opportunities
      </p>

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {mockCircles.map((circle) => (
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
                  {circle.monthlyAmount} PYUSD Monthly Circle
                </h3>
                <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                  Created by {circle.creator}
                </p>
              </div>
              <span style={{
                backgroundColor: '#059669',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '1rem',
                fontSize: '0.75rem'
              }}>
                Open
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Members</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{circle.members}/{circle.maxMembers}</p>
              </div>
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Duration</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{circle.duration} months</p>
              </div>
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Country</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{circle.country}</p>
              </div>
              <div>
                <p style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>Total Pool</p>
                <p style={{ color: 'white', fontWeight: '600' }}>{circle.monthlyAmount * circle.maxMembers} PYUSD</p>
              </div>
            </div>

            <button
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
            >
              Join Circle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}