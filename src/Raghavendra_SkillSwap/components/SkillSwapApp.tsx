import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import '../styles/skillswap.css';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Skill {
  id: string;
  skillName: string;
  category: string;
  proficiencyLevel: string;
  postedBy: string;
  description: string;
  createdAt: string;
  hot: boolean;
  fav: boolean;
}

interface Activity {
  type: 'post' | 'del' | 'view' | 'fav';
  text: string;
  time: string;
}

// ── Initial Data ──────────────────────────────────────────────────────────────
const INITIAL_ACTIVITIES: Activity[] = [
  { type:'post', text:'<strong>Raghavendra R</strong> posted a new skill: <strong>React.js</strong>', time:'2m ago' },
  { type:'fav',  text:'<strong>Priya S</strong> favorited <strong>Node.js & Express</strong>', time:'15m ago' },
  { type:'view', text:'<strong>Arjun M</strong> viewed <strong>UI/UX Design</strong>', time:'42m ago' },
  { type:'post', text:'<strong>Sneha K</strong> posted a new skill: <strong>Digital Marketing</strong>', time:'1h ago' },
  { type:'del',  text:'<strong>Kiran P</strong> removed a skill listing', time:'3h ago' },
  { type:'view', text:'<strong>Rohan D</strong> viewed <strong>Financial Modeling</strong>', time:'5h ago' },
];

const CAT_COLORS: Record<string, string> = {
  Technology:'var(--color-accent-2)', Design:'#00e5ff', Marketing:'#ff007f', Finance:'#34d399',
};
const CAT_EMOJIS: Record<string, string> = {
  Technology:'', Design:'', Marketing:'', Finance:'',
};
const LVL_CLASS: Record<string, string> = {
  Beginner:'beginner', Intermediate:'intermediate', Advanced:'advanced', Expert:'expert',
};
const LVL_EMOJI: Record<string, string> = {
  Beginner:'', Intermediate:'', Advanced:'', Expert:'',
};
const ACT_ICON: Record<string, string> = { post:'•', del:'•', view:'•', fav:'•' };
const ACT_DOT_CLASS: Record<string, string> = { post:'act-post', del:'act-del', view:'act-view', fav:'act-fav' };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
interface ToastItem { id: number; msg: string; type: string; }

