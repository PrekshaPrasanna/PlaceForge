import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  RefreshCw, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  Award, 
  TrendingUp
} from 'lucide-react';
import { cultureService, QUIZ_QUESTIONS } from '../services/cultureService';
import type { 
  StudentCultureAssessment, 
  CompatibilityResult, 
  CultureProfile 
} from '../services/cultureService';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
};

const LOADING_STEPS = [
  'Parsing work style preferences...',
  'Analyzing trait scores...',
  'Querying company culture profiles...',
  'Calculating compatibility indices...',
  'Structuring personalized feedback...'
];

export default function CultureFit() {
  // Assessment and results states
  const [assessment, setAssessment] = useState<StudentCultureAssessment | null>(null);
  const [allCompatibilities, setAllCompatibilities] = useState<CompatibilityResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<CompatibilityResult | null>(null);
  const [companyProfiles, setCompanyProfiles] = useState<CultureProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quiz taking states
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizResponses, setQuizResponses] = useState<Record<number, number>>({});
  
  // Loading animations
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  // Initial load
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [savedAssessment, profiles] = await Promise.all([
          cultureService.fetchAssessment(),
          cultureService.getAllCultureProfiles()
        ]);
        setCompanyProfiles(profiles);

        if (savedAssessment) {
          setAssessment(savedAssessment);
          const results = await cultureService.checkAllCompatibilities(savedAssessment);
          setAllCompatibilities(results);
          if (results.length > 0) {
            setSelectedResult(results[0]); // default to highest fit
          }
        }
      } catch (err) {
        console.error('Failed to load culture assessment data', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Cycle processing status text for a premium AI feel
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Start the assessment quiz
  const handleStartQuiz = () => {
    setQuizResponses({});
    setCurrentQuestionIdx(0);
    setIsQuizActive(true);
  };

  // Answer selection
  const handleSelectOption = (optionIndex: number) => {
    const questionId = QUIZ_QUESTIONS[currentQuestionIdx].id;
    setQuizResponses(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1);
    }
  };

  // Compute final results
  const handleSubmitQuiz = async () => {
    setIsProcessing(true);
    setProcessingStep(0);
    
    // Simulate premium AI generation delay
    setTimeout(async () => {
      try {
        const studentScores = cultureService.quizResponsesToAssessment(quizResponses);
        const saved = await cultureService.saveAssessment(studentScores);
        setAssessment(saved);

        const results = await cultureService.checkAllCompatibilities(saved);
        setAllCompatibilities(results);
        if (results.length > 0) {
          setSelectedResult(results[0]); // select best match
        }
        setIsQuizActive(false);
      } catch (err) {
        console.error('Failed to calculate compatibility', err);
      } finally {
        setIsProcessing(false);
      }
    }, 2200);
  };

  const handleRetakeQuiz = async () => {
    if (window.confirm('Are you sure you want to retake the quiz? Your existing results will be overwritten.')) {
      handleStartQuiz();
    }
  };

  const handleClearResults = async () => {
    if (window.confirm('Are you sure you want to delete your profile culture score? This action is permanent.')) {
      setIsLoading(true);
      try {
        await cultureService.clearAssessment();
        setAssessment(null);
        setAllCompatibilities([]);
        setSelectedResult(null);
        setIsQuizActive(false);
      } catch (err) {
        console.error('Failed to clear results', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const selectCompanyResultByName = (name: string) => {
    const match = allCompatibilities.find(c => c.company_name === name);
    if (match) {
      setSelectedResult(match);
      // Smoothly scroll comparison card into view on small displays
      const element = document.getElementById('company-details-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Render general loading spinner for the whole page
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(124, 58, 237, 0.2)',
            borderTopColor: 'var(--color-accent-3)',
            borderRadius: '50%'
          }}
        />
      </div>
    );
  }

  return (
    <div className="culture-checker-page" style={{ position: 'relative' }}>
      {/* Decorative background gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '5%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-5%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(32, 227, 178, 0.08), transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none'
      }} />

      {/* Hero Header */}
      <header style={{ marginBottom: '3.5rem' }}>
        <h1 style={{ fontSize: '4.2rem', marginBottom: '1rem', letterSpacing: '-0.03em' }}>
          Company <span style={{ color: 'var(--color-accent-2)', textShadow: '0 0 35px rgba(32,227,178,0.4)' }}>Culture Fit</span>
        </h1>
        <p className="text-muted" style={{ fontSize: '1.25rem', fontWeight: 300, maxWidth: '720px', lineHeight: 1.6 }}>
          Discover which workplace environments fuel your productivity. Contrast your communication style, leadership approach, and pacing preferences with leading companies.
        </p>
      </header>

      <AnimatePresence mode="wait">
        {/* Processing Spinner Overlay */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6rem 0',
              textAlign: 'center'
            }}
          >
            <div style={{ position: 'relative', width: 130, height: 130, marginBottom: '2.5rem' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'conic-gradient(from 0deg, transparent 20%, var(--color-accent-2), var(--color-accent-3), transparent 85%)',
                  padding: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--color-bg-deep)' }}></div>
              </motion.div>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={46} className="text-primary" style={{ filter: 'drop-shadow(0 0 8px rgba(32, 227, 178, 0.6))' }} />
              </div>
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Running Core Matcher</h2>
            <p className="text-primary" style={{ fontSize: '1.1rem', fontWeight: 600, minHeight: '24px' }}>
              {LOADING_STEPS[processingStep]}
            </p>
          </motion.div>
        )}

        {/* Phase 1: Quiz Taking View */}
        {!isProcessing && isQuizActive && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="card"
            style={{ padding: '3rem', maxWidth: '850px', margin: '0 auto', background: 'rgba(255, 255, 255, 0.015)' }}
          >
            {/* Quiz Header Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <span className="text-muted" style={{ fontWeight: 700 }}>
                Question {currentQuestionIdx + 1} of {QUIZ_QUESTIONS.length}
              </span>
              <button 
                onClick={() => setIsQuizActive(false)}
                className="btn-secondary" 
                style={{ background: 'transparent', border: 'none', color: 'var(--color-accent-1)', fontSize: '0.9rem', cursor: 'pointer', padding: 0 }}
              >
                Cancel assessment
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', marginBottom: '3rem', overflow: 'hidden' }}>
              <motion.div 
                className="quiz-progress-fill" 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, var(--color-accent-3), var(--color-accent-2))',
                  boxShadow: '0 0 10px rgba(32,227,178,0.5)'
                }}
                animate={{ width: `${((currentQuestionIdx + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Current Question */}
            <h2 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: '2.5rem', lineHeight: 1.35 }}>
              {QUIZ_QUESTIONS[currentQuestionIdx].question}
            </h2>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3.5rem' }}>
              {QUIZ_QUESTIONS[currentQuestionIdx].options.map((option, idx) => {
                const questionId = QUIZ_QUESTIONS[currentQuestionIdx].id;
                const isSelected = quizResponses[questionId] === idx;
                
                return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.01, borderColor: 'var(--color-accent-2)' }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      padding: '1.5rem 2rem',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid var(--color-accent-2)' : '1px solid var(--glass-border)',
                      background: isSelected ? 'rgba(32, 227, 178, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                      boxShadow: isSelected ? '0 0 20px rgba(32, 227, 178, 0.15)' : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1.25rem',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '6px solid var(--color-accent-2)' : '2px solid var(--color-text-muted)',
                      background: 'transparent',
                      flexShrink: 0,
                      transition: 'border-width 0.15s'
                    }} />
                    <span style={{ fontSize: '1.1rem', color: isSelected ? '#fff' : 'var(--color-text-light)', lineHeight: 1.5 }}>
                      {option.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIdx === 0}
                className="btn btn-secondary"
                style={{ padding: '0.8rem 1.8rem', opacity: currentQuestionIdx === 0 ? 0.3 : 1, cursor: currentQuestionIdx === 0 ? 'not-allowed' : 'pointer' }}
              >
                <ArrowLeft size={16} /> Back
              </button>

              {currentQuestionIdx === QUIZ_QUESTIONS.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined}
                  className="btn btn-accent"
                  style={{
                    padding: '0.9rem 2.2rem',
                    opacity: quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined ? 0.5 : 1,
                    cursor: quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined ? 'not-allowed' : 'pointer'
                  }}
                >
                  Analyze My Fit <Sparkles size={16} />
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  disabled={quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined}
                  className="btn"
                  style={{
                    padding: '0.8rem 1.8rem',
                    opacity: quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined ? 0.5 : 1,
                    cursor: quizResponses[QUIZ_QUESTIONS[currentQuestionIdx].id] === undefined ? 'not-allowed' : 'pointer'
                  }}
                >
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Phase 2: Intro/Empty State (No saved scores) */}
        {!isProcessing && !isQuizActive && !assessment && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="card"
            style={{ 
              textAlign: 'center', 
              padding: '6rem 3rem', 
              background: 'rgba(32, 227, 178, 0.02)', 
              borderColor: 'rgba(32, 227, 178, 0.15)',
              maxWidth: '800px',
              margin: '0 auto'
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 15px rgba(32, 227, 178, 0.3))' }}>🧭</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.75rem' }}>Map Your Culture Fit Profile</h2>
            <p className="text-muted" style={{ fontSize: '1.15rem', maxWidth: '520px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
              Take our 12-question workplace preference quiz. Our AI matcher compares your working pace, communications, and teamwork style to 10 top-tier recruit target firms.
            </p>
            <button 
              onClick={handleStartQuiz} 
              className="btn" 
              style={{ padding: '1.1rem 3rem', fontSize: '1.1rem', boxShadow: '0 0 25px rgba(32, 227, 178, 0.4)' }}
            >
              Start Personality Assessment <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {/* Phase 3: Results Dashboard */}
        {!isProcessing && !isQuizActive && assessment && (
          <motion.div
            key="results-dashboard"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}
          >
            {/* Top Overview Bento Boxes */}
            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
              
              {/* My Profile Dimension Summary Card */}
              <motion.div variants={itemVariants} className="card" style={{ padding: '2.5rem' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem' }}>
                  <Award size={22} className="text-primary" /> Your Culture Traits
                </h3>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '2rem' }}>
                  Based on your personality profile assessment. Values represent rating scores out of 10.
                </p>

                {/* Traits ratings list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, justifyContent: 'center' }}>
                  {[
                    { label: 'Teamwork', val: assessment.teamwork, desc: assessment.work_style_preference },
                    { label: 'Communication', val: assessment.communication, desc: 'Active' },
                    { label: 'Change Adaptability', val: assessment.adaptability, desc: 'Agile' },
                    { label: 'Problem Solving', val: assessment.problem_solving, desc: 'Critical' },
                    { label: 'Leadership', val: assessment.leadership, desc: 'Independent' }
                  ].map((trait, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                        <span>{trait.label}</span>
                        <span className="text-primary">{trait.val} / 10</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${trait.val * 10}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          style={{ height: '100%', background: 'var(--color-accent-2)', borderRadius: '10px' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', background: 'rgba(0,0,0,0.15)', padding: '1rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Work Style</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{assessment.work_style_preference}</span>
                  </div>
                  <div style={{ width: '1px', background: 'var(--glass-border)' }} />
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>Pacing Preference</span>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>{assessment.pace_preference}</span>
                  </div>
                </div>
              </motion.div>

              {/* Best Compatibility Highlights Card */}
              {allCompatibilities.length > 0 && (
                <motion.div 
                  variants={itemVariants} 
                  className="card" 
                  style={{ 
                    padding: '2.5rem', 
                    background: 'linear-gradient(135deg, rgba(32, 227, 178, 0.08), rgba(124, 58, 237, 0.04))',
                    borderColor: 'rgba(32, 227, 178, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <span className="badge badge-primary" style={{ marginBottom: '1.25rem', boxShadow: '0 0 10px rgba(32,227,178,0.2)' }}>
                      🏆 Top Cultural Alignment
                    </span>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem', color: '#fff' }}>
                      {allCompatibilities[0].company_name}
                    </h2>
                    <p style={{ color: 'var(--color-accent-2)', fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={20} /> {allCompatibilities[0].overall_score}% Compatibility Fit
                    </p>
                    <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                      {companyProfiles.find(p => p.company_name === allCompatibilities[0].company_name)?.culture_description}
                    </p>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', marginBottom: '0.75rem' }}>Core Alignment Strengths</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {allCompatibilities[0].strengths.map((str, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.9rem' }}>
                          <CheckCircle2 size={16} style={{ color: 'var(--color-accent-2)', flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ color: '#fff' }}>{str}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                      <button 
                        onClick={() => selectCompanyResultByName(allCompatibilities[0].company_name)} 
                        className="btn" 
                        style={{ padding: '0.8rem 1.8rem', fontSize: '0.95rem' }}
                      >
                        Detailed Comparison <ChevronRight size={16} />
                      </button>
                      <button 
                        onClick={handleRetakeQuiz} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
                      >
                        <RefreshCw size={14} /> Retake
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Section Header: Interactive Comparison Tool */}
            <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 900, margin: 0 }}>Company Compatibility Contrast</h2>
                <p className="text-muted" style={{ margin: '0.25rem 0 0', fontSize: '1rem' }}>Select any targeting firm to run a deep comparison against your cultural profile results.</p>
              </div>

              {/* Company Selector Dropdown */}
              <div style={{ minWidth: '220px' }}>
                <select
                  value={selectedResult?.company_name || ''}
                  onChange={(e) => selectCompanyResultByName(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.95rem', fontWeight: 700 }}
                >
                  {allCompatibilities.map((r, idx) => (
                    <option key={idx} value={r.company_name}>
                      {r.company_name} ({r.overall_score}%)
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Detailed Selected Company Panel */}
            {selectedResult && (
              <motion.div
                id="company-details-card"
                key={selectedResult.company_name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="card"
                style={{ padding: '3rem', background: 'rgba(255,255,255,0.01)', border: `1px solid ${selectedResult.color}33` }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '3rem' }}>
                  
                  {/* Left Column: Details, charts, and recommendations */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.25rem' }}>
                      <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        borderRadius: '16px', 
                        background: 'rgba(255,255,255,0.03)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '1px solid var(--glass-border)',
                        color: selectedResult.color
                      }}>
                        <Building2 size={26} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0 }}>{selectedResult.company_name}</h2>
                        <span className="badge" style={{ 
                          color: selectedResult.color, 
                          borderColor: `${selectedResult.color}55`, 
                          background: `${selectedResult.color}15`,
                          marginTop: '0.4rem',
                          display: 'inline-block'
                        }}>
                          {selectedResult.fit_label}
                        </span>
                      </div>
                    </div>

                    <p className="text-muted" style={{ fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                      {companyProfiles.find(p => p.company_name === selectedResult.company_name)?.culture_description}
                    </p>

                    {/* Chart: Trait comparison (student vs company) */}
                    <div style={{ marginBottom: '3rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', marginBottom: '1.75rem' }}>
                        Dimension Score Comparisons
                      </h4>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {[
                          { key: 'teamwork', label: 'Teamwork & Collaboration' },
                          { key: 'communication', label: 'Communication Openness' },
                          { key: 'adaptability', label: 'Agile & Change Adaptability' },
                          { key: 'problem_solving', label: 'Analytical Problem Solving' },
                          { key: 'leadership', label: 'Leadership & Autonomy' }
                        ].map((item, idx) => {
                          const sVal = assessment[item.key as keyof typeof assessment] as number;
                          const cProfile = companyProfiles.find(p => p.company_name === selectedResult.company_name);
                          const cVal = cProfile ? (cProfile[item.key as keyof typeof cProfile] as number) : 5;

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                                <span style={{ fontWeight: 600 }}>{item.label}</span>
                                <div style={{ display: 'flex', gap: '1.25rem' }}>
                                  <span style={{ color: 'var(--color-accent-2)', fontWeight: 700 }}>You: {sVal}/10</span>
                                  <span style={{ color: 'var(--color-accent-3)', fontWeight: 700 }}>Company: {cVal}/10</span>
                                </div>
                              </div>
                              
                              {/* Stacked comparison bar */}
                              <div style={{ position: 'relative', width: '100%', height: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                {/* Student bar (Electric Teal) */}
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${sVal * 10}%` }}
                                  transition={{ duration: 0.8, delay: idx * 0.08 }}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, var(--color-accent-2)60, var(--color-accent-2))',
                                    opacity: 0.85,
                                    borderRadius: '20px'
                                  }}
                                />
                                {/* Company overlay indicator line (Purple Accent) */}
                                <motion.div
                                  initial={{ left: 0 }}
                                  animate={{ left: `${cVal * 10}%` }}
                                  transition={{ duration: 0.8 }}
                                  style={{
                                    position: 'absolute',
                                    top: 0,
                                    width: '4px',
                                    height: '100%',
                                    background: 'var(--color-accent-3)',
                                    boxShadow: '0 0 8px var(--color-accent-3)',
                                    zIndex: 5
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'flex-end', marginTop: '1.25rem', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '12px', height: '12px', background: 'var(--color-accent-2)', borderRadius: '3px' }} />
                          <span className="text-muted">Your Score</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{ width: '4px', height: '12px', background: 'var(--color-accent-3)' }} />
                          <span className="text-muted">Company Typical Profile</span>
                        </div>
                      </div>
                    </div>

                    {/* Actionable Improvement Suggestions */}
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', marginBottom: '1.25rem' }}>
                        Personalized Alignment Suggestions
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.15)', padding: '1.5rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                        {selectedResult.suggestions.length > 0 ? (
                          selectedResult.suggestions.map((sug, i) => (
                            <div key={i} style={{ fontSize: '0.92rem', lineHeight: 1.5, color: 'rgba(255,255,255,0.9)' }}>
                              {sug}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.92rem', color: 'var(--color-accent-2)', fontWeight: 600 }}>
                            ⭐ Ideal alignment! You have no critical cultural friction gaps with this organization.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Score ring and Strengths / Weaknesses */}
                  <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '3rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                    
                    {/* Circle Score Ring */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '1px', marginBottom: '1.25rem' }}>
                        Fit Score
                      </span>
                      <div style={{ 
                        position: 'relative', 
                        width: '160px', 
                        height: '160px', 
                        borderRadius: '50%',
                        background: `conic-gradient(${selectedResult.color} ${selectedResult.overall_score}%, rgba(255,255,255,0.03) ${selectedResult.overall_score}%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: `0 0 25px ${selectedResult.color}15`
                      }}>
                        <div style={{ 
                          width: '136px', 
                          height: '136px', 
                          borderRadius: '50%', 
                          background: '#0a1012', 
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                            {selectedResult.overall_score}%
                          </span>
                          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: selectedResult.color, fontWeight: 700, letterSpacing: '0.5px', marginTop: '0.25rem' }}>
                            {selectedResult.fit_label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* List: Strengths */}
                    <div>
                      <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <CheckCircle2 size={14} style={{ color: 'var(--color-accent-2)' }} /> Cultural Strengths
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {selectedResult.strengths.map((str, i) => (
                          <div key={i} style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', borderLeft: '2px solid var(--color-accent-2)', paddingLeft: '0.75rem', lineHeight: 1.4 }}>
                            {str}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* List: Friction Areas */}
                    <div>
                      <h5 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#fff', letterSpacing: '1px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <XCircle size={14} style={{ color: 'var(--color-accent-1)' }} /> Friction Gaps
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {selectedResult.weaknesses.length > 0 ? (
                          selectedResult.weaknesses.map((weak, i) => (
                            <div key={i} style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', borderLeft: '2px solid var(--color-accent-1)', paddingLeft: '0.75rem', lineHeight: 1.4 }}>
                              {weak}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No substantial friction areas detected.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}

            {/* Ranked List Grid: All Companies */}
            <motion.div variants={itemVariants}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>Verified Target Placements Fit Rankings</h3>
              <div className="grid grid-cols-4" style={{ gap: '1.25rem' }}>
                {allCompatibilities.map((r, idx) => {
                  const isSelected = selectedResult?.company_name === r.company_name;
                  return (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      onClick={() => selectCompanyResultByName(r.company_name)}
                      style={{
                        padding: '1.5rem',
                        borderRadius: '24px',
                        border: isSelected ? `2px solid ${r.color}` : '1px solid var(--glass-border)',
                        background: isSelected ? `${r.color}08` : 'rgba(255,255,255,0.01)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: isSelected ? `0 6px 20px ${r.color}15` : 'none',
                        transition: 'border-color 0.2s, background-color 0.2s',
                        height: '160px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{r.company_name}</span>
                        </div>
                        <span style={{ 
                          fontSize: '0.72rem', 
                          fontWeight: 800, 
                          color: r.color, 
                          textTransform: 'uppercase', 
                          background: `${r.color}15`,
                          padding: '0.3rem 0.6rem',
                          borderRadius: '100px',
                          border: `1px solid ${r.color}33`
                        }}>
                          #{idx + 1} Fit
                        </span>
                      </div>

                      <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                          {r.overall_score}<span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>%</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                          {r.fit_label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Clear Profile Button */}
            <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
              <button 
                onClick={handleClearResults} 
                className="btn btn-secondary" 
                style={{ borderColor: 'rgba(255, 51, 102, 0.2)', color: 'var(--color-accent-1)', fontSize: '0.9rem', padding: '0.75rem 1.75rem' }}
              >
                Delete Assessment Profile
              </button>
            </motion.div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
