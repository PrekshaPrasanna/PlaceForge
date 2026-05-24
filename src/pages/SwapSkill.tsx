import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Search, Filter, Plus, Star, Trash2, Zap, RefreshCw, Briefcase, Code, PenTool, TrendingUp, Compass, User, Clock, CheckCircle } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  category: string;
  proficiency_level: string;
  posted_by: string;
  description: string;
  created_at: string;
  hot: boolean;
  fav: boolean;
}

const CAT_COLORS: Record<string, string> = {
  Technology: 'var(--color-accent-2)',
  Design: '#00e5ff',
  Marketing: '#ff007f',
  Finance: '#34d399',
};

export default function SwapSkill() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [view, setView] = useState<'board' | 'post' | 'favorites'>('board');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLvl, setFilterLvl] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Post Form State
  const [fName, setFName] = useState('');
  const [fCat, setFCat] = useState('');
  const [fLvl, setFLvl] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fPoster, setFPoster] = useState('Raghavendra R'); // Mock User
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);
  
  const showToast = (msg: string, type: string = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSkills = async () => {
    try {
      setIsRefreshing(true);
      const [skillsRes, favsRes] = await Promise.all([
        supabase.from('skills_board').select('*').order('created_at', { ascending: false }),
        supabase.from('favorites').select('skill_id')
      ]);
      
      if (skillsRes.error) throw skillsRes.error;
      
      const favSet = new Set(favsRes.data?.map(f => f.skill_id) || []);
      const loadedSkills: Skill[] = (skillsRes.data || []).map(row => ({
        id: row.id,
        skill_name: row.skill_name,
        category: row.category,
        proficiency_level: row.proficiency_level,
        posted_by: row.posted_by,
        description: row.description || '',
        created_at: row.created_at,
        hot: row.hot,
        fav: favSet.has(row.id)
      }));
      setSkills(loadedSkills);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('Error loading skills', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSkills();
    const channel = supabase.channel('realtime-favorites-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, fetchSkills)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleFav = async (id: string, currentFav: boolean) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, fav: !currentFav } : s));
    showToast(!currentFav ? 'Added to Favorites!' : 'Removed from Favorites', 'success');
    
    try {
      if (!currentFav) {
        await supabase.from('favorites').insert([{ skill_id: id }]);
      } else {
        await supabase.from('favorites').delete().eq('skill_id', id);
      }
    } catch (e) {
      showToast('Failed to save favorite', 'error');
    }
  };

  const confirmDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    setSkills(prev => prev.filter(s => s.id !== id));
    showToast('Skill deleted', 'info');
    try {
      await supabase.from('skills_board').delete().eq('id', id);
    } catch (e) {
      showToast('Failed to delete skill', 'error');
    }
  };

  const handleRequestSwap = async (id: string) => {
    try {
      await supabase.from('skill_swaps').insert([{ skill_id: id, user_id: 'anonymous', status: 'pending' }]);
      showToast('Swap request sent successfully!', 'success');
    } catch (e) {
      showToast('Failed to send swap request', 'error');
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName || !fCat || !fLvl) { showToast('Please fill required fields', 'error'); return; }
    
    setPosting(true);
    const newSkillData = {
      skill_name: fName, category: fCat, proficiency_level: fLvl,
      posted_by: fPoster, description: fDesc, hot: false, fav: false
    };

    try {
      const { data, error } = await supabase.from('skills_board').insert([newSkillData]).select().single();
      if (error) throw error;
      
      setSkills(prev => [{...newSkillData, id: data.id, created_at: data.created_at} as Skill, ...prev]);
      showToast('✅ Skill posted successfully!', 'success');
      setView('board');
      setFName(''); setFDesc(''); setFCat(''); setFLvl('');
    } catch (e) {
      showToast('Failed to post skill', 'error');
    } finally {
      setPosting(false);
    }
  };

  // Computations
  const filteredSkills = useMemo(() => {
    let r = skills;
    if (view === 'favorites') r = r.filter(s => s.fav);
    if (search) r = r.filter(s => s.skill_name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()));
    if (filterCat) r = r.filter(s => s.category === filterCat);
    if (filterLvl) r = r.filter(s => s.proficiency_level === filterLvl);
    return r;
  }, [skills, view, search, filterCat, filterLvl]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    skills.forEach(s => counts[s.category] = (counts[s.category] || 0) + 1);
    return Object.entries(counts).sort((a,b) => b[1] - a[1]);
  }, [skills]);

  return (
    <div className="app-container">
      <div className="main-content" style={{ maxWidth: '1600px', width: '100%' }}>
        
        {/* Header */}
        <header className="dashboard-header" style={{ marginBottom: '2rem' }}>
          <div>
            <span className="badge badge-accent" style={{ marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={14} /> Peer-to-Peer Learning
            </span>
            <h1>Skill <span style={{ color: 'var(--color-accent-2)' }}>Swap</span> Platform</h1>
            <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px' }}>
              Share your expertise and discover what others can teach you. Match with peers to swap skills and accelerate your learning journey.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={fetchSkills} disabled={isRefreshing} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={16} className={isRefreshing ? "spin" : ""} /> Refresh
            </button>
            <button className="btn btn-accent" onClick={() => setView('post')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={18} /> Post a Skill
            </button>
          </div>
        </header>

        {/* Top Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card stat-card" style={{ borderColor: 'var(--glass-border)', gridColumn: 'span 1' }}>
            <div className="stat-value" style={{ color: 'var(--color-text-light)' }}>{skills.length}</div>
            <div className="stat-label">Total Skills Available</div>
          </div>
          <div className="card stat-card" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="stat-value" style={{ color: 'var(--color-accent-2)' }}>{skills.filter(s => s.category === 'Technology').length}</div>
            <div className="stat-label">Tech Skills</div>
          </div>
          <div className="card stat-card" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="stat-value" style={{ color: 'var(--color-accent-4)' }}>{skills.filter(s => s.proficiency_level === 'Expert').length}</div>
            <div className="stat-label">Expert Level</div>
          </div>
          <div className="card stat-card" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="stat-value" style={{ color: 'var(--color-accent-3)' }}>{skills.filter(s => s.fav).length}</div>
            <div className="stat-label">Your Favorites</div>
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '280px 1fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '100px' }}>
            <div className="card" style={{ padding: '1.5rem', borderColor: 'var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Navigation</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button 
                  onClick={() => setView('board')} 
                  style={{ background: view === 'board' ? 'rgba(32, 227, 178, 0.1)' : 'transparent', color: view === 'board' ? 'var(--color-accent-2)' : '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                  <Compass size={18} /> Skills Board
                </button>
                <button 
                  onClick={() => setView('favorites')} 
                  style={{ background: view === 'favorites' ? 'rgba(32, 227, 178, 0.1)' : 'transparent', color: view === 'favorites' ? 'var(--color-accent-2)' : '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                  <Star size={18} /> My Favorites
                </button>
                <button 
                  onClick={() => setView('post')} 
                  style={{ background: view === 'post' ? 'rgba(32, 227, 178, 0.1)' : 'transparent', color: view === 'post' ? 'var(--color-accent-2)' : '#fff', padding: '0.75rem 1rem', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}>
                  <Plus size={18} /> Post a Skill
                </button>
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', borderColor: 'var(--glass-border)' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Categories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div 
                  onClick={() => setFilterCat('')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', cursor: 'pointer', color: !filterCat ? 'var(--color-accent-2)' : '#fff', fontWeight: !filterCat ? 700 : 400 }}>
                  <span>All Categories</span>
                  <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{skills.length}</span>
                </div>
                {catCounts.map(([cat, count]) => (
                  <div 
                    key={cat} 
                    onClick={() => setFilterCat(cat)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', cursor: 'pointer', color: filterCat === cat ? 'var(--color-accent-2)' : '#fff', fontWeight: filterCat === cat ? 700 : 400 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: CAT_COLORS[cat] || '#ccc' }} />
                      {cat}
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {(view === 'board' || view === 'favorites') && (
              <AnimatePresence mode="wait">
                <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  
                  {/* Toolbar */}
                  <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem 1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.4)', borderRadius: '100px', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}>
                      <Search size={18} style={{ color: 'var(--color-accent-2)' }} />
                      <input 
                        type="text" 
                        placeholder="Search for skills..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', padding: '0.2rem 0.5rem', flex: 1, outline: 'none', fontSize: '0.95rem' }} 
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: '100px', padding: '0.5rem 1rem', border: '1px solid var(--glass-border)' }}>
                      <Filter size={16} style={{ color: 'var(--color-text-muted)' }} />
                      <select 
                        value={filterLvl} 
                        onChange={(e) => setFilterLvl(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', cursor: 'pointer' }}>
                        <option value="" style={{ background: '#111' }}>All Levels</option>
                        <option value="Beginner" style={{ background: '#111' }}>Beginner</option>
                        <option value="Intermediate" style={{ background: '#111' }}>Intermediate</option>
                        <option value="Advanced" style={{ background: '#111' }}>Advanced</option>
                        <option value="Expert" style={{ background: '#111' }}>Expert</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid */}
                  <div className="grid grid-cols-3">
                    {filteredSkills.length === 0 ? (
                      <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
                        <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <h3>No skills found</h3>
                        <p>Try adjusting your search or filters.</p>
                      </div>
                    ) : (
                      filteredSkills.map(s => (
                        <motion.div 
                          key={s.id}
                          className="card"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ y: -5, borderColor: 'var(--color-accent-2)', boxShadow: '0 10px 30px rgba(32, 227, 178, 0.1)' }}
                          style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', cursor: 'pointer' }}
                          onClick={() => navigate(`/swap-skill/skill/${s.id}`)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#fff' }}>{s.skill_name}</h3>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleFav(s.id, s.fav); }}
                              style={{ background: 'transparent', border: 'none', color: s.fav ? 'var(--color-accent-4)' : 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Star fill={s.fav ? 'var(--color-accent-4)' : 'none'} size={20} />
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-primary" style={{ background: 'rgba(255,255,255,0.05)', color: CAT_COLORS[s.category] || '#fff' }}>{s.category}</span>
                            <span className="badge badge-secondary">{s.proficiency_level}</span>
                            {s.hot && <span className="badge badge-accent">Trending</span>}
                          </div>

                          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', flex: 1, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {s.description || 'No description provided.'}
                          </p>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: 'auto' }}>
                            <User size={14} />
                            <span>{s.posted_by}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRequestSwap(s.id); }}
                              className="btn btn-accent" 
                              style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}
                            >
                              <RefreshCw size={14} /> Request Swap
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); confirmDelete(s.id, s.skill_name); }}
                              className="btn btn-secondary" 
                              style={{ padding: '0.5rem', background: 'rgba(255,0,0,0.1)', color: '#ff4d6d' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Post View */}
            {view === 'post' && (
              <AnimatePresence mode="wait">
                <motion.div key="post" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <div className="card" style={{ padding: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                      <div style={{ background: 'rgba(32, 227, 178, 0.1)', color: 'var(--color-accent-2)', padding: '1rem', borderRadius: '16px' }}>
                        <Plus size={24} />
                      </div>
                      <div>
                        <h2>Share Your Knowledge</h2>
                        <p className="text-muted">Create a new skill listing so others can learn from you.</p>
                      </div>
                    </div>

                    <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="grid grid-cols-2">
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontWeight: 600 }}>Skill Name *</label>
                          <input 
                            type="text" 
                            required 
                            placeholder="e.g. React.js, UI Design" 
                            value={fName} 
                            onChange={e => setFName(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}
                          />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontWeight: 600 }}>Your Name</label>
                          <input 
                            type="text" 
                            value={fPoster} 
                            onChange={e => setFPoster(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2">
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontWeight: 600 }}>Category *</label>
                          <select 
                            required
                            value={fCat} 
                            onChange={e => setFCat(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}>
                            <option value="" disabled style={{ background: '#111' }}>Select category</option>
                            <option value="Technology" style={{ background: '#111' }}>Technology</option>
                            <option value="Design" style={{ background: '#111' }}>Design</option>
                            <option value="Marketing" style={{ background: '#111' }}>Marketing</option>
                            <option value="Finance" style={{ background: '#111' }}>Finance</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <label style={{ fontWeight: 600 }}>Proficiency Level *</label>
                          <select 
                            required
                            value={fLvl} 
                            onChange={e => setFLvl(e.target.value)}
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none' }}>
                            <option value="" disabled style={{ background: '#111' }}>Select level</option>
                            <option value="Beginner" style={{ background: '#111' }}>Beginner</option>
                            <option value="Intermediate" style={{ background: '#111' }}>Intermediate</option>
                            <option value="Advanced" style={{ background: '#111' }}>Advanced</option>
                            <option value="Expert" style={{ background: '#111' }}>Expert</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600 }}>Description</label>
                        <textarea 
                          placeholder="What can you teach? What are your experiences?" 
                          rows={4}
                          value={fDesc} 
                          onChange={e => setFDesc(e.target.value)}
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', padding: '0.75rem 1rem', borderRadius: '12px', color: '#fff', outline: 'none', resize: 'vertical' }}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setView('board')}>Cancel</button>
                        <button type="submit" className="btn btn-accent" disabled={posting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {posting ? 'Posting...' : <><CheckCircle size={18} /> Publish Skill</>}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem',
              background: toast.type === 'success' ? 'rgba(32, 227, 178, 0.95)' : toast.type === 'error' ? 'rgba(255, 51, 102, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              color: toast.type === 'info' ? '#000' : '#fff',
              padding: '1rem 1.5rem', borderRadius: '12px', fontWeight: 700,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 9999
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
