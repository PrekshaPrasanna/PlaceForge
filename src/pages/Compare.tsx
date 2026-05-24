import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';
import { companyService } from '../services/companyService';
import type { Company } from '../types/database';
import { CheckCircle2, Building2, MapPin, Globe2, AlertTriangle, ShieldCheck, Target, HeartHandshake, Briefcase } from 'lucide-react';

export default function Compare() {
  const { companies, isLoading, error } = useCompanies();
  const [comp1Id, setComp1Id] = useState<string>('');
  const [comp2Id, setComp2Id] = useState<string>('');
  
  const [comparisonData, setComparisonData] = useState<Company[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    async function fetchComparison() {
      if (!comp1Id || !comp2Id) {
        setComparisonData([]);
        return;
      }
      setIsComparing(true);
      try {
        const data = await companyService.compareCompanies([comp1Id, comp2Id]);
        setComparisonData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsComparing(false);
      }
    }
    fetchComparison();
  }, [comp1Id, comp2Id]);

  if (isLoading) return <div className="p-8">Loading compare data...</div>;
  if (error) return <div className="p-8 text-accent">Error loading compare data.</div>;

  const comp1 = comparisonData.find(c => String(c.company_id) === comp1Id) || companies.find(c => String(c.company_id) === comp1Id);
  const comp2 = comparisonData.find(c => String(c.company_id) === comp2Id) || companies.find(c => String(c.company_id) === comp2Id);

  const compareFields = [
    { label: 'Industry', key: 'category' as keyof Company, icon: Briefcase },
    { label: 'Global Presence', key: 'operating_countries' as keyof Company, icon: Globe2 },
    { label: 'Employee Base', key: 'employee_size' as keyof Company, icon: Building2 },
    { label: 'Headquarters', key: 'headquarters_address' as keyof Company, icon: MapPin },
    { label: 'Core Values', key: 'core_values' as keyof Company, icon: HeartHandshake },
    { label: 'Vision', key: 'vision_statement' as keyof Company, icon: Target },
    { label: 'ESG & Ethics', key: 'esg_ratings' as keyof Company, icon: ShieldCheck },
    { label: 'Risk Factors', key: 'macro_risks' as keyof Company, icon: AlertTriangle },
  ];

  const getVal = (c: Company | undefined, key: keyof Company) => {
    if (!c) return '--';
    const val = c[key];
    if (!val || String(val).toUpperCase() === 'NULL' || String(val).trim() === '') return 'N/A';
    return String(val);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.h1 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem 0', background: 'linear-gradient(45deg, var(--color-accent-1), var(--color-accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Head-to-Head Showdown
        </motion.h1>
        <motion.p initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Evaluate two organizations side-by-side to discover the absolute best fit for your career trajectory.
        </motion.p>
      </header>

      {/* Top Selection Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center', marginBottom: '3rem' }}>
        {/* Card 1 */}
        <div className="card" style={{ background: comp1 ? 'rgba(32, 227, 178, 0.05)' : 'var(--glass-bg)', border: `1px solid ${comp1 ? 'rgba(32, 227, 178, 0.2)' : 'var(--glass-border)'}`, borderRadius: '24px', padding: '2rem', textAlign: 'center', transition: 'all 0.3s ease' }}>
          <select className="form-control" style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }} value={comp1Id} onChange={(e) => setComp1Id(e.target.value)}>
            <option value="">Choose first company...</option>
            {companies.map(c => <option key={String(c.company_id)} value={String(c.company_id)}>{c.name}</option>)}
          </select>
          <AnimatePresence mode="wait">
            {comp1 && (
              <motion.div key={comp1Id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {comp1.logo_url ? (
                  <img src={comp1.logo_url} alt={comp1.name} style={{ width: 100, height: 100, borderRadius: '24px', objectFit: 'cover', margin: '0 auto 1.5rem auto', border: '2px solid rgba(255,255,255,0.1)', background: '#fff' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '24px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}><Building2 size={40} /></div>
                )}
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{comp1.name}</h2>
                <span className="badge" style={{ background: 'rgba(32, 227, 178, 0.1)', color: 'var(--color-accent-2)' }}>{comp1.category || 'Enterprise'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VS Badge */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} style={{ width: 60, height: 60, borderRadius: '30px', background: 'linear-gradient(135deg, var(--color-accent-1), var(--color-accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, color: '#000', boxShadow: '0 0 30px rgba(32, 227, 178, 0.3)' }}>
          VS
        </motion.div>

        {/* Card 2 */}
        <div className="card" style={{ background: comp2 ? 'rgba(88, 101, 242, 0.05)' : 'var(--glass-bg)', border: `1px solid ${comp2 ? 'rgba(88, 101, 242, 0.2)' : 'var(--glass-border)'}`, borderRadius: '24px', padding: '2rem', textAlign: 'center', transition: 'all 0.3s ease' }}>
          <select className="form-control" style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)' }} value={comp2Id} onChange={(e) => setComp2Id(e.target.value)}>
            <option value="">Choose second company...</option>
            {companies.map(c => <option key={String(c.company_id)} value={String(c.company_id)}>{c.name}</option>)}
          </select>
          <AnimatePresence mode="wait">
            {comp2 && (
              <motion.div key={comp2Id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                {comp2.logo_url ? (
                  <img src={comp2.logo_url} alt={comp2.name} style={{ width: 100, height: 100, borderRadius: '24px', objectFit: 'cover', margin: '0 auto 1.5rem auto', border: '2px solid rgba(255,255,255,0.1)', background: '#fff' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: '24px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}><Building2 size={40} /></div>
                )}
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{comp2.name}</h2>
                <span className="badge" style={{ background: 'rgba(88, 101, 242, 0.1)', color: 'var(--color-accent-1)' }}>{comp2.category || 'Enterprise'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {isComparing && <div style={{ textAlign: 'center', color: 'var(--color-accent-1)' }}>Syncing latest database records...</div>}

      {!isComparing && comp1 && comp2 && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Comparison Rows */}
          {compareFields.map((field, i) => (
            <motion.div key={field.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 200px 1fr', gap: '2rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right', fontSize: '1rem', color: 'var(--color-text)', lineHeight: '1.6' }}>
                 {getVal(comp1, field.key)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)', padding: '0.5rem 0' }}>
                 <field.icon size={24} color="var(--color-text-muted)" />
                 <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>{field.label}</span>
              </div>
              <div style={{ textAlign: 'left', fontSize: '1rem', color: 'var(--color-text)', lineHeight: '1.6' }}>
                 {getVal(comp2, field.key)}
              </div>
            </motion.div>
          ))}

          {/* Final Decision Block */}
          {(() => {
            let score1 = 0;
            let score2 = 0;
            const reasons: string[] = [];

            // Helper to get raw string safely
            const safeStr = (val: any) => val && String(val).toUpperCase() !== 'NULL' ? String(val) : '';

            const esg1 = safeStr(comp1.esg_ratings).toLowerCase();
            const esg2 = safeStr(comp2.esg_ratings).toLowerCase();
            if (esg1.includes('high') || esg1.includes('excellent')) score1 += 2;
            if (esg2.includes('high') || esg2.includes('excellent')) score2 += 2;

            const c1 = safeStr(comp1.operating_countries).split(/[,;]/).filter(Boolean).length;
            const c2 = safeStr(comp2.operating_countries).split(/[,;]/).filter(Boolean).length;
            if (c1 > c2 + 1) { score1 += 1; reasons.push(`${comp1.name} has a significantly larger global footprint.`); }
            else if (c2 > c1 + 1) { score2 += 1; reasons.push(`${comp2.name} has a significantly larger global footprint.`); }

            const r1 = safeStr(comp1.macro_risks).toLowerCase();
            const r2 = safeStr(comp2.macro_risks).toLowerCase();
            if (r1.includes('low') && !r2.includes('low')) { score1 += 1; reasons.push(`It presents lower macro-economic risk profiles.`); }
            if (r2.includes('low') && !r1.includes('low')) { score2 += 1; reasons.push(`It presents lower macro-economic risk profiles.`); }

            const winner = score1 > score2 ? comp1 : (score2 > score1 ? comp2 : null);

            let verdictUI;
            if (!winner) {
              verdictUI = {
                title: 'It\'s a Tie!',
                color: 'var(--color-text)',
                summary: `Both ${comp1.name} and ${comp2.name} present highly competitive and equal profiles based on the metrics. The choice ultimately depends on whether you prefer the specific industry culture of ${comp1.name} or the unique vision of ${comp2.name}.`
              };
            } else {
              const isComp1 = winner.company_id === comp1.company_id;
              verdictUI = {
                title: `${winner.name} is the Recommended Choice`,
                color: isComp1 ? 'var(--color-accent-2)' : 'var(--color-accent-1)',
                summary: `Based on the core data profile, ${winner.name} edges out as the objectively stronger choice. ${reasons.join(' ')} ${reasons.length === 0 ? `It maintains a slight competitive edge in stability and reach compared to its peer.` : ''} However, always align your final decision with your personal career goals.`
              };
            }

            return (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="card" style={{ marginTop: '3rem', padding: '2rem', background: 'var(--glass-bg)', border: `1px solid ${verdictUI.color}`, borderRadius: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: verdictUI.color }} />
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '30px', marginBottom: '1.5rem' }}>
                  <ShieldCheck size={16} color={verdictUI.color} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: verdictUI.color }}>Data-Driven Verdict</span>
                </div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>{verdictUI.title}</h2>
                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
                  {verdictUI.summary}
                </p>
              </motion.div>
            );
          })()}
        </motion.div>
      )}
    </motion.div>
  );
}
