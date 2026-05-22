import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Building2, TrendingUp, Activity, ChevronRight, Zap } from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { companies, isLoading, error } = useCompanies();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="p-8">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="p-8 text-accent">Error loading dashboard data.</div>;
  }

  const topCategory = companies.length > 0 
    ? Object.entries(companies.reduce((acc, c) => ({...acc, [c.category]: (acc[c.category] || 0) + 1}), {} as Record<string, number>))
        .sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  const highVelocityCount = companies.filter(c => c.hiring_velocity === 'High').length;
  const velocityPercentage = companies.length > 0 ? Math.round((highVelocityCount / companies.length) * 100) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if(searchTerm) navigate(`/explore?search=${searchTerm}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <header className="dashboard-header" style={{ textAlign: 'center', margin: '4rem 0 6rem' }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
          <span className="badge badge-accent" style={{ marginBottom: '1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', padding: '0.5rem 1.5rem', border: '1px solid rgba(255,51,102,0.3)', boxShadow: '0 0 20px rgba(255,51,102,0.2)' }}>
            <Zap size={16} /> Data-Driven Intelligence Platform
          </span>
        </motion.div>
        
        <h1 style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '5.5rem', marginBottom: '1.5rem', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
          Accelerate Your <br />
          <span className="text-high-contrast">Placement Journey</span>
        </h1>
        
        <p className="text-muted" style={{ margin: '0 auto 3rem', fontSize: '1.4rem', maxWidth: '800px', fontWeight: 300 }}>
          Explore insights into top companies, map your skills against industry demands, and negotiate your future with absolute confidence.
        </p>

        <form onSubmit={handleSearch} style={{ maxWidth: '800px', margin: '0 auto 4rem', position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent-2)' }} size={24} />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search companies by name, tech stack, or focus sectors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ fontSize: '1.2rem', padding: '1.5rem 2rem 1.5rem 4.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(32, 227, 178, 0.3)' }}
          />
          <button type="submit" className="btn" style={{ position: 'absolute', right: '0.5rem', top: '0.5rem', bottom: '0.5rem', padding: '0 2.5rem' }}>
            Search
          </button>
        </form>
        
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link to="/explore" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Browse Directory
          </Link>
          <Link to="/innovx" className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
            Skill Matcher
          </Link>
        </div>
      </header>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-3" style={{ marginBottom: '4rem' }}>
        <div className="card stat-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <div className="stat-icon" style={{ background: 'rgba(32, 227, 178, 0.1)', color: 'var(--color-accent-2)', padding: '1rem', borderRadius: '16px' }}>
            <Building2 size={32} />
          </div>
          <div style={{ marginLeft: '1rem' }}>
            <p className="stat-value text-high-contrast" style={{ fontSize: '2.5rem', lineHeight: 1, margin: 0 }}>{companies.length}</p>
            <p className="stat-label" style={{ margin: 0, marginTop: '0.25rem' }}>Companies Tracked</p>
          </div>
        </div>
        <div className="card stat-card" style={{ padding: '1.5rem', justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column' }}>
          <div className="stat-icon" style={{ background: 'rgba(255, 51, 102, 0.1)', color: 'var(--color-accent-1)', padding: '1rem', borderRadius: '16px', marginBottom: '0.5rem' }}><TrendingUp size={28} /></div>
          <div style={{ textAlign: 'center' }}>
            <p className="stat-value text-high-contrast-alt" style={{ fontSize: '2.5rem', lineHeight: 1, margin: 0 }}>{velocityPercentage}%</p>
            <p className="stat-label" style={{ margin: 0, marginTop: '0.25rem' }}>High Velocity</p>
          </div>
        </div>
        <div className="card stat-card" style={{ padding: '1.5rem', justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="stat-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-accent-3)', padding: '1rem', borderRadius: '16px', marginBottom: '0.5rem' }}><Activity size={28} /></div>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <p className="stat-value text-secondary" style={{ fontSize: '1.5rem', lineHeight: 1.2, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{topCategory}</p>
            <p className="stat-label" style={{ margin: 0, marginTop: '0.25rem' }}>Top Category</p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 900 }}>Explore Sectors</h2>
        <Link to="/explore" className="text-primary" style={{ fontWeight: 700, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textShadow: '0 0 15px rgba(32, 227, 178, 0.4)' }}>
          View All <ChevronRight size={20} />
        </Link>
      </div>
      
      <div className="grid grid-cols-4" style={{ marginBottom: '4rem' }}>
        {[
          { name: 'Tech Giants', color: 'var(--color-accent-2)', bg: 'rgba(32, 227, 178, 0.05)', desc: 'Industry leaders' },
          { name: 'Product Companies', color: 'var(--color-accent-1)', bg: 'rgba(255, 51, 102, 0.05)', desc: 'Innovators' },
          { name: 'Service Companies', color: 'var(--color-accent-3)', bg: 'rgba(124, 58, 237, 0.05)', desc: 'Global scale' },
          { name: 'Startups', color: 'var(--color-accent-4)', bg: 'rgba(245, 158, 11, 0.05)', desc: 'High growth' }
        ].map((cat, i) => (
          <Link to={`/explore?category=${cat.name}`} key={i} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
            <motion.div 
              className="card"
              whileHover={{ scale: 1.05, y: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
              style={{ height: '100%', cursor: 'pointer', background: cat.bg, borderColor: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <h3 className="card-title" style={{ color: cat.color, fontSize: '1.8rem', textShadow: `0 0 15px ${cat.color}40`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat.name}</h3>
              <p className="text-muted" style={{ fontSize: '1rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cat.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
