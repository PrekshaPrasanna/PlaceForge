import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';
import { companyService } from '../services/companyService';
import type { Company } from '../types/database';

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

  if (isLoading) {
    return <div className="p-8">Loading compare data...</div>;
  }
  
  if (error) {
    return <div className="p-8 text-accent">Error loading compare data.</div>;
  }

  const comp1 = comparisonData.find(c => String(c.company_id) === comp1Id);
  const comp2 = comparisonData.find(c => String(c.company_id) === comp2Id);

  const compareFields = [
    { label: 'Culture', key: 'culture_and_work' as const },
    { label: 'Compensation', key: 'compensation' as const },
    { label: 'Learning & Career Signal', key: 'learning_and_career_signal' as const },
    { label: 'Financials', key: 'financials_and_risk' as const },
    { label: 'Technology', key: 'technology_and_innovation' as const },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="dashboard-header">
        <h1>Compare Companies</h1>
        <p className="text-muted">Evaluate side-by-side strengths, trade-offs, and risks.</p>
      </header>

      <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <label className="form-label">Select First Company</label>
          <select className="form-control" value={comp1Id} onChange={(e) => setComp1Id(e.target.value)}>
            <option value="">-- Select Company --</option>
            {companies.map(c => <option key={String(c.company_id)} value={String(c.company_id)}>{c.name}</option>)}
          </select>
        </div>
        <div className="card">
          <label className="form-label">Select Second Company</label>
          <select className="form-control" value={comp2Id} onChange={(e) => setComp2Id(e.target.value)}>
            <option value="">-- Select Company --</option>
            {companies.map(c => <option key={String(c.company_id)} value={String(c.company_id)}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {isComparing && <div className="p-8">Fetching comparison data...</div>}

      {!isComparing && comp1 && comp2 && (
        <div className="card table-wrapper" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Attribute</th>
                <th style={{ width: '40%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={comp1.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }}/>
                    {comp1.name}
                  </div>
                </th>
                <th style={{ width: '40%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={comp2.logo_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }}/>
                    {comp2.name}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {compareFields.map(field => (
                <tr key={field.key}>
                  <td style={{ fontWeight: 500 }}>{field.label}</td>
                  <td>{comp1[field.key] || 'N/A'}</td>
                  <td>{comp2[field.key] || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