// ── Main Component ────────────────────────────────────────────────────────────
export default function SkillSwapApp() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [activities, setActivities] = useState<Activity[]>(INITIAL_ACTIVITIES);
  const [view, setView] = useState<'board' | 'post' | 'activity' | 'favorites' | 'profile'>('board');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterLvl, setFilterLvl] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az'>('newest');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [requestingSkillId, setRequestingSkillId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Skill | null>(null);
  const [isGrid, setIsGrid] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form state
  const [fName, setFName]       = useState('');
  const [fPoster, setFPoster]   = useState('');
  const [fCat, setFCat]         = useState('');
  const [fLvl, setFLvl]         = useState('');
  const [fDesc, setFDesc]       = useState('');
  const [fMsg, setFMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [posting, setPosting]   = useState(false);
  const [errName, setErrName]   = useState('');
  const [errCat, setErrCat]     = useState('');
  const [errLvl, setErrLvl]     = useState('');

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:   skills.length,
    tech:    skills.filter(s => s.category === 'Technology').length,
    expert:  skills.filter(s => s.proficiencyLevel === 'Expert').length,
    members: new Set(skills.map(s => s.postedBy)).size,
    mySkills: skills.filter(s => s.postedBy === 'Raghavendra R').length,
  }), [skills]);

  // ── Post Form Submissions ────────────────────────────────────────────────────────
  const catCounts = useMemo(() => {
    const c: Record<string, number> = {};
    skills.forEach(s => { c[s.category] = (c[s.category] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [skills]);

  // ── Filtered skills ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = [...skills];
    if (view === 'favorites') {
      r = r.filter(s => s.fav);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => s.skillName.toLowerCase().includes(q) || (s.description||'').toLowerCase().includes(q));
    }
    if (filterCat) r = r.filter(s => s.category === filterCat);
    if (filterLvl) r = r.filter(s => s.proficiencyLevel === filterLvl);
    if (sortBy === 'oldest') r.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sortBy === 'az') r.sort((a, b) => a.skillName.localeCompare(b.skillName));
    else r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return r;
  }, [skills, search, filterCat, filterLvl, sortBy, view]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const toast = useCallback((msg: string, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3200);
  }, []);

  // ── Handle Swap Request Action ─────────────────────────────────────────────

  // ── Fetch Data from Supabase ───────────────────────────────────────────────
  const fetchSkills = useCallback(async () => {
    try {
      const [skillsRes, favsRes] = await Promise.all([
        supabase.from('skills_board').select('*').order('created_at', { ascending: false }),
        supabase.from('favorites').select('skill_id')
      ]);
        
      if (skillsRes.error) {
        toast('❌ Error loading skills from database', 'error');
        console.error(skillsRes.error);
        return;
      }
      
      const favSet = new Set(favsRes.data?.map(f => f.skill_id) || []);
      
      if (skillsRes.data) {
        const loadedSkills: Skill[] = skillsRes.data.map(row => ({
          id: row.id,
          skillName: row.skill_name,
          category: row.category,
          proficiencyLevel: row.proficiency_level,
          postedBy: row.posted_by,
          description: row.description || '',
          createdAt: row.created_at,
          hot: row.hot,
          fav: favSet.has(row.id)
        }));
        setSkills(loadedSkills);
      }
    } catch (error) {
      toast('❌ Error loading skills from database', 'error');
      console.error('Fetch skills error:', error);
    }
  }, [toast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSkills();
    setTimeout(() => setIsRefreshing(false), 500); // Brief delay for visual feedback
  };

  useEffect(() => {
    fetchSkills();

    // Set up realtime channel subscription to listen for favorites additions/deletions
    // This immediately syncs the favorites count from 0 to 1 on the dashboard!
    const channel = supabase
      .channel('realtime-favorites-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'favorites' }, () => {
        fetchSkills();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSkills]);

  // ── Favorites toggle ─────────────────────────────────────────────────────────────
  const toggleFav = async (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    
    const newFav = !skill.fav;
    
    // Optimistic update
    setSkills(prev => prev.map(s => s.id === id ? { ...s, fav: newFav } : s));
    
    // Trigger beautiful green glow toast notification
    toast(newFav ? 'Added to Favorites!' : 'Removed from Favorites', 'success');
    
    // Database update
    let error;
    try {
      if (newFav) {
        const res = await supabase.from('favorites').insert([{ skill_id: id }]);
        error = res.error;
      } else {
        const res = await supabase.from('favorites').delete().eq('skill_id', id);
        error = res.error;
      }
    } catch (e) {
      error = e;
    }
      
    if (error) {
      toast('❌ Failed to save favorite to DB', 'error');
      console.error(error);
      // Revert if error
      setSkills(prev => prev.map(s => s.id === id ? { ...s, fav: skill.fav } : s));
    }
  };

  const handleRequestSwap = async (skillId: string) => {
    if (!skillId) return;
    setRequestingSkillId(skillId);

    try {
      const { error } = await supabase.from('skill_swaps').insert([
        { skill_id: skillId, user_id: 'anonymous', status: 'pending' }
      ]);

      if (error) {
        toast('❌ Failed to send swap request', 'error');
        console.error(error);
      } else {
        toast('Swap request sent successfully!', 'success');
      }
    } catch (e) {
      toast('❌ Failed to send swap request', 'error');
      console.error(e);
    }

    setRequestingSkillId(null);
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const targetName = deleteTarget.skillName;
    
    // Optimistic update
    setSkills(prev => prev.filter(s => s.id !== targetId));
    setActivities(prev => [{ type:'del', text:`<strong>You</strong> removed skill: <strong>${targetName}</strong>`, time:'just now' }, ...prev]);
    setDeleteTarget(null);
    toast('Deleting skill...', 'info');

    // Database update
    try {
      const { error } = await supabase
        .from('skills_board')
        .delete()
        .eq('id', targetId);
        
      if (error) {
        toast('Failed to delete skill from DB', 'error');
        console.error(error);
      } else {
        toast('Skill deleted successfully', 'success');
      }
    } catch (e) {
      toast('Failed to delete skill from DB', 'error');
      console.error(e);
    }
  };

  // ── Submit skill ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrName(''); setErrCat(''); setErrLvl(''); setFMsg(null);
    let valid = true;
    if (!fName.trim()) { setErrName('Skill name is required.'); valid = false; }
    if (!fCat) { setErrCat('Please select a category.'); valid = false; }
    if (!fLvl) { setErrLvl('Please select a level.'); valid = false; }
    if (!valid) return;

    setPosting(true);

    const newSkillData = {
      skill_name: fName.trim(),
      category: fCat,
      proficiency_level: fLvl,
      posted_by: fPoster.trim() || 'Anonymous',
      description: fDesc.trim(),
      hot: false,
      fav: false
    };

    try {
      const { data, error } = await supabase
        .from('skills_board')
        .insert([newSkillData])
        .select()
        .single();

      if (error) {
        toast('❌ Failed to post skill to DB', 'error');
        setFMsg({ text: '❌ Database Error', ok: false });
        setPosting(false);
        return;
      }

      const newSkill: Skill = {
        id: data.id,
        skillName: data.skill_name,
        category: data.category,
        proficiencyLevel: data.proficiency_level,
        postedBy: data.posted_by,
        description: data.description || '',
        createdAt: data.created_at,
        hot: data.hot,
        fav: data.fav,
      };
      
      setSkills(prev => [newSkill, ...prev]);
      setActivities(prev => [{ type:'post', text:`<strong>${newSkill.postedBy}</strong> posted a new skill: <strong>${newSkill.skillName}</strong>`, time:'just now' }, ...prev]);
      setFName(''); setFPoster(''); setFCat(''); setFLvl(''); setFDesc('');
      setSearch(''); setFilterCat(''); setFilterLvl(''); setSortBy('newest'); // Clear filters so new skill is visible
      setFMsg({ text: '✅ Skill posted successfully!', ok: true });
      setTimeout(() => { setFMsg(null); setView('board'); }, 1500);
      toast('✅ Skill posted to the board!', 'success');
    } catch (e) {
      toast('❌ Failed to post skill to DB', 'error');
      setFMsg({ text: '❌ Database Error', ok: false });
    } finally {
      setPosting(false);
    }
  };

  // ── Filter by category (from sidebar) ─────────────────────────────────────
  const filterByCat = (cat: string) => {
    setFilterCat(cat);
    setView('board');
  };

  return (
    <div className="ds-root" style={{ background: 'transparent' }}>


      {/* ══ LAYOUT ═════════════════════════════════════════════════ */}
      <div className="ds-layout">

        {/* ── SIDEBAR ──────────────────────────────────────────── */}
        <aside className="ds-sidebar">
          {/* Profile Card Refactored with Circular picture and glowing border */}
          <div className="ds-sidebar-card" style={{ borderColor: 'rgba(32, 227, 178, 0.15)', boxShadow: '0 0 15px rgba(32, 227, 178, 0.04)' }}>
            <div className="ds-profile-header">
              <div
                className="ds-profile-avatar"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '3px solid var(--color-accent-2)',
                  boxShadow: '0 0 20px rgba(32, 227, 178, 0.45)',
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #111827, #0b0f19)'
                }}
              >
                RR
              </div>
              <div>
                <div className="ds-profile-name">Raghavendra R</div>
                <div className="ds-profile-role" style={{ color: 'var(--color-accent-2)', fontWeight: 600 }}>PlaceForge Developer</div>
              </div>
              <div className="ds-profile-stats">
                <div className="ds-stat-box" style={{ borderColor: 'rgba(32, 227, 178, 0.1)' }}>
                  <div className="ds-stat-num" style={{ color: 'var(--color-accent-2)' }}>{stats.mySkills}</div>
                  <div className="ds-stat-lbl">My Skills</div>
                </div>
                <div className="ds-stat-box" style={{ borderColor: 'rgba(32, 227, 178, 0.1)' }}>
                  <div className="ds-stat-num" style={{ color: 'var(--color-accent-2)' }}>12</div>
                  <div className="ds-stat-lbl">Views</div>
                </div>
                <div className="ds-stat-box" style={{ borderColor: 'rgba(32, 227, 178, 0.1)' }}>
                  <div className="ds-stat-num" style={{ color: 'var(--color-accent-2)' }}>{skills.filter(s => s.fav).length}</div>
                  <div className="ds-stat-lbl">Favorites</div>
                </div>
                <div className="ds-stat-box" style={{ borderColor: 'rgba(32, 227, 178, 0.1)' }}>
                  <div className="ds-stat-num" style={{ color: 'var(--color-accent-2)' }}>2</div>
                  <div className="ds-stat-lbl">Swaps</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="ds-sidebar-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
            <div className="ds-sidebar-title">Navigation</div>
            <div className="ds-sidebar-nav">
              <button
                className={`ds-snav-item ${view==='board' ? 'active':''}`}
                onClick={() => setView('board')}
                style={{ color: view === 'board' ? 'var(--color-accent-2)' : '#E5E7EB' }}
              >
                <span className="ds-snav-icon"></span>
                Skills Board
                <span className="ds-snav-badge" style={{ background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 800 }}>{skills.length}</span>
              </button>
              <button
                className={`ds-snav-item ${view==='post' ? 'active':''}`}
                onClick={() => setView('post')}
                style={{ color: view === 'post' ? 'var(--color-accent-2)' : '#E5E7EB' }}
              >
                <span className="ds-snav-icon"></span>
                Post a Skill
              </button>
              <button
                className={`ds-snav-item ${view==='activity' ? 'active':''}`}
                onClick={() => setView('activity')}
                style={{ color: view === 'activity' ? 'var(--color-accent-2)' : '#E5E7EB' }}
              >
                <span className="ds-snav-icon"></span>
                Recent Activity
                <span className="ds-snav-badge" style={{ background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 800 }}>{activities.length}</span>
              </button>
              <button
                className={`ds-snav-item ${view==='favorites' ? 'active':''}`}
                onClick={() => setView('favorites')}
                style={{ color: view === 'favorites' ? 'var(--color-accent-2)' : '#E5E7EB' }}
              >
                <span className="ds-snav-icon"></span>
                Favorites
              </button>
              <button
                className={`ds-snav-item ${view==='profile' ? 'active':''}`}
                onClick={() => setView('profile')}
                style={{ color: view === 'profile' ? 'var(--color-accent-2)' : '#E5E7EB' }}
              >
                <span className="ds-snav-icon"></span>My Profile
              </button>
            </div>
          </div>

          {/* Categories */}
          <div className="ds-sidebar-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
            <div className="ds-sidebar-title">Browse by Category</div>
            <div className="ds-cat-list">
              {catCounts.map(([cat, cnt]) => (
                <div key={cat} className={`ds-cat-item ${filterCat===cat ? 'active':''}`} onClick={() => filterByCat(cat === filterCat ? '' : cat)}>
                  <div style={{ display:'flex', alignItems:'center', gap:'.5rem' }}>
                    <span className="ds-cat-dot" style={{ background: CAT_COLORS[cat] || 'var(--color-accent-2)' }} />
                    <span style={{ color: filterCat === cat ? 'var(--color-accent-2)' : '#E5E7EB' }}>{cat}</span>
                  </div>
                  <span className="ds-cat-count" style={{ borderColor: filterCat === cat ? 'rgba(32, 227, 178, 0.3)' : 'rgba(255,255,255,0.06)' }}>{cnt}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <div className="ds-content">

          {/* Page Header */}
          <div className="ds-page-header">
            <div>
              <h1 style={{ WebkitTextFillColor: 'initial', color: '#fff' }}>Skill <span style={{ color: 'var(--color-accent-2)', WebkitTextFillColor: 'var(--color-accent-2)', textShadow: '0 0 25px rgba(32, 227, 178, 0.7), 0 0 50px rgba(32, 227, 178, 0.35)' }}>Swap</span> Platform</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Share what you know · Discover what others offer · PlaceForge 2026</p>
            </div>
            <div className="ds-header-actions">
              <button 
                className="ds-btn ds-btn-ghost ds-btn-sm" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                style={{ 
                  borderColor: 'rgba(32, 227, 178, 0.2)', 
                  color: 'var(--color-accent-2)',
                  opacity: isRefreshing ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  cursor: isRefreshing ? 'wait' : 'pointer'
                }}
              >
                {isRefreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
              </button>
              <button className="ds-btn ds-btn-accent ds-btn-sm" onClick={() => setView('post')} style={{ background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 800 }}>+ Post Skill</button>
            </div>
          </div>

          {/* Stat Cards with Neon-Green indicator accents +12%, +8% */}
          <div className="ds-stats-row">
            {[
              { icon:'', val:stats.total,   lbl:'Total Skills Posted', chg:'+12%', up:true },
              { icon:'', val:stats.tech,    lbl:'Tech Skills',         chg:'+8%',  up:true },
              { icon:'', val:stats.expert,  lbl:'Expert Level',        chg:'+3%',  up:true },
              { icon:'', val:stats.members, lbl:'Active Members',      chg:'+6%',  up:true },
            ].map((s, i) => (
              <motion.div key={i} className="ds-stat-card"
                initial={{ opacity:0, y:10 }}
                animate={{ opacity:1, y:0 }}
                transition={{ delay: i*0.07 }}
                style={{
                  borderColor: 'rgba(32, 227, 178, 0.12)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.4), 0 0 10px rgba(32, 227, 178, 0.01)'
                }}
              >
                {s.icon && <div className="ds-stat-card-icon">{s.icon}</div>}
                <div className="ds-stat-card-value" style={{ color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.1)' }}>{s.val}</div>
                <div className="ds-stat-card-label">{s.lbl}</div>
                <div
                  className="ds-stat-card-change"
                  style={{
                    background: 'rgba(32,227,178,0.15)',
                    color: 'var(--color-accent-2)',
                    border: '1px solid rgba(32,227,178,0.3)',
                    boxShadow: '0 0 8px rgba(32,227,178,0.2)'
                  }}
                >
                  {s.chg}
                </div>
              </motion.div>
            ))}
          </div>

          {/* ══ VIEWS ══════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">

            {/* ── BOARD OR FAVORITES VIEW ─────────────────────────────────────── */}
            {(view === 'board' || view === 'favorites') && (
              <motion.div key="board" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <div className="ds-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
                  <div className="ds-card-title">
                    <span className="ds-card-title-icon" style={{ color: 'var(--color-accent-2)' }}>{view === 'favorites' ? '★' : '◆'}</span> {view === 'favorites' ? 'My Favorites' : 'Skills Board'}
                    <span className="ds-card-badge" style={{ background: 'rgba(32, 227, 178, 0.15)', color: 'var(--color-accent-2)', borderColor: 'rgba(32, 227, 178, 0.3)' }}>{filtered.length}</span>
                    <div style={{ marginLeft:'auto', display:'flex', gap:'.5rem' }}>
                      <div className="ds-view-toggle">
                        <button className={`ds-view-btn ${isGrid ? 'active':''}`} onClick={() => setIsGrid(true)} title="Grid view" style={{ color: isGrid ? 'var(--color-accent-2)' : '#E5E7EB', borderColor: isGrid ? 'rgba(32, 227, 178, 0.3)' : 'rgba(255,255,255,0.06)' }}>⊞</button>
                        <button className={`ds-view-btn ${!isGrid ? 'active':''}`} onClick={() => setIsGrid(false)} title="List view" style={{ color: !isGrid ? 'var(--color-accent-2)' : '#E5E7EB', borderColor: !isGrid ? 'rgba(32, 227, 178, 0.3)' : 'rgba(255,255,255,0.06)' }}>☰</button>
                      </div>
                    </div>
                  </div>
                  {/* Sleek Rounded Search Bar & Filters */}
                  <div className="ds-feed-toolbar">
                    <div className="ds-search-wrap">
                      <span className="ds-search-icon" style={{ color: 'var(--color-accent-2)' }}>⌕</span>
                      <input
                        className="ds-search-inp"
                        type="text"
                        placeholder="Search skills..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        autoComplete="off"
                        style={{
                          borderColor: 'rgba(32, 227, 178, 0.2)',
                          boxShadow: '0 0 10px rgba(32, 227, 178, 0.02)'
                        }}
                      />
                    </div>
                    <select className="ds-filter-sel" value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }}>
                      <option value="">All Categories</option>
                      <option value="Technology">Technology</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Finance">Finance</option>
                    </select>
                    <select className="ds-filter-sel" value={filterLvl} onChange={e => setFilterLvl(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }}>
                      <option value="">All Levels</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    <select className="ds-filter-sel" value={sortBy} onChange={e => setSortBy(e.target.value as 'newest'|'oldest'|'az')} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }}>
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="az">A → Z</option>
                    </select>
                  </div>

                  {/* Sleek Skill Cards Grid with Border glows */}
                  <div className={`ds-skills-grid ${isGrid ? '' : 'list-view'}`}>
                    <AnimatePresence>
                      {filtered.length === 0 ? (
                        <div className="ds-empty-state">
                          <span className="ds-empty-icon"></span>
                          <p>No skills match your search. Try different filters!</p>
                        </div>
                      ) : filtered.map((s, i) => (
                        <motion.article key={s.id} className="ds-skill-card"
                          initial={{ opacity:0, y:12 }}
                          animate={{ opacity:1, y:0 }}
                          exit={{ opacity:0, scale:0.95 }}
                          transition={{ delay: i*0.04 }}
                          layout
                          style={{
                            cursor:'pointer',
                            borderColor: 'rgba(32, 227, 178, 0.12)',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                          }}
                          onClick={() => navigate(`/skillswap/skill/${s.id}`)}>
                          <div className="ds-skill-card-top">
                            <h3 className="ds-skill-name">{s.skillName}</h3>
                            <div className="ds-skill-actions">
                              <button className={`ds-icon-btn fav ${s.fav ? 'on':''}`} onClick={e => { e.stopPropagation(); toggleFav(s.id); }} style={{ color: s.fav ? 'var(--color-accent-2)' : '#E5E7EB' }} title="Favorite">{s.fav ? '★' : '☆'}</button>
                              <button className="ds-icon-btn del" onClick={e => { e.stopPropagation(); setDeleteTarget(s); }} title="Delete">✕</button>
                            </div>
                          </div>
                          <div className="ds-skill-tags">
                            <span className="ds-tag ds-tag-cat" style={{ background: 'rgba(32, 227, 178, 0.12)', color: 'var(--color-accent-2)', borderColor: 'rgba(32, 227, 178, 0.25)' }}>
                              {CAT_EMOJIS[s.category]} {s.category}
                            </span>
                            <span className={`ds-tag ds-tag-lvl ${LVL_CLASS[s.proficiencyLevel]||''}`}>
                              {LVL_EMOJI[s.proficiencyLevel]} {s.proficiencyLevel}
                            </span>
                          </div>
                          {s.description && <p className="ds-skill-desc">{s.description}</p>}
                          <div className="ds-skill-meta">
                            <span className="ds-skill-poster">Posted by {s.postedBy}</span>
                            <span>{s.hot ? <span className="ds-skill-hot" style={{ color: 'var(--color-accent-2)' }}>Trending</span> : fmtDate(s.createdAt)}</span>
                          </div>
                          <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem' }}>
                            <button
                              className="ds-btn ds-btn-accent ds-btn-sm"
                              onClick={e => { e.stopPropagation(); handleRequestSwap(s.id); }}
                              disabled={requestingSkillId === s.id}
                              style={{ background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', minWidth: '140px', fontWeight: 700 }}
                            >
                              {requestingSkillId === s.id ? 'Request Sent' : 'Request Swap'}
                            </button>
                            <div style={{ flexGrow: 1, textAlign: 'right', fontSize: '.72rem', color: 'var(--color-accent-2)', fontWeight: 800 }}>View Details →</div>
                          </div>
                        </motion.article>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── POST SKILL VIEW ─────────────────────────────────── */}
            {view === 'post' && (
              <motion.div key="post" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <div className="ds-two-panel">
                  {/* Form */}
                  <div className="ds-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
                    <div className="ds-card-title">Post Your Skill</div>
                    <form onSubmit={handleSubmit} noValidate>
                      <div className="ds-form-row">
                        <div className="ds-form-group">
                          <label>Skill Name <span className="ds-req">*</span></label>
                          <input type="text" placeholder="e.g. React.js, Piano, Spanish" value={fName} onChange={e => setFName(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }} />
                          {errName && <span className="ds-field-err">{errName}</span>}
                        </div>
                        <div className="ds-form-group">
                          <label>Your Name</label>
                          <input type="text" placeholder="e.g. Raghavendra R" value={fPoster} onChange={e => setFPoster(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }} />
                        </div>
                      </div>
                      <div className="ds-form-row">
                        <div className="ds-form-group">
                          <label>Category <span className="ds-req">*</span></label>
                          <select value={fCat} onChange={e => setFCat(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }}>
                            <option value="" disabled>Select category</option>
                            <option value="Technology">Technology</option>
                            <option value="Design">Design</option>
                            <option value="Marketing">Marketing</option>
                            <option value="Finance">Finance</option>
                          </select>
                          {errCat && <span className="ds-field-err">{errCat}</span>}
                        </div>
                        <div className="ds-form-group">
                          <label>Proficiency Level <span className="ds-req">*</span></label>
                          <select value={fLvl} onChange={e => setFLvl(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }}>
                            <option value="" disabled>Select level</option>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                          {errLvl && <span className="ds-field-err">{errLvl}</span>}
                        </div>
                      </div>
                      <div className="ds-form-group">
                        <label>Description <span style={{ color:'var(--ds-muted)', fontWeight:400 }}>(optional)</span></label>
                        <textarea placeholder="Describe your skill or what you can help with..." value={fDesc} onChange={e => setFDesc(e.target.value)} style={{ borderColor: 'rgba(32, 227, 178, 0.2)' }} />
                      </div>
                      <button type="submit" className="ds-btn ds-btn-primary" disabled={posting} style={{ background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 900, boxShadow: '0 0 15px rgba(32, 227, 178, 0.3)' }}>
                        {posting ? 'Posting...' : 'Post Skill'}
                      </button>
                      {fMsg && <div className={`ds-form-msg ${fMsg.ok ? 'success':'error'}`}>{fMsg.text}</div>}
                    </form>
                  </div>

                  {/* Tips */}
                  <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                    <div className="ds-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
                      <div className="ds-card-title">Tips for a Great Listing</div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'.75rem' }}>
                        {[
                          ['Be specific', '"React.js with Redux" is better than "JavaScript"'],
                          ['Be honest', 'Choose the proficiency level that matches your real-world experience'],
                          ['Add context', "Mention projects you've used this skill in"],
                          ['Swap mindset', 'Think about what you can teach others'],
                        ].map(([title, desc], i) => (
                          <div key={i} style={{ display:'flex', gap:'.75rem', alignItems:'flex-start' }}>
                            <span style={{ fontSize:'1.1rem', color: 'var(--color-accent-2)' }}>✓</span>
                            <div style={{ fontSize:'.82rem', color:'var(--ds-label)', lineHeight:1.5 }}>
                              <strong style={{ color:'var(--ds-text)' }}>{title}</strong> — {desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ds-card" style={{ background:'linear-gradient(135deg,rgba(32,227,178,0.06),rgba(32,227,178,0.02))', borderColor:'rgba(32,227,178,0.2)' }}>
                      <div style={{ fontSize:'1.5rem', marginBottom:'.5rem' }}></div>
                      <div style={{ fontSize:'.9rem', fontWeight:700, color:'#fff', marginBottom:'.35rem' }}>Looking to swap?</div>
                      <div style={{ fontSize:'.78rem', color:'var(--ds-label)', lineHeight:1.5 }}>Browse skills on the board and connect with teammates who have complementary skills.</div>
                      <button className="ds-btn ds-btn-primary ds-btn-sm" style={{ marginTop:'1rem', background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 800 }} onClick={() => setView('board')}>Browse Skills →</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ACTIVITY VIEW ───────────────────────────────────── */}
            {view === 'activity' && (
              <motion.div key="activity" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <div className="ds-card" style={{ borderColor: 'rgba(32, 227, 178, 0.12)' }}>
                  <div className="ds-card-title">Recent Activity</div>
                  <div className="ds-activity-list">
                    {activities.map((a, i) => (
                      <div key={i} className="ds-activity-item" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <div className={`ds-activity-dot ${ACT_DOT_CLASS[a.type]}`} style={{ background: a.type === 'fav' ? 'rgba(245,158,11,0.1)' : 'rgba(32,227,178,0.1)' }}>{ACT_ICON[a.type]}</div>
                        <div className="ds-activity-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                        <div className="ds-activity-time">{a.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PROFILE VIEW ───────────────────────────────────── */}
            {view === 'profile' && (
              <motion.div key="profile" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                <div className="ds-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '3rem', borderColor: 'rgba(32, 227, 178, 0.12)' }}>
                  <div className="ds-profile-avatar" style={{ width: '100px', height: '100px', fontSize: '2.5rem', border: '3px solid var(--color-accent-2)', boxShadow: '0 0 25px rgba(32, 227, 178, 0.45)', borderRadius: '50%' }}>RR</div>
                  <h2 style={{ fontSize: '2rem', margin: 0, marginTop: '1rem' }}>Raghavendra R</h2>
                  <div className="ds-profile-role" style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-accent-2)', fontWeight: 700 }}>PlaceForge Developer</div>
                  <p style={{ color: 'var(--ds-muted)', maxWidth: '500px', lineHeight: 1.6 }}>Passionate about full-stack development and helping peers ace placements. Building scalable SPAs with hooks, context API, and Redux.</p>
                  
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div className="ds-stat-box" style={{ width: '130px', padding: '1rem', borderColor: 'rgba(32,227,178,0.1)' }}>
                      <div className="ds-stat-num" style={{ color:'var(--color-accent-2)', fontSize: '1.8rem' }}>{stats.mySkills}</div>
                      <div className="ds-stat-lbl">My Skills</div>
                    </div>
                    <div className="ds-stat-box" style={{ width: '130px', padding: '1rem', borderColor: 'rgba(32,227,178,0.1)' }}>
                      <div className="ds-stat-num" style={{ color:'var(--color-accent-2)', fontSize: '1.8rem' }}>{skills.filter(s => s.fav).length}</div>
                      <div className="ds-stat-lbl">Favorites</div>
                    </div>
                  </div>
                  
                  <button className="ds-btn ds-btn-primary" style={{ marginTop: '2.5rem', maxWidth: '240px', background: 'var(--color-accent-2)', color: 'var(--color-bg-deep)', fontWeight: 900, boxShadow: '0 0 15px rgba(32,227,178,0.3)' }} onClick={() => setView('post')}>
                    Post a New Skill
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <footer className="ds-footer" style={{ borderTop: '1px solid rgba(32, 227, 178, 0.15)' }}>
        Built for <strong>PlaceForge</strong> · Raghavendra_SkillSwap Module · © 2026
      </footer>

      {/* ── DELETE MODAL ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div className="ds-modal-overlay" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={e => { if (e.target === e.currentTarget) setDeleteTarget(null); }}>
            <motion.div className="ds-modal" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} style={{ borderColor: 'rgba(32,227,178,0.3)' }}>
              <h3 style={{ color: '#fff' }}>Delete Skill?</h3>
              <p>Are you sure you want to remove <strong>{deleteTarget.skillName}</strong>? This cannot be undone.</p>
              <div className="ds-modal-actions">
                <button className="ds-btn ds-btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="ds-btn ds-btn-danger" onClick={confirmDelete} style={{ background: '#ff4d6d', color: '#fff' }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOASTS ───────────────────────────────────────────────── */}
      <div className="ds-toast-container">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} className={`ds-toast ${t.type}`}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }}
              style={{
                borderColor: 'var(--color-accent-2)',
                borderLeft: '4px solid var(--color-accent-2)',
                boxShadow: '0 4px 20px rgba(32, 227, 178, 0.15)',
                background: 'var(--color-bg-deep)',
                color: '#fff'
              }}
            >
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
