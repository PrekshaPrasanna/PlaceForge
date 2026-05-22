import { motion } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';

export default function Analytics() {
  const { companies, isLoading, error } = useCompanies();

  if (isLoading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-8 text-accent">Error loading analytics data.</div>;
  }

  // Dynamic aggregation
  const categories = companies.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const total = companies.length || 1; // avoid division by zero

  const productCount = companies.filter(c => c.category === 'Product Companies').length;
  const serviceCount = companies.filter(c => c.category === 'Service Companies').length;
  const prodServTotal = productCount + serviceCount || 1;
  const prodPct = Math.round((productCount / prodServTotal) * 100);
  const servPct = Math.round((serviceCount / prodServTotal) * 100);

  const startupCount = companies.filter(c => c.category === 'Startups').length;
  const enterpriseCount = companies.filter(c => c.category === 'Tech Giants').length;
  const startEntTotal = startupCount + enterpriseCount || 1;
  const startupPct = Math.round((startupCount / startEntTotal) * 100);
  const enterprisePct = Math.round((enterpriseCount / startEntTotal) * 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="dashboard-header">
        <h1>Analytics Dashboard</h1>
        <p className="text-muted">High-level ecosystem metrics and insights dynamically fetched from Supabase.</p>
      </header>

      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="card-title">Category Distribution</h2>
          <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginTop: '1rem' }}>
            {Object.entries(categories).map(([cat, count], i) => (
              <div 
                key={cat} 
                style={{ 
                  width: `${(count / total) * 100}%`, 
                  backgroundColor: ['var(--color-primary-dark)', 'var(--color-primary)', 'var(--color-accent-2)', 'var(--color-accent-1)'][i % 4],
                  height: '100%'
                }}
                title={`${cat}: ${count}`}
              ></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.875rem' }}>
            {Object.entries(categories).map(([cat, count], i) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  width: '12px', height: '12px', borderRadius: '50%', 
                  backgroundColor: ['var(--color-primary-dark)', 'var(--color-primary)', 'var(--color-accent-2)', 'var(--color-accent-1)'][i % 4] 
                }}></span>
                {cat} ({Math.round((count/total)*100)}%)
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Product vs Service</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '2rem', marginTop: '1rem' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '100%', height: `${prodPct}%`, backgroundColor: 'var(--color-accent-2)', borderRadius: '8px 8px 0 0', minHeight: '10px' }}></div>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Product ({prodPct}%)</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '100%', height: `${servPct}%`, backgroundColor: 'var(--color-primary-dark)', borderRadius: '8px 8px 0 0', minHeight: '10px' }}></div>
              <span className="text-muted" style={{ fontSize: '0.875rem' }}>Service ({servPct}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2 className="card-title">Startup vs Enterprise</h2>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent-1)' }}>{startupPct}%</div>
              <div className="text-muted">Startups</div>
            </div>
            <div style={{ width: '1px', height: '80px', backgroundColor: 'var(--glass-border)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--color-accent-2)' }}>{enterprisePct}%</div>
              <div className="text-muted">Enterprise</div>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="card-title">Hiring Velocity Distribution</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {['High', 'Medium', 'Low'].map(velocity => {
              const count = companies.filter(c => c.hiring_velocity === velocity).length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={velocity}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{velocity}</span> <span>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, backgroundColor: velocity === 'High' ? 'var(--color-accent-2)' : velocity === 'Medium' ? 'var(--color-accent-4)' : 'var(--color-accent-1)', height: '100%' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
