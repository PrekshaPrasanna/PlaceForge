import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeft, User, Star, Clock, Send, MessageCircle, RefreshCw, Zap, MessageSquare } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  category: string;
  proficiency_level: string;
  posted_by: string;
  description: string;
  created_at: string;
  hot: boolean;
}

interface Comment {
  id: string;
  skill_id: string;
  user_name: string;
  comment_text: string;
  created_at: string;
}

const CAT_COLORS: Record<string, string> = {
  Technology: 'var(--color-accent-2)',
  Design: '#00e5ff',
  Marketing: '#ff007f',
  Finance: '#34d399',
};

export default function SkillDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [question, setQuestion] = useState('');
  const [toast, setToast] = useState<{ msg: string, type: string } | null>(null);
  const [swapRequested, setSwapRequested] = useState(false);

  const showToast = (msg: string, type: string = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSkillData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [skillRes, commentsRes, favRes] = await Promise.all([
        supabase.from('skills_board').select('*').eq('id', id).single(),
        supabase.from('skill_comments').select('*').eq('skill_id', id).order('created_at', { ascending: true }),
        supabase.from('favorites').select('*').eq('skill_id', id)
      ]);

      if (skillRes.error) throw skillRes.error;
      setSkill(skillRes.data);
      if (commentsRes.data) setComments(commentsRes.data);
      setIsFavorited(!!(favRes.data && favRes.data.length > 0));
    } catch (e) {
      console.error(e);
      showToast('Skill not found.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillData();

    // Subscribe to new comments
    const channel = supabase.channel(`skill-comments-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'skill_comments', filter: `skill_id=eq.${id}` }, (payload) => {
        setComments(prev => [...prev, payload.new as Comment]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleSwapRequest = async () => {
    if (!id || swapRequested) return;
    try {
      setSwapRequested(true);
      await supabase.from('skill_swaps').insert([{ skill_id: id, user_id: 'anonymous', status: 'pending' }]);
      showToast('Swap request sent!', 'success');
    } catch (e) {
      showToast('Failed to send swap request', 'error');
      setSwapRequested(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!id) return;
    const nextFav = !isFavorited;
    setIsFavorited(nextFav);
    showToast(nextFav ? 'Added to favorites' : 'Removed from favorites', 'success');

    try {
      if (nextFav) {
        await supabase.from('favorites').insert([{ skill_id: id }]);
      } else {
        await supabase.from('favorites').delete().eq('skill_id', id);
      }
    } catch (e) {
      showToast('Error updating favorite', 'error');
      setIsFavorited(!nextFav);
    }
  };

  const handlePostQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !id) return;

    try {
      const { data, error } = await supabase.from('skill_comments').insert([{
        skill_id: id,
        user_name: 'Raghavendra R',
        comment_text: question.trim(),
        likes: 0
      }]).select().single();

      if (error) throw error;

      // Add to local state immediately
      setComments(prev => {
        if (prev.some(c => c.id === data.id)) return prev;
        return [...prev, data];
      });

      setQuestion('');
      showToast('Comment posted', 'success');
    } catch (e) {
      console.error(e);
      showToast('Failed to post comment', 'error');
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <RefreshCw size={48} className="spin" style={{ color: 'var(--color-accent-2)' }} />
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center', gap: '1rem' }}>
        <h2>Skill Not Found</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/swap-skill')}>← Back to Board</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-content" style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        <button 
          onClick={() => navigate('/swap-skill')} 
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '1rem', fontWeight: 600 }}
        >
          <ArrowLeft size={18} /> Back to Board
        </button>

        {/* Hero Card */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '3rem', position: 'relative', overflow: 'hidden', border: `1px solid ${CAT_COLORS[skill.category] || 'var(--color-accent-2)'}44` }}>
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '300px', height: '300px', background: `radial-gradient(circle, ${CAT_COLORS[skill.category] || 'var(--color-accent-2)'}22, transparent 70%)`, filter: 'blur(40px)', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-primary" style={{ background: 'rgba(255,255,255,0.05)', color: CAT_COLORS[skill.category] || '#fff' }}>{skill.category}</span>
              <span className="badge badge-secondary">{skill.proficiency_level}</span>
              {skill.hot && <span className="badge badge-accent">Trending</span>}
            </div>

            <h1 style={{ margin: 0, fontSize: '3rem', textShadow: `0 0 30px ${CAT_COLORS[skill.category] || 'var(--color-accent-2)'}33` }}>{skill.skill_name}</h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} />
                <strong style={{ color: '#fff' }}>{skill.posted_by}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} />
                <span>Posted {new Date(skill.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {skill.description && (
              <p style={{ fontSize: '1.15rem', color: 'var(--color-text-light)', lineHeight: 1.8, marginTop: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                {skill.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button 
                className="btn btn-accent" 
                onClick={handleSwapRequest}
                disabled={swapRequested}
                style={{ padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', background: swapRequested ? 'var(--color-primary)' : 'var(--color-accent-2)', color: swapRequested ? '#fff' : '#000' }}
              >
                {swapRequested ? <><CheckCircle size={20} /> Request Sent</> : <><RefreshCw size={20} /> Request Swap</>}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleToggleFavorite}
                style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: isFavorited ? 'var(--color-accent-4)' : '#fff', borderColor: isFavorited ? 'var(--color-accent-4)' : 'var(--glass-border)' }}
              >
                <Star fill={isFavorited ? 'var(--color-accent-4)' : 'none'} size={24} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Discussion Section */}
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginTop: '2rem', padding: '2.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.75rem', marginBottom: '2rem' }}>
            <MessageCircle size={28} style={{ color: 'var(--color-accent-3)' }} /> Discussion
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No questions yet. Be the first to ask!</p>
              </div>
            ) : (
              comments.map((comment, i) => (
                <div key={comment.id} style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, border: '2px solid var(--color-accent-3)', color: 'var(--color-accent-3)' }}>
                    {comment.user_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#fff' }}>{comment.user_name}</strong>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{new Date(comment.created_at).toLocaleDateString()}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--color-text-light)', lineHeight: 1.6 }}>{comment.comment_text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostQuestion} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Ask a question</label>
              <textarea 
                rows={3} 
                required
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder="What do you want to know about this skill?"
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', color: '#fff', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <button type="submit" className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: 'fit-content', padding: '0.8rem 1.5rem' }}>
              <Send size={18} /> Post
            </button>
          </form>
        </motion.div>
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
