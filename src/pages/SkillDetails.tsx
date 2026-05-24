// SkillDetails.tsx – Dynamic Skill Details Page for PlaceForge SkillSwap
// Route: /skillswap/skill/:id

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabaseClient';
import '../Raghavendra_SkillSwap/styles/skilldetails.css';

// ─── Types ────────────────────────────────────────────────────────────────────
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
  parent_id: string | null;
  likes: number;
  created_at: string;
}

interface CurriculumDetail {
  title: string;
  steps: string[];
  approach: string;
  resource: { label: string; url: string };
  milestone: string;
}

// ─── Fallback / Hardcoded Demo Data ──────────────────────────────────────────
const CURRICULUM_DETAILS: Record<string, CurriculumDetail[]> = {
  Technology: [
    {
      title: 'Core fundamentals & hands-on project setup',
      steps: ['Understand directory structures & configuration files', 'Set up boilerplate code & environment variables', 'Initialize local and remote repositories'],
      approach: 'Initialize your project using Vite or Next.js. Organize folders into components, pages, hooks, and services. Configure ESLint/Prettier, set up environment variables in a secure .env file, and initialize a Git repository to track your code commits.',
      resource: { label: 'Vite Getting Started Guide', url: 'https://vitejs.dev/guide/' },
      milestone: 'Launch a working hot-reloading development server.'
    },
    {
      title: 'API integration & real-world backend connections',
      steps: ['Establish Supabase client connection scripts', 'Implement select, insert, and delete database transactions', 'Handle server response loading and error statuses'],
      approach: 'Install the Supabase client library. Initialize the client in src/lib/supabaseClient.ts. Write asynchronous fetch handlers in React hooks. Implement loading indicators, error handling, and robust data synchronization states.',
      resource: { label: 'Supabase JS Client Docs', url: 'https://supabase.com/docs/reference/javascript/introduction' },
      milestone: 'Query and render real-time table records in components.'
    },
    {
      title: 'Testing, debugging & performance optimization',
      steps: ['Write unit tests for core utilities and state hook logic', 'Use browser devtools to audit package size and loading speed', 'Implement memoization and lazy-loading for assets'],
      approach: 'Write comprehensive unit and integration tests using Vitest or Jest. Audit bundle sizes using Vite Visualizer. Implement memoization (React.memo, useMemo, useCallback) to avoid redundant renders, and lazy-load heavy media components.',
      resource: { label: 'React Performance Auditing', url: 'https://react.dev/reference/react/memo' },
      milestone: 'Pass all validation suites with zero console warnings.'
    },
    {
      title: 'Deployment strategies & production best practices',
      steps: ['Configure build bundle optimization pipelines', 'Deploy optimized assets to Vercel, Netlify, or AWS', 'Verify production domain security configurations'],
      approach: 'Configure optimized build configurations in your compiler. Deploy the production bundle to high-performance platforms like Vercel or Netlify. Set up SSL, custom domains, and configure security headers to harden the deployment.',
      resource: { label: 'Vercel Deployment Guide', url: 'https://vercel.com/docs' },
      milestone: 'Go live with a shareable secure production URL.'
    }
  ],
  Design: [
    {
      title: 'Design principles: typography, colour theory & grids',
      steps: ['Learn hierarchical typographic rules', 'Build matching contrastive color palettes using HSL parameters', 'Establish responsive grid structures for layouts'],
      approach: 'Establish consistent typography hierarchy using scales. Define a cohesive color palette using HSL variables for dark/light modes. Set up standard grid layouts (e.g., 12-column grids) to ensure visual consistency.',
      resource: { label: 'Refactoring UI book guidelines', url: 'https://www.refactoringui.com/' },
      milestone: 'Construct a style guide document detailing UI tokens.'
    },
    {
      title: 'Wireframing & prototyping in Figma',
      steps: ['Sketch interactive low-fidelity user flow wireframes', 'Create reusable Figma component variants and auto-layouts', 'Build high-fidelity prototypes linking interactive pages'],
      approach: 'Start with low-fidelity layouts mapping user flows. Create reusable components with variants and auto-layouts. Wireframe interactive prototypes, mapping interactions to real-world transitions to get early user feedback.',
      resource: { label: 'Figma Auto-Layout Tutorials', url: 'https://help.figma.com/hc/en-us' },
      milestone: 'Share an interactive prototype link ready for user testing.'
    },
    {
      title: 'Responsive & mobile-first design patterns',
      steps: ['Audit designs on diverse screen sizes and ratios', 'Implement responsive layout breakpoints in css', 'Design drawer menus and adaptive cards for smartphones'],
      approach: 'Use CSS media queries to design layout breakpoints. Prioritize vertical flow on mobile viewports. Implement touch-friendly buttons, drawer menus, and cards that expand dynamically depending on screen real estate.',
      resource: { label: 'Responsive Design Basics', url: 'https://web.dev/responsive-web-design-basics/' },
      milestone: 'Achieve perfect mobile layout compatibility testing.'
    },
    {
      title: 'Building a professional design portfolio',
      steps: ['Collect project case studies detailing design decisions', 'Write copy explaining user research and problem statements', 'Publish portfolio on Behance or custom domain sites'],
      approach: 'Structure case studies outlining the problem statement, user research, wireframes, and final design decisions. Host the portfolio on Behance or a custom domain, ensuring it loads fast and displays your best work.',
      resource: { label: 'Behance Portfolio Setup', url: 'https://www.behance.net/' },
      milestone: 'Launch portfolio containing at least 3 case studies.'
    }
  ],
  Marketing: [
    {
      title: 'Market research & audience segmentation',
      steps: ['Create buyer personas representing target users', 'Analyze competitors using SEO and social listening tools', 'Identify gaps and opportunities within market segments'],
      approach: 'Define clear buyer personas mapping demographics and pain points. Perform competitor analysis using SEO tools. Target specific audience niches that have high conversion potential.',
      resource: { label: 'Hubspot Persona Generator', url: 'https://www.hubspot.com/make-my-persona' },
      milestone: 'Create 2 comprehensive buyer persona documents.'
    },
    {
      title: 'Content strategy & SEO fundamentals',
      steps: ['Conduct keyword research for primary search terms', 'Structure blogs and landing pages for on-page SEO optimization', 'Build content calendars mapping publishing schedules'],
      approach: 'Perform keyphrase analysis using Google Keyword Planner. Optimize page elements (headings, meta tags, schema markup) for on-page SEO. Maintain a calendar to publish high-quality content consistently.',
      resource: { label: 'Google Search Console Basics', url: 'https://support.google.com/webmasters' },
      milestone: 'Optimize 3 landing pages yielding high search visibility.'
    },
    {
      title: 'Running paid campaigns on Google & Meta',
      steps: ['Set up search and social media advertising accounts', 'Design high-converting creatives and copy for advertisements', 'Define target demographics and campaign budgets'],
      approach: 'Set up campaign tracking and pixel codes. Craft compelling advertising copy and visuals with clear CTAs. Set daily budget caps and narrow down demographics using conversion data.',
      resource: { label: 'Meta Blueprint Academy', url: 'https://www.facebook.com/business/learn' },
      milestone: 'Launch a live budget-capped test campaign.'
    },
    {
      title: 'Analytics: measuring ROI & conversion rates',
      steps: ['Install conversion tracking tags and analytics codes', 'Read reports monitoring traffic sources and click-through rates', 'Audit and refine sales funnels resolving exit pages'],
      approach: 'Configure custom goals and events inside Google Analytics 4. Track click-through rates (CTR) and analyze customer acquisition cost (CAC). Optimize conversion funnels by auditing high-bounce exit pages.',
      resource: { label: 'Google Analytics 4 Certification', url: 'https://skillshop.google.com/' },
      milestone: 'Compile a conversion dashboard detailing campaign ROI.'
    }
  ],
  Finance: [
    {
      title: 'Financial statement analysis (P&L, Balance Sheet)',
      steps: ['Read income statements, balance sheets, and cash flows', 'Analyze key ratios measuring profitability and leverage', 'Audit company annual reports (10-K files)'],
      approach: 'Collect and read annual 10-K filings. Calculate financial health ratios like return on equity (ROE) and debt-to-equity. Compare performance metrics against sector benchmarks to identify valuation anomalies.',
      resource: { label: 'SEC Edgar Database Tutorial', url: 'https://www.sec.gov/edgar' },
      milestone: 'Draft a financial health summary report of a firm.'
    },
    {
      title: 'Valuation models: DCF & comparable analysis',
      steps: ['Forecast future company free cash flows', 'Calculate cost of capital (WACC) parameters', 'Determine company intrinsic value via discounted cash flows'],
      approach: 'Build financial models forecasting free cash flows for 5-10 years. Estimate terminal value and discount them back to present value using WACC. Perform sensitivity analysis to assess valuation under varying growth scenarios.',
      resource: { label: 'Corporate Valuation Models Guide', url: 'https://corporatefinanceinstitute.com/' },
      milestone: 'Build a working valuation model from scratch.'
    },
    {
      title: 'Excel/Sheets for financial modelling',
      steps: ['Master financial keyboard shortcuts and spreadsheet formulas', 'Build clean and dynamic spreadsheet model layouts', 'Perform sensitivity analyses using data tables'],
      approach: 'Utilize advanced formulas like XLOOKUP, INDEX/MATCH, and PMT. Structure clean models with distinct inputs, calculations, and outputs. Build dynamic dashboards to present findings.',
      resource: { label: 'Excel Financial Modeling Formulas', url: 'https://support.microsoft.com/' },
      milestone: 'Pass a timed model building test under 45 minutes.'
    },
    {
      title: 'Investment strategies & portfolio management',
      steps: ['Learn asset allocation strategies balancing risk and return', 'Audit historical performances of diverse asset classes', 'Build a portfolio tracking tool monitoring performance metrics'],
      approach: 'Formulate asset allocation guidelines balancing risk and return. Diversify across equities, bonds, and real estate. Rebalance portfolios periodically to lock in profits and manage volatility.',
      resource: { label: 'Morningstar Investor Academy', url: 'https://www.morningstar.com/' },
      milestone: 'Simulate a balanced portfolio outperforming investment benchmarks.'
    }
  ]
};

