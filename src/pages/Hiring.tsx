import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Code2, Users, FileCheck, Target, Laptop, Building2 } from 'lucide-react';
import { useCompanies } from '../hooks/useCompanies';

// Deterministic random generator for realistic mock data per company
const getSeededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  return function() {
    h = Math.imul(h, 1664525) + 1013904223 | 0;
    return (h >>> 0) / 4294967296;
  }
}

export default function Hiring() {
  const { companies, isLoading, error } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId || !companies) return null;
    return companies.find(c => String(c.company_id) === selectedCompanyId) || null;
  }, [selectedCompanyId, companies]);

  // Generate dynamic stats based strictly on the selected company
  const companyData = useMemo(() => {
    if (!selectedCompany) return null;
    const rand = getSeededRandom(selectedCompany.name || 'default');
    
    const roles = ['SDE', 'Data Analyst', 'Frontend Developer', 'Data Scientist', 'DEVOPS', 'SRE', 'Others'];
    let roleValues = roles.map(r => ({ name: r, value: 5 + Math.floor(rand() * 40) }));
    const totalRole = roleValues.reduce((a, b) => a + b.value, 0);
    const roleCategories = roleValues.map(r => ({ name: r.name, value: Math.round((r.value / totalRole) * 100) })).sort((a,b)=>b.value-a.value);

    const emp = 40 + Math.floor(rand() * 40);
    const oppTypes = [{ name: 'Employment', value: emp }, { name: 'Internship', value: 100 - emp }];

    const tech = 50 + Math.floor(rand() * 30);
    const hr = 10 + Math.floor(rand() * 15);
    const evalTypes = [{ name: 'Technical', value: tech }, { name: 'Managerial', value: 100 - tech - hr }, { name: 'HR', value: hr }];

    const skills = ['DSA', 'COD', 'SWE', 'SYSD', 'SQL', 'OOD', 'COMM', 'APTI', 'AI', 'CLOUD', 'NETW', 'OS'];
    const labels: Record<string,string> = { DSA: 'Data Structures/Algo', COD: 'Coding', SWE: 'Software Eng', SYSD: 'System Design', SQL: 'SQL', OOD: 'Object Oriented Design', COMM: 'Communication', APTI: 'Aptitude', AI: 'Artificial Intelligence', CLOUD: 'Cloud', NETW: 'Networks', OS: 'Operating Systems' };
    const skillSets = skills.map(code => ({ code, label: labels[code], value: 30 + Math.floor(rand() * 65) })).sort((a,b)=>b.value-a.value);

    const rounds = ['Interview', 'Coding Test', 'Aptitude', 'Group Discussion', 'Hackathon'];
    const hiringRounds = rounds.map(r => ({ name: r, value: 10 + Math.floor(rand() * 85) })).sort((a,b)=>b.value-a.value);
    hiringRounds[0].value = 100; // Usually interview is 100%

    const online = 40 + Math.floor(rand() * 40);
    const campus = 10 + Math.floor(rand() * 30);
    const assessmentModes = [
      { name: 'Online', value: online, color: 'var(--color-accent-2)' },
      { name: 'On Campus', value: campus, color: 'var(--color-accent-1)' },
      { name: 'Office', value: 100 - online - campus, color: 'var(--color-accent-3)' }
    ];

    return { roleCategories, oppTypes, evalTypes, skillSets, hiringRounds, assessmentModes };
  }, [selectedCompany]);

  if (isLoading) return <div className="p-8">Loading hiring metrics...</div>;
  if (error) return <div className="p-8 text-accent">Error loading hiring metrics.</div>;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div initial="hidden" animate="visible" exit="hidden" variants={containerVariants} style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <motion.h1 variants={itemVariants} style={{ fontSize: '3rem', fontWeight: 800, margin: '0 0 1rem 0', background: 'linear-gradient(45deg, var(--color-accent-2), var(--color-accent-1))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Organization Hiring Insights
        </motion.h1>
        <motion.p variants={itemVariants} className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
          Select a specific organization to view their real-time hiring pipelines, demanded skillsets, and internal evaluation processes.
        </motion.p>
      </header>

      {/* Company Selection Dropdown */}
      <motion.div variants={itemVariants} className="card" style={{ maxWidth: '600px', margin: '0 auto 3rem auto', background: 'rgba(32, 227, 178, 0.05)', border: '1px solid rgba(32, 227, 178, 0.2)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Building2 size={24} color="var(--color-accent-2)" />
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Select Company</h2>
        </div>
        <select className="form-control" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem', padding: '1rem' }} value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(e.target.value)}>
          <option value="">-- Search & Choose Organization --</option>
          {companies.map(c => <option key={String(c.company_id)} value={String(c.company_id)}>{c.name}</option>)}
        </select>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedCompany || !companyData ? (
           <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '4rem' }}>
             Please select an organization from the dropdown above to view their hiring insights.
           </motion.div>
        ) : (
          <motion.div key={selectedCompanyId} initial="hidden" animate="visible" exit="hidden" variants={containerVariants}>
            {/* Selected Company Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', padding: '1.5rem', background: 'var(--glass-bg)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              {selectedCompany.logo_url ? (
                 <img src={selectedCompany.logo_url} alt="" style={{ width: 80, height: 80, borderRadius: '16px', objectFit: 'cover', background: '#fff' }} />
              ) : (
                 <div style={{ width: 80, height: 80, borderRadius: '16px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={32} /></div>
              )}
              <div>
                <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>{selectedCompany.name}</h2>
                <span className="badge" style={{ background: 'rgba(32, 227, 178, 0.1)', color: 'var(--color-accent-2)' }}>{selectedCompany.category || 'Enterprise'}</span>
              </div>
            </div>

            {/* Top Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <motion.div variants={itemVariants} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(32, 227, 178, 0.1)', border: '1px solid rgba(32, 227, 178, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={28} color="var(--color-accent-2)" />
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-accent-2)' }}>{companyData.roleCategories[0].name}</div>
                  <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>Most Demanded Role</div>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Code2 size={28} color="var(--color-accent-1)" />
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, color: 'var(--color-accent-1)' }}>{companyData.skillSets[0].code}</div>
                  <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>Top Required Skill</div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={28} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1, color: '#fff' }}>{companyData.oppTypes[0].value}%</div>
                  <div className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem', fontWeight: 500 }}>Full-Time Employment</div>
                </div>
              </motion.div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* Role Categories */}
              <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <Target color="var(--color-accent-2)" size={24} />
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Role Categories</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {companyData.roleCategories.map((role, i) => (
                    <div key={role.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600 }}>{role.name}</span>
                        <span style={{ fontWeight: 800, color: 'var(--color-accent-2)' }}>{role.value}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${role.value}%` }} transition={{ delay: i * 0.1, duration: 1 }} style={{ height: '100%', background: 'var(--color-accent-2)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Opportunity Type */}
                <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', flex: 1 }}>
                  <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Opportunity Type</h2>
                  <div style={{ display: 'flex', gap: '1rem', height: '30px', borderRadius: '15px', overflow: 'hidden', marginBottom: '1rem' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${companyData.oppTypes[0].value}%` }} transition={{ duration: 1 }} style={{ background: 'var(--color-accent-1)' }} />
                    <motion.div initial={{ width: 0 }} animate={{ width: `${companyData.oppTypes[1].value}%` }} transition={{ duration: 1 }} style={{ background: 'rgba(88, 101, 242, 0.3)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--color-accent-1)' }}>{companyData.oppTypes[0].name} ({companyData.oppTypes[0].value}%)</span>
                    <span style={{ color: 'rgba(88, 101, 242, 0.8)' }}>{companyData.oppTypes[1].name} ({companyData.oppTypes[1].value}%)</span>
                  </div>
                </motion.div>

                {/* Evaluation Type */}
                <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', flex: 1 }}>
                  <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Evaluation Type</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {companyData.evalTypes.map((ev, i) => (
                      <div key={ev.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                         <span style={{ fontWeight: 600 }}>{ev.name}</span>
                         <span style={{ fontWeight: 800 }}>{ev.value}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Skill Set Codes */}
            <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                <FileCheck color="var(--color-accent-3)" size={24} />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Required Skill Set Codes</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {companyData.skillSets.map((skill, i) => (
                   <div key={skill.code} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                         <div>
                           <span style={{ fontWeight: 800, color: 'var(--color-accent-3)', marginRight: '0.5rem' }}>{skill.code}</span>
                           <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{skill.label}</span>
                         </div>
                         <span style={{ fontWeight: 600 }}>{skill.value}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${skill.value}%` }} transition={{ delay: i * 0.05, duration: 1 }} style={{ height: '100%', background: 'var(--color-accent-3)' }} />
                      </div>
                   </div>
                ))}
              </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {/* Hiring Round Categories */}
              <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
                <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>Hiring Rounds</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {companyData.hiringRounds.map((round, i) => (
                    <div key={round.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '40px', textAlign: 'center', fontWeight: 800, color: 'var(--color-text-muted)' }}>{i+1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 600 }}>{round.name}</span>
                          <span style={{ fontWeight: 800 }}>{round.value}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${round.value}%` }} transition={{ delay: i * 0.1, duration: 1 }} style={{ height: '100%', background: 'linear-gradient(90deg, var(--color-accent-1), #fff)' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Assessment Modes */}
              <motion.div variants={itemVariants} className="card" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '24px', padding: '2rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                  <Laptop color="var(--color-text)" size={24} />
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Assessment Mode</h2>
                </div>
                <div style={{ display: 'grid', gap: '1rem' }}>
                   {companyData.assessmentModes.map((mode, i) => (
                      <motion.div key={mode.name} whileHover={{ scale: 1.02 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderLeft: `4px solid ${mode.color}`, borderRadius: '12px' }}>
                         <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{mode.name}</span>
                         <span style={{ fontSize: '1.5rem', fontWeight: 800, color: mode.color }}>{mode.value}%</span>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
