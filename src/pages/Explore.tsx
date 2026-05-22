import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCompanies } from '../hooks/useCompanies';
import type { Company } from '../hooks/useCompanies';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, Search, Building2, Globe } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
} as any;
const getValidUrl = (url: string | null | undefined, type: 'web' | 'linkedin' | 'twitter') => {
  if (!url || typeof url !== 'string') return null;
  
  // Some database rows have entire paragraphs in the URL fields due to bad scraping.
  if (url.length > 200) return null;
  
  // Extract the first item if separated by semicolon (e.g. "url1; url2")
  let clean = url.split(';')[0].trim();
  
  if (!clean || clean === 'N/A' || clean === '-') return null;
  
  // If it's clearly a paragraph of text (multiple spaces) and not an absolute URL, reject it
  if (clean.split(' ').length > 3 && !clean.startsWith('http')) return null;

  if (clean.startsWith('http')) return clean;

  if (type === 'twitter') {
    if (clean.includes(' ')) return null; // Twitter handles do not have spaces
    return `https://twitter.com/${clean.replace(/^@/, '')}`;
  }
  if (type === 'linkedin') {
    if (clean.toLowerCase().includes('linkedin.com')) {
      return `https://${clean.replace(/^(https?:\/\/)?(www\.)?/, '')}`;
    }
    // If it's a handle or company name, ensure it's not a sentence
    if (clean.length > 50) return null;
    return `https://linkedin.com/company/${clean.replace(/\s+/g, '-').toLowerCase()}`;
  }
  
  // For website, it must not have spaces and should have a dot (e.g. google.com)
  if (clean.includes(' ') || !clean.includes('.')) return null;
  return `https://${clean.replace(/^(https?:\/\/)?/, '')}`;
};

const LinkedinIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);

const CompanyCard = ({ company }: { company: Company }) => (
  <motion.div variants={itemVariants} style={{ height: '100%' }}>
    <motion.div 
      className="card"
      whileHover={{ y: -8, boxShadow: '0 12px 30px rgba(32, 227, 178, 0.15)', borderColor: 'rgba(32, 227, 178, 0.3)' }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Link to={`/company/${company.company_id}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', flexShrink: 0 }}>
            <img 
              src={typeof company.logo_url === 'string' ? company.logo_url.split(';')[0].trim() : company.logo_url || 'https://placehold.co/100x100/0E2931/FFF?text=' + company.name?.substring(0, 2)} 
              alt={company.name} 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/0E2931/FFF?text=' + company.name?.substring(0, 2); }}
            />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '1.25rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.name}</h3>
            <span className="text-primary" style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.category}</span>
          </div>
        </div>

        <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {company.overview_text || 'No description available.'}
        </p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto', overflow: 'hidden', maxHeight: '28px' }}>
          {(typeof company.focus_sectors === 'string' ? company.focus_sectors.split(/[,;]/) : company.focus_sectors || [])
            .map(s => s.trim())
            .filter(s => s && !s.includes('http') && !s.includes('www')) // Remove URLs
            .slice(0, 3) // Max 3 badges
            .map(sector => (
              <span key={sector} className="badge badge-secondary" style={{ lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{sector}</span>
            ))}
        </div>
      </Link>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {getValidUrl(company.website_url, 'web') && (
          <a href={getValidUrl(company.website_url, 'web')!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', zIndex: 10, position: 'relative' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
            <Globe size={18} />
          </a>
        )}
        {getValidUrl(company.linkedin_url, 'linkedin') && (
          <a href={getValidUrl(company.linkedin_url, 'linkedin')!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', zIndex: 10, position: 'relative' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
            <LinkedinIcon size={18} />
          </a>
        )}
        {getValidUrl(company.twitter_handle, 'twitter') && (
          <a href={getValidUrl(company.twitter_handle, 'twitter')!} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-muted)', transition: 'color 0.2s', zIndex: 10, position: 'relative' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
            <TwitterIcon size={18} />
          </a>
        )}
      </div>
    </motion.div>
  </motion.div>
);

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const initialSearch = searchParams.get('search') || '';
  
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  
  // Debounce search query to prevent spamming the database
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (debouncedSearch) params.set('search', debouncedSearch);
    setSearchParams(params, { replace: true });
  }, [filterCategory, debouncedSearch, setSearchParams]);

  // Server-side filtering
  const { companies, isLoading, error } = useCompanies(filterCategory || undefined, debouncedSearch || undefined);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Explore <span className="text-primary">Companies</span></h1>
          <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px' }}>Discover top-tier employers, filter by sector, and analyze deep hiring metrics in real-time.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}
            />
          </div>
          
          <div style={{ position: 'relative' }}>
            <Filter size={18} className="text-primary" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <select 
              className="form-control" 
              style={{ paddingLeft: '2.5rem', width: '200px', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', appearance: 'none', cursor: 'pointer' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Tech Giants">Tech Giants</option>
              <option value="Product Companies">Product Companies</option>
              <option value="Service Companies">Service Companies</option>
              <option value="Startups">Startups</option>
              <option value="Large Private Financial Services Company">Financial Services</option>
            </select>
          </div>
        </div>
      </header>

      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(32, 227, 178, 0.3)', borderTopColor: 'var(--color-accent-2)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
      )}
      
      {error && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', borderColor: 'rgba(255,51,102,0.3)' }}>
          <h3 className="text-accent">Connection Error</h3>
          <p className="text-muted">Unable to fetch company directory from the database.</p>
        </div>
      )}
      
      <AnimatePresence mode="wait">
        {!isLoading && !error && companies.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="card" 
            style={{ textAlign: 'center', padding: '6rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
              <Building2 size={48} className="text-muted" />
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>No Matches Found</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '400px' }}>We couldn't find any companies matching "{searchQuery || filterCategory}". Try adjusting your filters.</p>
            {(searchQuery || filterCategory) && (
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '2rem' }}
                onClick={() => { setSearchQuery(''); setFilterCategory(''); }}
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}

        {!isLoading && !error && companies.length > 0 && (
          <motion.div 
            className="grid grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {companies.map(company => (
              <CompanyCard key={String(company.company_id)} company={company} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
