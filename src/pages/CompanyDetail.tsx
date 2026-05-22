import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCompany } from '../hooks/useCompanies';

export default function CompanyDetail() {
  const { id } = useParams();
  const { company, isLoading, error } = useCompany(id);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!company) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    const sectionIds = ['overview', 'business', 'culture', 'learning', 'compensation', 'logistics', 'financials', 'technology', 'leadership', 'brand'];
    
    // We use setTimeout to ensure the DOM is rendered before observing, since company state update triggers render
    setTimeout(() => {
      sectionIds.forEach((sid) => {
        const element = document.getElementById(sid);
        if (element) observer.observe(element);
      });
    }, 100);

    return () => observer.disconnect();
  }, [company]);

  if (isLoading) {
    return <div className="p-8">Loading company details...</div>;
  }

  if (error) {
    return <div className="p-8 text-accent">Error loading company details.</div>;
  }

  if (!company) {
    return <div className="p-8">Company not found.</div>;
  }

  const sections = [
    { 
      id: 'overview', title: 'Company Overview', 
      content: [{ label: 'Overview', value: company.overview_text || company.nature_of_company }]
    },
    { 
      id: 'business', title: 'Business & Market', 
      content: [
        { label: 'Core Value Proposition', value: company.core_value_proposition },
        { label: 'Offerings', value: company.offerings_description },
        { label: 'Top Customers', value: company.top_customers }
      ]
    },
    { 
      id: 'culture', title: 'Culture & Work', 
      content: [
        { label: 'Culture Summary', value: company.work_culture_summary },
        { label: 'Typical Hours', value: company.typical_hours },
        { label: 'Leave Policy', value: company.leave_policy }
      ]
    },
    { 
      id: 'learning', title: 'Learning & Career Signal', 
      content: [
        { label: 'Learning Culture', value: company.learning_culture },
        { label: 'Exposure Quality', value: company.exposure_quality },
        { label: 'Skill Relevance', value: company.skill_relevance }
      ]
    },
    { 
      id: 'compensation', title: 'Compensation', 
      content: [
        { label: 'Pay Structure', value: company.fixed_vs_variable_pay },
        { label: 'Bonus Predictability', value: company.bonus_predictability },
        { label: 'ESOPs & Incentives', value: company.esops_incentives },
        { label: 'Relocation Support', value: company.relocation_support }
      ]
    },
    { 
      id: 'logistics', title: 'Work Logistics & Safety', 
      content: [
        { label: 'Location Centrality', value: company.location_centrality },
        { label: 'Transport / Cab Policy', value: company.cab_policy },
        { label: 'Flexibility Level', value: company.flexibility_level },
        { label: 'Remote Policy', value: company.remote_policy_details }
      ]
    },
    { 
      id: 'financials', title: 'Financials & Risk', 
      content: [
        { label: 'Annual Revenue', value: company.annual_revenue },
        { label: 'Annual Profit', value: company.annual_profit },
        { label: 'Valuation', value: company.valuation },
        { label: 'Recent Funding', value: company.recent_funding_rounds }
      ]
    },
    { 
      id: 'technology', title: 'Technology & Innovation', 
      content: [
        { label: 'Tech Stack', value: company.tech_stack },
        { label: 'AI/ML Adoption', value: company.ai_ml_adoption_level },
        { label: 'Automation Level', value: company.automation_level },
        { label: 'Cybersecurity Posture', value: company.cybersecurity_posture }
      ]
    },
    { 
      id: 'leadership', title: 'Leadership & Contacts', 
      content: [
        { label: 'CEO', value: company.ceo_name },
        { label: 'Key Leaders', value: company.key_leaders },
        { label: 'Primary Contact', value: company.contact_person_email }
      ]
    },
    { 
      id: 'brand', title: 'Brand & Digital Presence', 
      content: [
        { label: 'Brand Value', value: company.brand_value },
        { label: 'Website', value: company.website_url },
        { label: 'Glassdoor Rating', value: company.glassdoor_rating },
        { label: 'LinkedIn', value: company.linkedin_url }
      ]
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '96px', height: '96px', borderRadius: '16px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <img 
            src={typeof company.logo_url === 'string' ? company.logo_url.split(';')[0].trim() : company.logo_url || 'https://placehold.co/100x100/0E2931/FFF?text=' + company.name.substring(0, 2)} 
            alt={company.name} 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/0E2931/FFF?text=' + company.name.substring(0, 2); }}
          />
        </div>
        <div>
          <h1 style={{ marginBottom: '0.5rem', fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.03em' }}>{company.name}</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">{company.category}</span>
            <span className="text-muted">Size: {company.employee_size || 'N/A'}</span>
            <span className="text-muted">Growth: {company.yoy_growth_rate || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <div style={{ width: '250px', position: 'sticky', top: '100px', flexShrink: 0 }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--color-accent-2)' }}>Sections</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sections.map(section => (
                <li key={section.id}>
                  <a 
                    href={`#${section.id}`} 
                    className="nav-link" 
                    style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      padding: '0.5rem 1rem',
                      color: activeSection === section.id ? 'var(--color-primary)' : 'var(--color-text)',
                      backgroundColor: activeSection === section.id ? 'rgba(32, 227, 178, 0.1)' : 'transparent',
                      borderRadius: '8px',
                      fontWeight: activeSection === section.id ? 600 : 400,
                      transition: 'all 0.2s',
                      textDecoration: 'none'
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(section.id);
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 100;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                      setActiveSection(section.id);
                    }}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem', minWidth: 0 }}>
          {sections.map(section => (
            <motion.section 
              key={section.id} 
              id={section.id} 
              className="card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              style={{ scrollMarginTop: '100px' }}
            >
              <h2 className="text-primary" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                {section.title}
              </h2>
              <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: '1.8', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                {section.content.filter(c => c.value).length > 0 ? (
                  section.content.filter(c => c.value).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: 'var(--color-accent-2)', marginBottom: '0.25rem', fontSize: '1.1rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{item.label}</h4>
                      <div>{item.value}</div>
                    </div>
                  ))
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No data available for this section.</span>
                )}
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
