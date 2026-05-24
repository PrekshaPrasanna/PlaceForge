import React from 'react';
import { motion } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';
import { PieChart, TrendingUp, Building2, ShieldCheck, Activity } from 'lucide-react';

export default function Analytics() {
  const { companies, isLoading, error } = useCompanies();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full" style={{ minHeight: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ color: 'var(--color-accent-1)' }}>
          <Activity size={48} />
        </motion.div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-accent">Error loading analytics data.</div>;

  const total = companies.length || 1;

  // Data Maps
  const categoriesMap: Record<string, number> = {};
  const natureMap: Record<string, number> = {};
  const esgMap: Record<string, number> = {};
  
  let startupCount = 0; // >= 2015
  let matureCount = 0;  // < 2015

  companies.forEach(c => {
    // Categories
    const cat = c.category && String(c.category).toUpperCase() !== 'NULL' && String(c.category).trim() !== '' ? String(c.category).trim() : 'Other Sector';
    categoriesMap[cat] = (categoriesMap[cat] || 0) + 1;

    // Nature
    const nat = c.nature_of_company && String(c.nature_of_company).toUpperCase() !== 'NULL' && String(c.nature_of_company).trim() !== '' ? String(c.nature_of_company).trim() : 'Unspecified';
    natureMap[nat] = (natureMap[nat] || 0) + 1;

    // ESG
    let esg = 'Unrated';
    if (c.esg_ratings && String(c.esg_ratings).toUpperCase() !== 'NULL' && String(c.esg_ratings).trim() !== '') {
      const eStr = String(c.esg_ratings).trim();
      if (eStr.length > 35) {
         const lowerStr = eStr.toLowerCase();
         if (lowerStr.includes('strong') || lowerStr.includes('high')) esg = 'Strong ESG';
         else if (lowerStr.includes('moderate') || lowerStr.includes('medium')) esg = 'Moderate ESG';
         else if (lowerStr.includes('weak') || lowerStr.includes('low')) esg = 'Low ESG';
         else esg = 'Unrated';
      } else {
         esg = eStr;
      }
    }
    esgMap[esg] = (esgMap[esg] || 0) + 1;

    // Age / Maturity
    if (c.incorporation_year && String(c.incorporation_year).toUpperCase() !== 'NULL') {
      const year = parseInt(String(c.incorporation_year), 10);
      if (!isNaN(year)) {
        if (year >= 2015) startupCount++;
        else matureCount++;
      }
    }
  });

  const categories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const natures = Object.entries(natureMap).sort((a, b) => b[1] - a[1]);
  const esgs = Object.entries(esgMap).sort((a, b) => b[1] - a[1]);
  
  const ageTotal = startupCount + matureCount || 1;
  const startupPct = Math.round((startupCount / ageTotal) * 100);
  const maturePct = Math.round((matureCount / ageTotal) * 100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const colors = ['var(--color-accent-2)', 'var(--color-accent-1)', 'var(--color-accent-3)', '#8A2BE2', '#FF6347', '#32CD32'];

  return (
    <motion.div initial="hidden" animate="visible" exit="hidden" variants={containerVariants} style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.h1 variants={itemVariants} style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem 0', background: 'linear-gradient(45deg, var(--color-accent-1), var(--color-accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Ecosystem Analytics
        </motion.h1>
        <motion.p variants={itemVariants} className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          High-level macro insights and market mapping across all actively tracked organizations.
        </motion.p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Industry Dist */}
        <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <PieChart color="var(--color-accent-2)" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Industry Concentration</h2>
          </div>
          <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
            {categories.map(([cat, count], i) => (
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${(count / total) * 100}%` }} transition={{ delay: i * 0.1, duration: 1 }}
                key={cat} 
                style={{ backgroundColor: colors[i % colors.length], height: '100%' }}
                title={`${cat}: ${count}`}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
            {categories.map(([cat, count], i) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: colors[i % colors.length] }} />
                <span style={{ fontWeight: 600 }}>{cat}</span>
                <span className="text-muted">({Math.round((count/total)*100)}%)</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Startups vs Enterprise */}
        <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <TrendingUp color="var(--color-accent-1)" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Market Maturity (Age)</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '150px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-accent-1)', lineHeight: 1 }}>{startupPct}%</div>
              <div className="text-muted" style={{ fontWeight: 600, marginTop: '0.5rem' }}>Emerging / Startups</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Founded ≥ 2015</div>
            </div>
            <div style={{ width: '1px', height: '80px', backgroundColor: 'var(--glass-border)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--color-accent-2)', lineHeight: 1 }}>{maturePct}%</div>
              <div className="text-muted" style={{ fontWeight: 600, marginTop: '0.5rem' }}>Mature Enterprises</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Founded &lt; 2015</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Nature of Company */}
        <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <Building2 color="var(--color-accent-3)" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Company Nature</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {natures.slice(0, 5).map(([nat, count], i) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={nat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{nat}</span>
                    <span style={{ fontWeight: 800, color: 'var(--color-accent-3)' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 1 }} style={{ height: '100%', background: 'var(--color-accent-3)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ESG Ratings */}
        <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <ShieldCheck color="#FF6347" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Global ESG Ratings</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {esgs.slice(0, 5).map(([esg, count], i) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={esg}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{esg}</span>
                    <span style={{ fontWeight: 800, color: '#FF6347' }}>{pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: i * 0.1, duration: 1 }} style={{ height: '100%', background: '#FF6347' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
