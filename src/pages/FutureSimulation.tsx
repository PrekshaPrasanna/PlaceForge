import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Brain, TrendingUp, AlertTriangle, ChevronRight, Briefcase, Zap, Save, Download, Clock, BarChart2, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Company } from '../types/database';
import { companyService } from '../services/companyService';
import { simulationService } from '../services/simulationService';
import type { SimulationScenario, SimulationResult } from '../services/simulationService';

const scenarios: SimulationScenario[] = [
  'Heavy AI Adoption',
  'Rapid Global Expansion',
  'Funding Reduction',
  'Economic Recession',
  'Startup Hypergrowth',
  'Remote-First Transformation'
];

export default function FutureSimulation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario>('Heavy AI Adoption');
  const [compareScenario, setCompareScenario] = useState<SimulationScenario | null>(null);
  
  const [isSimulating, setIsSimulating] = useState(false);
  const [primaryResult, setPrimaryResult] = useState<SimulationResult | null>(null);
  const [compareResult, setCompareResult] = useState<SimulationResult | null>(null);

  const [savedReports, setSavedReports] = useState<{company: Company, result: SimulationResult, date: string}[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await companyService.searchCompanies(searchQuery, 'company_id, name, logo_url, category');
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to search", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSimulate = async () => {
    if (!selectedCompany) return;
    setIsSimulating(true);
    setPrimaryResult(null);
    setCompareResult(null);
    try {
      const res = await simulationService.runSimulation(selectedCompany, selectedScenario);
      setPrimaryResult(res);
      if (compareScenario && compareScenario !== selectedScenario) {
        const compRes = await simulationService.runSimulation(selectedCompany, compareScenario);
        setCompareResult(compRes);
      }
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsSimulating(false);
    }
  };

  const saveReport = () => {
    if (!selectedCompany || !primaryResult) return;
    const report = {
      company: selectedCompany,
      result: primaryResult,
      date: new Date().toISOString()
    };
    setSavedReports(prev => [report, ...prev]);
    alert("Report saved to history!");
  };

  const exportReport = () => {
    if (!selectedCompany || !primaryResult) return;
    const exportData = {
      companyName: selectedCompany.name,
      primarySimulation: primaryResult,
      comparisonSimulation: compareResult || undefined,
      generatedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${selectedCompany.name.replace(/\s+/g, '_')}_Simulation.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderMetric = (label: string, value: number, compareValue?: number, suffix: string = '%') => (
    <div className="stat-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
      <div className="stat-label" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
        <div className="stat-value" style={{ fontSize: '2.5rem' }}>{value}{suffix}</div>
        {compareValue !== undefined && (
          <div className="stat-value" style={{ fontSize: '1.5rem', opacity: 0.5 }}>
            vs {compareValue}{suffix}
          </div>
        )}
      </div>
      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '1rem', overflow: 'hidden', display: 'flex' }}>
        <motion.div 
          initial={{ width: 0 }} animate={{ width: `${value}%` }} 
          transition={{ duration: 1, delay: 0.5 }}
          style={{ height: '100%', background: 'var(--color-accent-2)' }} 
        />
      </div>
      {compareValue !== undefined && (
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden', display: 'flex' }}>
          <motion.div 
            initial={{ width: 0 }} animate={{ width: `${compareValue}%` }} 
            transition={{ duration: 1, delay: 0.7 }}
            style={{ height: '100%', background: 'var(--color-accent-1)' }} 
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="simulation-page">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Future <span className="text-high-contrast">Simulation</span></h1>
          <p>AI-powered forecasting predicting how companies evolve under different market scenarios over the next 2-5 years.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistory(!showHistory)}>
          <Clock size={20} /> History ({savedReports.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 className="card-title">Saved Simulations</h2>
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>Back to Simulator</button>
            </div>
            {savedReports.length === 0 ? (
              <p className="text-muted">No saved simulations yet.</p>
            ) : (
              <div className="grid grid-cols-2">
                {savedReports.map((report, i) => (
                  <div key={i} className="card" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      {report.company.logo_url && <img src={report.company.logo_url} alt="logo" style={{ width: 40, height: 40, borderRadius: '8px' }} />}
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{report.company.name}</h3>
                        <span className="badge badge-primary" style={{ marginTop: '0.5rem' }}>{report.result.scenario}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <div><span className="text-muted">Stability:</span> {report.result.predictions.companyStability}%</div>
                      <div><span className="text-muted">Growth:</span> {report.result.predictions.industryGrowthPotential}%</div>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Saved on: {new Date(report.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : !selectedCompany ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          >
            <div className="search-container" style={{ marginTop: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={24} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search for a company to simulate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isSearching && <div style={{ textAlign: 'center', padding: '2rem' }}><Brain className="lucide-spin" size={32} /></div>}
            
            {searchResults.length > 0 && (
              <div className="grid grid-cols-3">
                {searchResults.map(company => (
                  <div key={company.company_id} className="card" style={{ cursor: 'pointer' }} onClick={() => setSelectedCompany(company)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {company.logo_url ? (
                        <img src={company.logo_url} alt={company.name} style={{ width: 48, height: 48, borderRadius: '12px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Briefcase size={24} />
                        </div>
                      )}
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{company.name}</h3>
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>{company.category}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : !primaryResult && !isSimulating ? (
          <motion.div 
            key="configuration"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="card"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {selectedCompany.logo_url && <img src={selectedCompany.logo_url} alt="logo" style={{ width: 64, height: 64, borderRadius: '16px' }} />}
                <div>
                  <h2 className="card-title" style={{ margin: 0 }}>{selectedCompany.name}</h2>
                  <button className="btn-secondary" style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-1)', padding: 0, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem' }} onClick={() => setSelectedCompany(null)}>
                    Change Company
                  </button>
                </div>
              </div>
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>1. Select Primary Scenario</h3>
            <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
              {scenarios.map(s => (
                <div 
                  key={s} 
                  className="card" 
                  style={{ 
                    cursor: 'pointer', 
                    border: selectedScenario === s ? '2px solid var(--color-accent-2)' : '1px solid var(--glass-border)',
                    background: selectedScenario === s ? 'rgba(32, 227, 178, 0.05)' : 'var(--glass-bg)'
                  }}
                  onClick={() => setSelectedScenario(s)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {selectedScenario === s ? <CheckCircle2 color="var(--color-accent-2)" size={20} /> : <Zap size={20} color="var(--color-text-muted)" />}
                    <span style={{ fontWeight: 600 }}>{s}</span>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginBottom: '1.5rem' }}>2. Select Comparison Scenario (Optional)</h3>
            <div className="grid grid-cols-3" style={{ marginBottom: '3rem' }}>
              <div 
                className="card" 
                style={{ 
                  cursor: 'pointer', 
                  border: compareScenario === null ? '2px solid var(--color-accent-1)' : '1px solid var(--glass-border)',
                  background: compareScenario === null ? 'rgba(255, 51, 102, 0.05)' : 'var(--glass-bg)'
                }}
                onClick={() => setCompareScenario(null)}
              >
                <span style={{ fontWeight: 600 }}>None</span>
              </div>
              {scenarios.filter(s => s !== selectedScenario).map(s => (
                <div 
                  key={`comp-${s}`} 
                  className="card" 
                  style={{ 
                    cursor: 'pointer', 
                    border: compareScenario === s ? '2px solid var(--color-accent-1)' : '1px solid var(--glass-border)',
                    background: compareScenario === s ? 'rgba(255, 51, 102, 0.05)' : 'var(--glass-bg)'
                  }}
                  onClick={() => setCompareScenario(s)}
                >
                  <span style={{ fontWeight: 600 }}>{s}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="btn" onClick={handleSimulate}>
                <Brain size={20} /> Generate AI Prediction
              </button>
            </div>
          </motion.div>
        ) : isSimulating ? (
          <motion.div 
            key="simulating"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 100, height: 100, borderRadius: '50%', background: 'conic-gradient(from 0deg, var(--color-accent-1), var(--color-accent-2), var(--color-accent-3), var(--color-accent-1))', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}
            >
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-bg-deep)' }}></div>
            </motion.div>
            <h2>Running Neural Forecast...</h2>
            <p className="text-muted">Analyzing market conditions and company vectors</p>
          </motion.div>
        ) : primaryResult && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Simulation Results</h2>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', alignItems: 'center' }}>
                  <span className="badge badge-primary">{primaryResult.scenario}</span>
                  {primaryResult.isRealData ? (
                    <span className="badge" style={{ background: 'linear-gradient(45deg, #4285F4, #9b72cb, #d96570)', color: 'white', border: 'none' }}>✨ Powered by Gemini AI</span>
                  ) : (
                    <span className="badge" style={{ background: 'var(--glass-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--glass-border)' }}>⚙️ Rule-based Simulation</span>
                  )}
                  {compareResult && <span className="badge badge-accent">VS {compareResult.scenario}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setPrimaryResult(null)}>New Simulation</button>
                <button className="btn btn-secondary" onClick={saveReport}><Save size={18} /> Save</button>
                <button className="btn" onClick={exportReport}><Download size={18} /> Export Report</button>
              </div>
            </div>

            <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
              {renderMetric('AI Confidence', primaryResult.confidenceScore, compareResult?.confidenceScore)}
              {renderMetric('Opportunity Score', primaryResult.metrics.futureOpportunityScore, compareResult?.metrics.futureOpportunityScore)}
              {renderMetric('Risk Indicator', primaryResult.metrics.riskIndicator, compareResult?.metrics.riskIndicator)}
              {renderMetric('AI Adoption Index', primaryResult.metrics.aiAdoptionIndicator, compareResult?.metrics.aiAdoptionIndicator)}
            </div>

            <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
              <div className="card">
                <h3 className="card-title"><BarChart2 style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> Hiring Trend Evolution</h3>
                <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1rem', marginTop: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                  {primaryResult.predictions.hiringTrends.map((trend, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '4px', height: '200px', alignItems: 'flex-end', width: '100%', justifyContent: 'center' }}>
                        {/* Primary Bar */}
                        <motion.div 
                          initial={{ height: 0 }} animate={{ height: `${Math.max(10, trend.hires)}px` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          style={{ width: compareResult ? '40%' : '60%', background: trend.hires > 0 ? 'var(--color-accent-2)' : 'var(--color-accent-1)', borderRadius: '4px 4px 0 0', opacity: trend.hires > 0 ? 1 : 0.6 }}
                        />
                        {/* Comparison Bar */}
                        {compareResult && (
                          <motion.div 
                            initial={{ height: 0 }} animate={{ height: `${Math.max(10, compareResult.predictions.hiringTrends[i].hires)}px` }}
                            transition={{ duration: 1, delay: i * 0.1 + 0.2 }}
                            style={{ width: '40%', background: compareResult.predictions.hiringTrends[i].hires > 0 ? 'var(--color-accent-3)' : 'var(--color-accent-1)', borderRadius: '4px 4px 0 0', opacity: compareResult.predictions.hiringTrends[i].hires > 0 ? 0.8 : 0.4 }}
                          />
                        )}
                      </div>
                      <span className="text-muted" style={{ fontSize: '0.8rem' }}>{trend.year}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: 'var(--color-accent-2)' }}></div> {primaryResult.scenario}</div>
                  {compareResult && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: 12, height: 12, background: 'var(--color-accent-3)' }}></div> {compareResult.scenario}</div>}
                </div>
              </div>

              <div className="card">
                <h3 className="card-title"><TrendingUp style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} /> Expected Salary Growth</h3>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div style={{ fontSize: '5rem', fontWeight: 900, background: 'linear-gradient(45deg, var(--color-accent-2), #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    +{primaryResult.predictions.salaryGrowth}%
                  </div>
                  <p className="text-muted">Average projected growth by 2028</p>
                  
                  {compareResult && (
                    <div style={{ marginTop: '2rem', textAlign: 'center', padding: '1rem', borderTop: '1px solid var(--glass-border)', width: '100%' }}>
                      <span className="text-muted" style={{ display: 'block', marginBottom: '0.5rem' }}>Compared to {compareResult.scenario}</span>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-accent-3)' }}>+{compareResult.predictions.salaryGrowth}%</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3" style={{ marginBottom: '2rem' }}>
              <div className="card">
                <h3 className="card-title">Emerging Job Roles</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {primaryResult.predictions.emergingRoles.map((role, i) => (
                    <li key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <ChevronRight size={16} color="var(--color-accent-2)" /> {role}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card">
                <h3 className="card-title">Future Tech Stack</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
                  {primaryResult.predictions.futureTechStack.map((tech, i) => (
                    <span key={i} className="badge badge-secondary" style={{ fontSize: '0.9rem', padding: '0.75rem 1.25rem' }}>{tech}</span>
                  ))}
                  {primaryResult.recommendations.futureTechnologies.map((tech, i) => (
                    <span key={`f-${i}`} className="badge badge-accent" style={{ fontSize: '0.9rem', padding: '0.75rem 1.25rem' }}>{tech}</span>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="card-title">Skill Demand Analytics</h3>
                <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {primaryResult.predictions.skillDemand.map((skill, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        <span>{skill.skill}</span>
                        <span className="text-primary">{skill.demandLevel}%</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${skill.demandLevel}%` }}
                          transition={{ duration: 1, delay: i * 0.2 }}
                          style={{ height: '100%', background: 'var(--color-accent-2)' }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(32, 227, 178, 0.05), rgba(124, 58, 237, 0.1))', borderColor: 'var(--color-accent-3)' }}>
              <h2 className="card-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>AI Career Recommendation Engine</h2>
              
              <div className="grid grid-cols-2">
                <div>
                  <h4 style={{ color: 'var(--color-accent-2)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Recommended Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
                    {primaryResult.recommendations.skills.map((s, i) => <span key={i} className="badge badge-primary">{s}</span>)}
                  </div>

                  <h4 style={{ color: 'var(--color-accent-3)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Key Certifications & Courses</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: 'rgba(255,255,255,0.8)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {primaryResult.recommendations.certifications.map((c, i) => <li key={i}>{c}</li>)}
                    {primaryResult.recommendations.courses.map((c, i) => <li key={`cr-${i}`}>{c}</li>)}
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: 'var(--color-text-light)', marginBottom: '1.5rem' }}>Career Preparation Roadmap</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
                    {primaryResult.recommendations.roadmap.map((step, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-1.5rem', transform: 'translateX(-50%)', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-accent-2)', boxShadow: '0 0 10px var(--color-accent-2)' }}></div>
                        <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{step.phase}</div>
                        <div className="text-muted" style={{ fontSize: '0.9rem' }}>{step.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