const DEFAULT_CURRICULUM_DETAILS: CurriculumDetail[] = [
  {
    title: 'Core concepts and foundational theory',
    steps: ['Study basic terminology and baseline theory', 'Identify key parameters and frameworks', 'Review typical use cases'],
    approach: 'Focus on primary concepts and definitions. Read summary documents, highlight key terminology, and construct flashcards for quick revision.',
    resource: { label: 'Foundational Knowledge Course', url: 'https://wikipedia.org/' },
    milestone: 'Pass a basics validation questionnaire.'
  },
  {
    title: 'Hands-on practical exercises & mini-projects',
    steps: ['Implement simple exercises applying rules', 'Build standalone items testing configurations', 'Resolve basic syntax or flow errors'],
    approach: 'Start with simple hello-world projects. Replicate standard templates, write small programs, and trace code execution to build muscle memory.',
    resource: { label: 'Practice Workbook guides', url: 'https://github.com/' },
    milestone: 'Finish 3 mini-exercises correctly.'
  },
  {
    title: 'Real-world case studies from industry leaders',
    steps: ['Read stories mapping successful designs', 'Deconstruct strategies resolving initial constraints', 'Draft improvements on historical workflows'],
    approach: 'Study successful solutions to complex challenges. Deconstruct their architectures, understand their trade-offs, and draft retrospective improvements.',
    resource: { label: 'Case Studies Directory', url: 'https://medium.com/' },
    milestone: 'Write a deconstruction analysis paper.'
  },
  {
    title: 'Final project: apply everything you have learned',
    steps: ['Select a personal project scope', 'Implement features combining all course dimensions', 'Publish final output presenting your work'],
    approach: 'Synthesize all concepts into a comprehensive project. Establish a clear scope, implement the code step-by-step, verify reliability, and publish it.',
    resource: { label: 'Project Review Rubric', url: 'https://linkedin.com/' },
    milestone: 'Obtain mentor approval on final project.'
  }
];

