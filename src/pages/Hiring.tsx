import { motion } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';

export default function Hiring() {
  const { companies, isLoading, error } = useCompanies();

  if (isLoading) {
    return <div className="p-8">Loading hiring data...</div>;
  }

  if (error) {
    return <div className="p-8 text-accent">Error loading hiring data.</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="dashboard-header">
        <h1>Hiring Insights</h1>
        <p className="text-muted">Analyze hiring velocity, trends, and role distributions.</p>
      </header>

      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <h2 className="card-title">Hiring Velocity Trends</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {companies.slice(0, 5).map(c => (
              <div key={String(c.company_id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>{c.name}</span>
                  <span className="text-secondary">{c.hiring_velocity}</span>
                </div>
                <div style={{ width: '100%', backgroundColor: 'var(--color-background)', height: '8px', borderRadius: '4px' }}>
                  <div style={{ 
                    width: c.hiring_velocity === 'High' ? '90%' : c.hiring_velocity === 'Medium' ? '50%' : '20%', 
                    backgroundColor: 'var(--color-secondary)', 
                    height: '100%', 
                    borderRadius: '4px' 
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Role Distribution Insights</h2>
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>Aggregated from focus sectors</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
            {Array.from(new Set(companies.flatMap(c => typeof c.focus_sectors === 'string' ? c.focus_sectors.split(/[,;]/).map(s => s.trim()) : (c.focus_sectors || [])))).slice(0, 8).map(sector => (
              <div key={sector} style={{ 
                padding: '1rem', 
                backgroundColor: 'rgba(14, 41, 49, 0.05)', 
                borderRadius: '8px',
                border: '1px solid rgba(14, 41, 49, 0.1)' 
              }}>
                <div style={{ fontWeight: 600 }}>{sector}</div>
                <div className="text-primary" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {companies.filter(c => {
                    const sectors = typeof c.focus_sectors === 'string' ? c.focus_sectors.split(/[,;]/).map(s => s.trim()) : (c.focus_sectors || []);
                    return sectors.includes(sector);
                  }).length * 15}%
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>of open roles</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
