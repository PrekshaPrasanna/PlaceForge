import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';
import type { Company } from '../hooks/useCompanies';

export default function InnovX() {
  const { companies, isLoading, error } = useCompanies();
  const [skillsInput, setSkillsInput] = useState('');
  const [matchedCompanies, setMatchedCompanies] = useState<{ company: Company; fit: string; gaps: string[] }[]>([]);

  if (isLoading) {
    return <div className="p-8">Loading InnovX data...</div>;
  }

  if (error) {
    return <div className="p-8 text-accent">Error loading InnovX data.</div>;
  }

  const handleMatch = () => {
    const userSkills = skillsInput.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
    if (!userSkills.length) return;

    const results = companies.map(company => {
      const companyStack = (typeof company.tech_stack === 'string' ? company.tech_stack.split(/[,;]/) : (company.tech_stack as string[]) || []).map(s => s.toLowerCase().trim());
      const matched = userSkills.filter(s => companyStack.includes(s));
      const gaps = companyStack.filter(s => !userSkills.includes(s));
      
      const matchRatio = matched.length / (companyStack.length || 1);
      let fit = 'Low';
      if (matchRatio >= 0.7) fit = 'High';
      else if (matchRatio >= 0.4) fit = 'Medium';

      return { company, fit, gaps };
    });

    setMatchedCompanies(results.sort((a) => (a.fit === 'High' ? -1 : 1)));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <header className="dashboard-header">
        <h1>InnovX Skill Mapping</h1>
        <p className="text-muted">Enter your skills to find the best company fit and identify gaps.</p>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Your Skills (comma separated)</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. React, Node.js, Python, AWS"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
          />
        </div>
        <button className="btn" onClick={handleMatch}>Find Matches</button>
      </div>

      {matchedCompanies.length > 0 && (
        <div className="grid grid-cols-2">
          {matchedCompanies.map(({ company, fit, gaps }) => (
            <div key={company.company_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <img src={company.logo_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
                  <h3 className="card-title" style={{ margin: 0 }}>{company.name}</h3>
                </div>
                <span className={`badge ${fit === 'High' ? 'badge-secondary' : fit === 'Medium' ? 'badge-primary' : 'badge-accent'}`}>
                  {fit} Fit
                </span>
              </div>

              <div style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                <strong>AI/ML Adoption:</strong> {company.ai_ml_adoption_level} <br/>
                <strong>Automation Level:</strong> {company.automation_level} <br/>
                <strong>Skill Relevance:</strong> {company.skill_relevance}
              </div>

              {gaps.length > 0 && (
                <div>
                  <strong className="text-accent" style={{ fontSize: '0.875rem' }}>Preparation Focus (Gaps):</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {gaps.map(gap => <span key={gap} className="badge badge-accent">{gap}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