const CAT_COLORS: Record<string, string> = {
  Technology: '#00ff88', Design: '#00e5ff', Marketing: '#ff007f', Finance: '#34d399',
};
const CAT_EMOJIS: Record<string, string> = {
  Technology: '', Design: '', Marketing: '', Finance: '',
};
const LVL_EMOJI: Record<string, string> = {
  Beginner: '', Intermediate: '', Advanced: '', Expert: '',
};
const LVL_COLORS: Record<string, string> = {
  Beginner: '#34d399', Intermediate: '#fbbf24', Advanced: '#f87171', Expert: '#c084fc',
};

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatCommentTime(iso: string) {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch (e) {
    return 'Recently';
  }
}

// Helper to strip any remaining emojis
function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{24C2}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SkillDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [swapRequested, setSwapRequested] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [question, setQuestion] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedComments, setLikedComments] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('placeforge_liked_comments');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [relatedSkills, setRelatedSkills] = useState<any[]>([]);
  const [expandedCurriculumIdx, setExpandedCurriculumIdx] = useState<number | null>(null);

  // Generic toast for errors/info
  const [infoToast, setInfoToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const infoToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showInfoToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (infoToastTimerRef.current) clearTimeout(infoToastTimerRef.current);
    setInfoToast({ msg, type });
    infoToastTimerRef.current = setTimeout(() => setInfoToast(null), 3500);
  };

  // Save liked comments to localStorage on change
  useEffect(() => {
    localStorage.setItem('placeforge_liked_comments', JSON.stringify(Array.from(likedComments)));
  }, [likedComments]);

  // ── Fetch comments ────────────────────────────────────────────────────────
  const fetchComments = async () => {
    if (!id) return;
    const { data, error: err } = await supabase
      .from('skill_comments')
      .select('*')
      .eq('skill_id', id)
      .order('created_at', { ascending: true });
    
    if (err) {
      console.error('Error fetching comments:', err);
    } else if (data) {
      setComments(data);
    }
  };

  // ── Fetch skill, comments & related skills from Supabase ───────────────────
  useEffect(() => {
    if (!id) return;
    const fetchSkillAndComments = async () => {
      setLoading(true);
      setError('');
      
      const [skillRes, commentsRes, favRes] = await Promise.all([
        supabase.from('skills_board').select('*').eq('id', id).single(),
        supabase.from('skill_comments').select('*').eq('skill_id', id).order('created_at', { ascending: true }),
        supabase.from('favorites').select('*').eq('skill_id', id)
      ]);

      if (skillRes.error || !skillRes.data) {
        setError('Skill not found. It may have been removed or the link is invalid.');
      } else {
        setSkill(skillRes.data);
        if (commentsRes.data) {
          setComments(commentsRes.data);
        }
        setIsFavorited(!!(favRes.data && favRes.data.length > 0));

        // Fetch other skills from the same category as related skills
        const { data: relData } = await supabase
          .from('skills_board')
          .select('*')
          .eq('category', skillRes.data.category)
          .neq('id', id)
          .limit(3);
        
        if (relData) {
          setRelatedSkills(relData);
        }
      }
      setLoading(false);
    };
    
    fetchSkillAndComments();

    // ── Realtime listener: new comments appear instantly ─────────────────────
    const channel = supabase
      .channel(`skill-comments-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'skill_comments', filter: `skill_id=eq.${id}` },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments(prev => {
            // Avoid duplicates (optimistic update may have already added it)
            if (prev.find(c => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Swap request handler ──────────────────────────────────────────────────
  const handleSwapRequest = async () => {
    if (!id || swapRequested) return;
    setSwapRequested(true);

    const { error: err } = await supabase.from('skill_swaps').insert([
      { skill_id: id, user_id: 'anonymous', status: 'pending' }
    ]);

    if (err) {
      console.error('Error creating swap request:', err);
      setSwapRequested(false);
      showInfoToast('Failed to send swap request. Please try again.', 'error');
      return;
    }

    showInfoToast('Swap request sent successfully!', 'success');
  };

  const handleSaveFavorite = async () => {
    if (!id || savingFavorite) return;
    const nextFav = !isFavorited;
    setSavingFavorite(true);
    setIsFavorited(nextFav);

    if (nextFav) {
      const { error: err } = await supabase.from('favorites').insert([{ skill_id: id }]);
      if (err) {
        console.error('Error adding favorite:', err);
        setIsFavorited(false);
        showInfoToast('Failed to add favorite. Please try again.', 'error');
      } else {
        showInfoToast('Added to your favorites', 'success');
      }
    } else {
      const { error: err } = await supabase.from('favorites').delete().eq('skill_id', id);
      if (err) {
        console.error('Error removing favorite:', err);
        setIsFavorited(true);
        showInfoToast('Failed to remove favorite. Please try again.', 'error');
      } else {
        showInfoToast('Removed from your favorites', 'info');
      }
    }

    setSavingFavorite(false);
  };

  // ── Submit question ───────────────────────────────────────────────────────
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !id) return;

    setSubmittingComment(true);
    const { error: err } = await supabase
      .from('skill_comments')
      .insert([
        {
          skill_id: id,
          user_name: 'Raghavendra R', // Using the active user name
          comment_text: question.trim(),
          parent_id: null,
          likes: 0
        }
      ]);

    if (err) {
      console.error('Error posting question:', err);
      showInfoToast('Failed to post question. Please try again.', 'error');
    } else {
      setQuestion('');
      showInfoToast('Question posted successfully!', 'success');
      await fetchComments();
    }
    setSubmittingComment(false);
  };

  // ── Like a comment ────────────────────────────────────────────────────────
  const toggleLike = async (commentId: string) => {
    const isLiked = likedComments.has(commentId);
    
    // Update local set
    const nextLiked = new Set(likedComments);
    if (isLiked) {
      nextLiked.delete(commentId);
    } else {
      nextLiked.add(commentId);
    }
    setLikedComments(nextLiked);

    // Get current likes count
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const originalLikes = comment.likes;
    const newLikes = originalLikes + (isLiked ? -1 : 1);

    // Optimistic update of local comments state
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: newLikes } : c));

    // Database update
    const { error: err } = await supabase
      .from('skill_comments')
      .update({ likes: newLikes })
      .eq('id', commentId);

    if (err) {
      console.error('Error updating likes:', err);
      // Revert local state on error
      setLikedComments(likedComments);
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, likes: originalLikes } : c));
    }
  };

  // ── Reply handler helpers ─────────────────────────────────────────────────
  const handleReplyClick = (comment: Comment) => {
    if (replyingToId === comment.id) {
      setReplyingToId(null);
      setReplyText('');
    } else {
      setReplyingToId(comment.id);
      if (comment.parent_id) {
        setReplyText(`@${comment.user_name} `);
      } else {
        setReplyText('');
      }
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !id) return;

    setSubmittingComment(true);
    const { error: err } = await supabase
      .from('skill_comments')
      .insert([
        {
          skill_id: id,
          user_name: 'Raghavendra R', // Using the active user name
          comment_text: replyText.trim(),
          parent_id: parentId, // Always links to top-level parent ID
          likes: 0
        }
      ]);

    if (err) {
      console.error('Error posting reply:', err);
      showInfoToast('Failed to post reply. Please try again.', 'error');
    } else {
      setReplyText('');
      setReplyingToId(null);
      showInfoToast('Reply posted successfully!', 'success');
      await fetchComments();
    }
    setSubmittingComment(false);
  };

  // ── Skeleton Loader ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="sd-root">
        <div className="sd-container">
          <div className="sd-skeleton sd-skeleton-back" />
          <div className="sd-hero sd-skeleton-hero">
            <div className="sd-skeleton sd-skeleton-avatar" />
            <div className="sd-skeleton-info">
              <div className="sd-skeleton sd-skeleton-title" />
              <div className="sd-skeleton sd-skeleton-sub" />
              <div className="sd-skeleton sd-skeleton-sub" style={{ width: '40%' }} />
            </div>
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="sd-skeleton sd-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !skill) {
    return (
      <div className="sd-root">
        <div className="sd-container">
          <div className="sd-error-state">
            <div className="sd-error-icon"></div>
            <h2>Skill Not Found</h2>
            <p>{error || 'Something went wrong. Please try again.'}</p>
            <button className="sd-btn-primary" onClick={() => navigate('/skillswap')}>
              ← Back to Skills Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  const catColor = CAT_COLORS[skill.category] || '#00ff88';
  const curriculum = CURRICULUM_DETAILS[skill.category] || DEFAULT_CURRICULUM_DETAILS;
  const initials = getInitials(skill.posted_by || 'Anonymous User');

  return (
    <div className="sd-root">
      {/* Info / Error Toast */}
      <AnimatePresence>
        {infoToast && (
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'fixed',
              top: '1.5rem',
              right: '1.5rem',
              zIndex: 9999,
              background: '#0b0f19',
              border: '1px solid',
              borderColor: infoToast.type === 'success' ? '#00ff88' : infoToast.type === 'error' ? '#FF3366' : 'rgba(99,102,241,0.6)',
              borderLeft: `4px solid ${infoToast.type === 'success' ? '#00ff88' : infoToast.type === 'error' ? '#FF3366' : '#6366f1'}`,
              borderRadius: '16px',
              padding: '1rem 1.5rem',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: `0 8px 30px rgba(0,0,0,0.4), 0 0 20px ${infoToast.type === 'success' ? 'rgba(0,255,136,0.15)' : 'rgba(255,51,102,0.15)'}`,
              backdropFilter: 'blur(20px)',
              minWidth: '260px',
              maxWidth: '380px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {infoToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sd-container">
        {/* Back Button */}
        <motion.button
          className="sd-back-btn"
          onClick={() => navigate('/skillswap')}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          ← Back to Board
        </motion.button>

        {/* Mentor Profile Hero Section */}
        <motion.div
          className="sd-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            borderColor: 'rgba(0, 255, 136, 0.15)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 15px rgba(0, 255, 136, 0.03)'
          }}
        >
          {/* Neon Glow orb behind avatar */}
          <div className="sd-hero-glow" style={{ background: '#00ff88', opacity: 0.1 }} />

          {/* Circular profile avatar with Neon-Green glow */}
          <div
            className="sd-mentor-avatar"
            style={{
              borderColor: '#00ff88',
              boxShadow: '0 0 20px rgba(0, 255, 136, 0.45)',
              background: 'linear-gradient(135deg, #111827, #0b0f19)'
            }}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="sd-hero-info">
            <div className="sd-hero-badges">
              <span className="sd-badge-cat" style={{ background: 'rgba(0, 255, 136, 0.1)', color: '#00ff88', borderColor: 'rgba(0, 255, 136, 0.25)' }}>
                {skill.category}
              </span>
              {skill.hot && <span className="sd-badge-hot">Trending</span>}
            </div>

            <h1 className="sd-skill-title">{skill.skill_name}</h1>

            <div className="sd-mentor-row">
              <span className="sd-mentor-name">{skill.posted_by || 'Anonymous'}</span>
              <span className="sd-level-badge" style={{ color: LVL_COLORS[skill.proficiency_level] || '#00ff88', borderColor: `${LVL_COLORS[skill.proficiency_level]}44` || 'rgba(0, 255, 136, 0.3)' }}>
                {skill.proficiency_level}
              </span>
            </div>

            {skill.description && (
              <p className="sd-skill-desc">{skill.description}</p>
            )}

            <div className="sd-meta-row">
              <span className="sd-meta-chip">Posted {fmtDate(skill.created_at)}</span>
              <span className="sd-meta-chip">PlaceForge SkillSwap</span>
            </div>
          </div>

          {/* Request to Swap Section */}
          <div className="sd-swap-panel">
            <div className="sd-swap-card" style={{ borderColor: 'rgba(0, 255, 136, 0.25)', boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 0 15px rgba(0, 255, 136, 0.05)' }}>
              <div className="sd-swap-label">Ready to learn?</div>
              <div className="sd-swap-subtitle">Connect with {skill.posted_by?.split(' ')[0] || 'the mentor'} and start swapping skills today.</div>
              
              <motion.button
                className="sd-btn-primary"
                onClick={handleSwapRequest}
                whileHover={{ scale: swapRequested ? 1 : 1.03 }}
                whileTap={{ scale: swapRequested ? 1 : 0.97 }}
                disabled={swapRequested}
                style={{
                  background: swapRequested ? '#1f4b1c' : '#00ff88',
                  color: '#000',
                  cursor: swapRequested ? 'not-allowed' : 'pointer',
                  opacity: swapRequested ? 0.85 : 1,
                  boxShadow: '0 0 20px rgba(0, 255, 136, 0.45)',
                  fontWeight: 900
                }}
              >
                {swapRequested ? 'Request Sent' : 'Request to Swap'}
              </motion.button>

              <motion.button
                className="sd-btn-ghost"
                onClick={handleSaveFavorite}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={savingFavorite}
                style={{
                  borderColor: isFavorited ? '#00ff88' : 'rgba(0, 255, 136, 0.2)',
                  color: isFavorited ? '#00ff88' : '#e5e7eb',
                  background: isFavorited ? 'rgba(0, 255, 136, 0.06)' : 'transparent',
                  fontWeight: 700,
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  width: '100%',
                  borderRadius: '100px',
                  padding: '0.75rem 1.5rem',
                  cursor: savingFavorite ? 'not-allowed' : 'pointer',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  transition: 'all 0.3s ease'
                }}
              >
                {isFavorited ? '★ Favorites' : '☆ Favorites'}
              </motion.button>

              <div className="sd-swap-stats">
                <div className="sd-swap-stat"><span style={{ color: '#00ff88' }}>12</span><small>Requests</small></div>
                <div className="sd-swap-stat"><span style={{ color: '#00ff88' }}>4.9</span><small>Rating</small></div>
                <div className="sd-swap-stat"><span style={{ color: '#00ff88' }}>8</span><small>Swapped</small></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Columns */}
        <div className="sd-body">
          <div className="sd-main-col">
            
            {/* Curriculum Accordion Block */}
            <motion.div
              className="sd-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{ borderColor: 'rgba(0, 255, 136, 0.12)' }}
            >
              <div className="sd-card-header">
                <span className="sd-card-icon"></span>
                <h2>What You'll Learn</h2>
              </div>
              
              <div className="sd-curriculum-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                {curriculum.map((item, i) => (
                  <motion.div
                    key={i}
                    className="sd-curriculum-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.07 }}
                    onClick={() => setExpandedCurriculumIdx(prev => prev === i ? null : i)}
                    style={{
                      cursor: 'pointer',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      borderColor: expandedCurriculumIdx === i ? 'rgba(0, 255, 136, 0.35)' : 'rgba(255,255,255,0.06)',
                      background: expandedCurriculumIdx === i ? 'rgba(0, 255, 136, 0.04)' : 'rgba(255,255,255,0.025)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', width: '100%' }}>
                      <div className="sd-curriculum-check" style={{ background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', borderColor: 'rgba(0, 255, 136, 0.3)' }}>✓</div>
                      <span style={{ fontWeight: 600, color: '#fff', flex: 1 }}>{stripEmojis(item.title)}</span>
                      <motion.span 
                        animate={{ rotate: expandedCurriculumIdx === i ? 90 : 0 }}
                        style={{ display: 'inline-block', color: '#00ff88', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        ▶
                      </motion.span>
                    </div>

                    <AnimatePresence>
                      {expandedCurriculumIdx === i && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{
                            marginTop: '1rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.85rem',
                            width: '100%',
                            fontSize: '0.82rem',
                            color: 'var(--color-text-muted)'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Learning Steps */}
                          <div>
                            <span style={{ fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                              Learning Path
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
                              {item.steps.map((step, sIdx) => (
                                <div key={sIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                                  <span style={{ color: '#00ff88', fontWeight: 700 }}>{sIdx + 1}.</span>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Detail fields */}
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.25rem', width: '100%' }}>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                              <span style={{ fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.3rem' }}>
                                How to Approach
                              </span>
                              <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 400, fontSize: '0.82rem', lineHeight: '1.45', display: 'block' }}>
                                {item.approach}
                              </span>
                            </div>
                            <div style={{ flex: 1, minWidth: '180px' }}>
                              <span style={{ fontWeight: 800, color: '#00ff88', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.5px', display: 'block', marginBottom: '0.3rem' }}>
                                Milestone Target
                              </span>
                              <span style={{ color: '#fff', fontWeight: 500, fontSize: '0.82rem', lineHeight: '1.45', display: 'block' }}>
                                {item.milestone}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Q&A / Comments Discussion Section */}
            <motion.div
              className="sd-card"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              style={{ borderColor: 'rgba(0, 255, 136, 0.12)' }}
            >
              <div className="sd-card-header">
                <span className="sd-card-icon"></span>
                <h2>Discussion & Q&A</h2>
                <span className="sd-badge-count" style={{ background: 'rgba(0, 255, 136, 0.15)', color: '#00ff88', borderColor: 'rgba(0, 255, 136, 0.3)' }}>{comments.length}</span>
              </div>

              {/* Submit Question */}
              <form className="sd-qa-form" onSubmit={handleQuestionSubmit} style={{ borderColor: 'rgba(0, 255, 136, 0.1)' }}>
                <div className="sd-qa-input-row">
                  <div className="sd-mini-avatar" style={{ background: 'linear-gradient(135deg, #0b0f19, #00ff88)', color: '#000', fontWeight: 800 }}>RR</div>
                  <input
                    type="text"
                    className="sd-qa-input"
                    placeholder="Ask a question about this skill..."
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.06)'
                    }}
                  />
                </div>
                <div className="sd-qa-form-footer">
                  <span className="sd-qa-hint">Be respectful and specific in your question</span>
                  <button
                    type="submit"
                    className="sd-btn-sm"
                    disabled={submittingComment || !question.trim()}
                    style={{
                      background: '#00ff88',
                      color: '#000',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Post Question →
                  </button>
                </div>
              </form>

              {/* Comments Board List */}
              <div className="sd-comments-list">
                <AnimatePresence>
                  {comments.filter(c => !c.parent_id).map((c) => {
                    const replies = comments.filter(r => r.parent_id === c.id);
                    return (
                      <div key={c.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Top-Level Question */}
                        <motion.div
                          className="sd-comment"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          style={{
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.015)'
                          }}
                        >
                          <div className="sd-comment-avatar" style={{ background: 'linear-gradient(135deg, #111827, #00ff88)' }}>{getInitials(c.user_name)}</div>
                          <div className="sd-comment-body">
                            <div className="sd-comment-meta">
                              <span className="sd-comment-author">{c.user_name}</span>
                              <span className="sd-comment-time">{formatCommentTime(c.created_at)}</span>
                            </div>
                            <p className="sd-comment-text">{c.comment_text}</p>
                            <div className="sd-comment-actions">
                              <button
                                className={`sd-like-btn ${likedComments.has(c.id) ? 'liked' : ''}`}
                                onClick={() => toggleLike(c.id)}
                                style={{
                                  color: likedComments.has(c.id) ? '#ff4d6d' : '#6b7280'
                                }}
                              >
                                {likedComments.has(c.id) ? '♥' : '♡'} {c.likes}
                              </button>
                              <button className="sd-reply-btn" onClick={() => handleReplyClick(c)} style={{ color: '#00ff88' }}>Reply</button>
                            </div>

                            {/* Inline reply form */}
                            {replyingToId === c.id && (
                              <div className="sd-reply-form-container" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: 'none', marginTop: '0.75rem' }}>
                                <form className="sd-qa-form sd-reply-form" onSubmit={(e) => handleReplySubmit(e, c.id)} style={{ borderColor: 'rgba(0, 255, 136, 0.2) !important' }}>
                                  <div className="sd-qa-input-row">
                                    <div className="sd-reply-mini-avatar" style={{ background: '#00ff88', color: '#000' }}>RR</div>
                                    <input
                                      type="text"
                                      className="sd-qa-input"
                                      placeholder={`Reply to ${c.user_name}...`}
                                      value={replyText}
                                      onChange={e => setReplyText(e.target.value)}
                                      autoFocus
                                    />
                                  </div>
                                  <div className="sd-qa-form-footer">
                                    <button 
                                      type="button" 
                                      className="sd-btn-ghost sd-btn-sm" 
                                      style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                      onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                    >
                                      Cancel
                                    </button>
                                    <button 
                                      type="submit" 
                                      className="sd-btn-sm" 
                                      disabled={submittingComment || !replyText.trim()}
                                      style={{ background: '#00ff88', color: '#000', fontWeight: 800 }}
                                    >
                                      Reply →
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* Indented replies */}
                        {replies.length > 0 && (
                          <div className="sd-replies-list" style={{ borderLeft: '2px solid rgba(0, 255, 136, 0.15)' }}>
                            {replies.map(reply => (
                              <div key={reply.id} className="sd-reply-comment" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                                <div className="sd-reply-comment-avatar" style={{ background: 'linear-gradient(135deg, #111827, #00ff88)', fontSize: '0.6rem' }}>{getInitials(reply.user_name)}</div>
                                <div className="sd-comment-body">
                                  <div className="sd-comment-meta">
                                    <span className="sd-comment-author">{reply.user_name}</span>
                                    <span className="sd-comment-time">{formatCommentTime(reply.created_at)}</span>
                                  </div>
                                  <p className="sd-comment-text">{reply.comment_text}</p>
                                  <div className="sd-comment-actions">
                                    <button
                                      className={`sd-like-btn ${likedComments.has(reply.id) ? 'liked' : ''}`}
                                      onClick={() => toggleLike(reply.id)}
                                      style={{
                                        color: likedComments.has(reply.id) ? '#ff4d6d' : '#6b7280'
                                      }}
                                    >
                                      {likedComments.has(reply.id) ? '♥' : '♡'} {reply.likes}
                                    </button>
                                    <button className="sd-reply-btn" onClick={() => handleReplyClick(reply)} style={{ color: '#00ff88' }}>Reply</button>
                                  </div>

                                  {/* Nested Reply Submission */}
                                  {replyingToId === reply.id && (
                                    <div className="sd-reply-form-container" style={{ marginLeft: 0, paddingLeft: 0, borderLeft: 'none', marginTop: '0.75rem' }}>
                                      <form className="sd-qa-form sd-reply-form" onSubmit={(e) => handleReplySubmit(e, c.id)}>
                                        <div className="sd-qa-input-row">
                                          <div className="sd-reply-mini-avatar" style={{ background: '#00ff88', color: '#000' }}>RR</div>
                                          <input
                                            type="text"
                                            className="sd-qa-input"
                                            placeholder={`Reply to ${reply.user_name}...`}
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            autoFocus
                                          />
                                        </div>
                                        <div className="sd-qa-form-footer">
                                          <button 
                                            type="button" 
                                            className="sd-btn-ghost sd-btn-sm" 
                                            style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}
                                            onClick={() => { setReplyingToId(null); setReplyText(''); }}
                                          >
                                            Cancel
                                          </button>
                                          <button 
                                            type="submit" 
                                            className="sd-btn-sm" 
                                            disabled={submittingComment || !replyText.trim()}
                                            style={{ background: '#00ff88', color: '#000', fontWeight: 800 }}
                                          >
                                            Reply →
                                          </button>
                                        </div>
                                      </form>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Sidebar Area */}
          <motion.div
            className="sd-sidebar-col"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Related Skills */}
            <div className="sd-card" style={{ borderColor: 'rgba(0, 255, 136, 0.12)' }}>
              <div className="sd-card-header">
                <span className="sd-card-icon"></span>
                <h2>Related Skills</h2>
              </div>
              <div className="sd-related-list">
                {(relatedSkills.length > 0 ? relatedSkills.map(rs => ({
                  id: rs.id,
                  name: rs.skill_name,
                  category: rs.category,
                  mentor: rs.posted_by || 'Anonymous'
                })) : [
                  { id: 'related-1', name: 'UI/UX Design Fundamentals', category: 'Design', mentor: 'Sneha K.' },
                  { id: 'related-2', name: 'Node.js & REST APIs', category: 'Technology', mentor: 'Kiran P.' }
                ]).map((rs) => (
                  <motion.div
                    key={rs.id}
                    className="sd-related-card bg-gray-800 rounded-xl border-gray-700"
                    whileHover={{ scale: 1.025, x: 4 }}
                    whileTap={{ scale: 0.975 }}
                    onClick={() => navigate(`/skillswap/skill/${rs.id}`)}
                    style={{
                      cursor: 'pointer'
                    }}
                  >
                    <div className="sd-related-icon" style={{ background: `${CAT_COLORS[rs.category] || '#00ff88'}22`, color: CAT_COLORS[rs.category] || '#00ff88' }}>
                      {CAT_EMOJIS[rs.category]}
                    </div>
                    <div className="sd-related-info">
                      <div className="sd-related-name">{rs.name}</div>
                      <div className="sd-related-meta">
                        <span style={{ color: CAT_COLORS[rs.category] || '#00ff88' }}>{rs.category}</span>
                        <span>· {rs.mentor}</span>
                      </div>
                    </div>
                    <span className="sd-related-arrow" style={{ color: '#00ff88' }}>→</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mentor Info */}
            <div className="sd-card sd-mentor-card" style={{ borderColor: 'rgba(0, 255, 136, 0.12)' }}>
              <div className="sd-card-header">
                <span className="sd-card-icon"></span>
                <h2>About the Mentor</h2>
              </div>
              <div className="sd-mentor-bio-avatar" style={{ border: '2px solid #00ff88', boxShadow: '0 0 12px rgba(0, 255, 136, 0.25)' }}>{initials}</div>
              <div className="sd-mentor-bio-name">{skill.posted_by || 'Anonymous'}</div>
              <div className="sd-mentor-bio-role">PlaceForge Developer · {skill.category} Expert</div>
              <p className="sd-mentor-bio-text">
                Passionate about sharing knowledge and helping peers grow through skill exchange. Open to swapping expertise across domains.
              </p>
              <button className="sd-btn-outline" onClick={() => navigate('/skillswap')} style={{ borderColor: 'rgba(0, 255, 136, 0.25)', color: '#00ff88' }}>
                View All Their Skills
              </button>
            </div>

            {/* Quick Stats Card */}
            <div className="sd-card">
              <div className="sd-card-header">
                <span className="sd-card-icon"></span>
                <h2>Skill Stats</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Category', value: skill.category, color: 'var(--color-accent-2)' },
                  { label: 'Level', value: skill.proficiency_level, color: LVL_COLORS[skill.proficiency_level] || 'var(--color-accent-2)' },
                  { label: 'Questions', value: `${comments.filter(c => !c.parent_id).length} asked`, color: '#c084fc' },
                  { label: 'Replies', value: `${comments.filter(c => c.parent_id).length} replies`, color: 'var(--color-accent-4)' },
                ].map((stat, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{stat.label}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.88rem', fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
