'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import Timer from '../../../src/components/Timer';
import ProgressBar from '../../../src/components/ProgressBar';
import PointsBadge from '../../../src/components/PointsBadge';
import { apiCall } from '../../../src/lib/api';
import { isLoggedIn, getStudent, saveAuth } from '../../../src/lib/auth';
import MathRenderer from '../../../src/components/MathRenderer';

const SUBJECT_CONFIG = {
  Physics:     { gradient: 'linear-gradient(135deg, #4776e6 0%, #6c5ce7 100%)', primary: '#6c5ce7', bg: '#f4f3ff', chipBg: '#ede9ff', chipBorder: '#c4b9ff' },
  Chemistry:   { gradient: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)', primary: '#059669', bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7' },
  Mathematics: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', primary: '#2563eb', bg: '#f0f4ff', chipBg: '#dbeafe', chipBorder: '#93c5fd' },
  Biology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)', primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Botany:      { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)', primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Zoology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)', primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
};
const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

const TIER_LABELS = {
  T1: { label: 'Foundation', short: 'T1', color: '#6c63ff' },
  T2: { label: 'Application', short: 'T2', color: '#f59e0b' },
  T3: { label: 'JEE Style',  short: 'T3', color: '#ef4444' },
};

export default function LadderPage() {
  const router = useRouter();
  const { bossId } = useParams();

  const [bossQuestion, setBossQuestion] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [uiPhase, setUiPhase] = useState('main'); // 'main' | 'clone'
  const [confidence, setConfidence] = useState(null); // null | 'confident' | 'guessing'
  const [gotItPressed, setGotItPressed] = useState(false);
  const [cloneWrongCount, setCloneWrongCount] = useState(0);
  const [theoryExpanded, setTheoryExpanded] = useState(false);
  const [theoryLang, setTheoryLang] = useState('English');

  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const [timerRunning, setTimerRunning] = useState(false);
  const secondsRef = useRef(0);
  const hintOpenedRef = useRef(false);
  const theoryOpenedRef = useRef(false);
  const videoWatchedRef = useRef(false);

  const [lastPoints, setLastPoints] = useState(0);
  const [pointsTrigger, setPointsTrigger] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    loadLadder();
  }, [bossId]);

  const loadLadder = async () => {
    setLoading(true);
    const data = await apiCall(`/boss-questions/${bossId}`);
    if (!data.success) { setError(data.error || 'Failed to load'); setLoading(false); return; }
    setBossQuestion(data.boss_question);
    const activeSteps = (data.steps || []).filter(s => s.is_active !== false);
    setSteps(activeSteps);
    const prog = data.student_progress;
    if (prog?.is_completed) {
      setCompleted(true);
      setTotalEarned(prog.total_points_earned || 0);
    } else {
      let startIndex = 0;
      if (prog && prog.steps_completed > 0) startIndex = Math.min(prog.steps_completed, activeSteps.length - 1);
      setCurrentStepIndex(startIndex);
    }
    setLoading(false);
    // Timer starts after confidence check, not here
  };

  // Reset for a new main question (requires confidence check)
  const resetForNewQuestion = () => {
    secondsRef.current = 0;
    hintOpenedRef.current = false;
    theoryOpenedRef.current = false;
    videoWatchedRef.current = false;
    setSelected(null); setSubmitting(false); setSubmitted(false); setResult(null);
    setConfidence(null);
    setGotItPressed(false);
    setCloneWrongCount(0);
    setTheoryExpanded(false);
    setTimerRunning(false);
  };

  // Reset for clone question (timer starts immediately, no confidence check)
  const resetForClone = () => {
    secondsRef.current = 0;
    hintOpenedRef.current = false;
    theoryOpenedRef.current = false;
    videoWatchedRef.current = false;
    setSelected(null); setSubmitting(false); setSubmitted(false); setResult(null);
    setTheoryExpanded(false);
    setTimerRunning(true);
  };

  const handleTimerTick = useCallback(secs => { secondsRef.current = secs; }, []);
  const currentStep = steps[currentStepIndex];

  const chooseConfidence = (choice) => {
    setConfidence(choice);
    setTimerRunning(true);
  };

  const getBackendPhase = () => uiPhase === 'main' ? 'main' : 'clone';

  const submitAnswer = async () => {
    if (!selected || submitting || submitted) return;
    setSubmitting(true); setTimerRunning(false);
    const data = await apiCall('/attempts/submit', 'POST', {
      boss_question_id: parseInt(bossId),
      step_id: currentStep.id,
      selected_options: [selected],
      time_taken_seconds: secondsRef.current,
      phase: getBackendPhase(),
      hint_opened: hintOpenedRef.current,
      theory_opened: theoryOpenedRef.current,
      video_watched: videoWatchedRef.current,
      confidence,
    });
    setSubmitting(false);
    if (!data.success) { setError(data.error || 'Submission failed'); return; }
    setResult(data); setSubmitted(true);
    if (data.points_earned > 0) {
      setLastPoints(data.points_earned); setPointsTrigger(t => t + 1);
      const student = getStudent();
      if (student) saveAuth(sessionStorage.getItem('studentToken'), { ...student, total_points: data.student_total_points });
    }
    if (data.progress?.is_completed) {
      setTimeout(() => { setCompleted(true); setTotalEarned(data.progress.total_points_earned || 0); }, 1800);
      return;
    }
    if (!data.is_correct && uiPhase === 'clone') {
      setCloneWrongCount(c => c + 1);
    }
  };

  const goNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= steps.length) { setCompleted(true); return; }
    setCurrentStepIndex(nextIdx);
    setUiPhase('main');
    resetForNewQuestion();
  };

  const startClone = () => {
    setUiPhase('clone');
    resetForClone();
  };

  const retryClone = () => resetForClone();

  const openVideo = () => {
    videoWatchedRef.current = true;
    if (currentStep?.video_url) window.open(currentStep.video_url, '_blank');
  };

  const cfg = (bossQuestion?.subject && SUBJECT_CONFIG[bossQuestion.subject]) ? SUBJECT_CONFIG[bossQuestion.subject] : DEFAULT_CFG;
  const isClonePhase = uiPhase === 'clone';

  const questionText = isClonePhase ? currentStep?.clone_question_text : currentStep?.question_text;
  const questionImageUrl = isClonePhase ? currentStep?.clone_question_image_url : currentStep?.question_image_url;
  const options = (isClonePhase
    ? [{ label: 'A', text: currentStep?.clone_option_a, img: currentStep?.clone_option_a_image_url }, { label: 'B', text: currentStep?.clone_option_b, img: currentStep?.clone_option_b_image_url }, { label: 'C', text: currentStep?.clone_option_c, img: currentStep?.clone_option_c_image_url }, { label: 'D', text: currentStep?.clone_option_d, img: currentStep?.clone_option_d_image_url }]
    : [{ label: 'A', text: currentStep?.option_a, img: currentStep?.option_a_image_url }, { label: 'B', text: currentStep?.option_b, img: currentStep?.option_b_image_url }, { label: 'C', text: currentStep?.option_c, img: currentStep?.option_c_image_url }, { label: 'D', text: currentStep?.option_d, img: currentStep?.option_d_image_url }]
  ).filter(o => o.text || o.img);

  const getOptionStyle = (label) => {
    if (!submitted) return {
      display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left',
      borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', fontSize: '15px',
      background: selected === label ? cfg.chipBg : '#fff',
      border: selected === label ? `2px solid ${cfg.primary}` : `1.5px solid ${cfg.chipBorder}`,
      color: '#1a1035', fontWeight: selected === label ? 600 : 400,
      boxShadow: selected === label ? `0 0 0 3px ${cfg.primary}18` : 'none',
    };
    const correct = String(result?.correct_options || '').toUpperCase().trim();
    if (correct.includes(label)) return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: '2px solid #22c55e', background: 'rgba(34,197,94,0.1)', color: '#15803d', fontWeight: 600, cursor: 'default' };
    if (selected === label) return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontWeight: 600, cursor: 'default' };
    return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: `1.5px solid ${cfg.chipBorder}`, background: '#fff', color: '#8888aa', cursor: 'default' };
  };

  const navBar = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cfg.chipBorder}` }}>
      <Navbar />
    </div>
  );

  if (loading) return <div style={{ minHeight: '100vh', background: '#f4f3ff' }}>{navBar}<div style={{ paddingTop: '5rem', textAlign: 'center', color: '#8888aa' }}>Loading ladder...</div></div>;
  if (error) return <div style={{ minHeight: '100vh', background: cfg.bg }}>{navBar}<div style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem' }}><div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem', color: '#dc2626' }}>{error}</div></div></div>;

  if (completed) return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '5rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem 2rem', border: `1px solid ${cfg.chipBorder}`, boxShadow: `0 8px 32px ${cfg.primary}18` }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1035', marginBottom: '0.5rem' }}>Ladder Complete!</h2>
          <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '4px' }}>You mastered all {steps.length} steps of</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1035', marginBottom: '1.5rem' }}>{bossQuestion?.title}</p>
          <div style={{ fontSize: '3rem', fontWeight: 900, background: cfg.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>{totalEarned} pts</div>
          <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '2rem' }}>total points earned (includes 20 bonus pts)</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/concepts/${bossQuestion?.concept_id}`}><button style={{ padding: '12px 24px', borderRadius: '12px', border: `1.5px solid ${cfg.chipBorder}`, background: '#fff', color: cfg.primary, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Back to Concept</button></Link>
            <Link href="/leaderboard"><button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Leaderboard</button></Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentStep) return <div style={{ minHeight: '100vh', background: cfg.bg }}>{navBar}<div style={{ paddingTop: '5rem', textAlign: 'center', color: '#8888aa' }}>No questions found.</div></div>;

  const tierInfo = currentStep?.tier ? TIER_LABELS[currentStep.tier] : null;

  const PageWrap = ({ children }) => (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <PointsBadge points={lastPoints} triggerKey={pointsTrigger} />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 1.25rem 4rem' }}>
        {children}
      </div>
    </div>
  );

  const PageHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
      <div>
        <Link href={`/concepts/${bossQuestion?.concept_id}`} style={{ color: cfg.primary, fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          ← {bossQuestion?.concept_name}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1035', margin: 0 }}>{bossQuestion?.title}</h1>
          {tierInfo && (
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: `${tierInfo.color}15`, color: tierInfo.color, border: `1px solid ${tierInfo.color}30`, letterSpacing: '0.05em' }}>
              {tierInfo.short} · {tierInfo.label}
            </span>
          )}
        </div>
      </div>
      <Timer running={timerRunning} onTick={handleTimerTick} />
    </div>
  );

  const ProgressCard = () => (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '1.25rem', border: `1px solid ${cfg.chipBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <ProgressBar current={currentStepIndex + 1} total={steps.length} />
    </div>
  );

  const TheoryPanel = () => {
    if (!currentStep.theory_card && !currentStep.theory_card_hinglish) return null;
    return (
      <div style={{ marginBottom: '10px' }}>
        {!theoryExpanded ? (
          <button onClick={() => { theoryOpenedRef.current = true; setTheoryExpanded(true); }} style={{ fontSize: '13px', fontWeight: 600, padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', border: `1.5px solid ${cfg.chipBorder}`, background: '#fff', color: cfg.primary }}>
            📖 View Theory
          </button>
        ) : (
          <div style={{ background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`, borderRadius: '12px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: cfg.primary, fontWeight: 700, letterSpacing: '0.05em' }}>THEORY</div>
              {currentStep.theory_card && currentStep.theory_card_hinglish && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['English', 'Hinglish'].map(lang => (
                    <button key={lang} onClick={() => setTheoryLang(lang)} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 600, background: theoryLang === lang ? cfg.primary : 'rgba(0,0,0,0.06)', color: theoryLang === lang ? '#fff' : '#8888aa' }}>{lang}</button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: '14px', color: '#1a1035', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              <MathRenderer text={theoryLang === 'Hinglish' && currentStep.theory_card_hinglish ? currentStep.theory_card_hinglish : currentStep.theory_card} />
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── CONFIDENCE CHECK SCREEN ──
  if (uiPhase === 'main' && !confidence) {
    return (
      <PageWrap>
        <PageHeader />
        <ProgressCard />
        <div style={{ background: '#fff', borderRadius: '20px', padding: '2.5rem 2rem', border: `1px solid ${cfg.chipBorder}`, borderTop: `4px solid ${cfg.primary}`, boxShadow: `0 4px 24px ${cfg.primary}12`, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤔</div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1a1035', marginBottom: '8px' }}>Before you answer...</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2rem', lineHeight: 1.5 }}>
            How confident are you about this concept?
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button onClick={() => chooseConfidence('confident')} style={{ flex: 1, maxWidth: '180px', padding: '14px', borderRadius: '14px', cursor: 'pointer', border: '2px solid #22c55e', background: 'rgba(34,197,94,0.06)', color: '#15803d', fontWeight: 700, fontSize: '15px' }}>
              ✅ Confident
            </button>
            <button onClick={() => chooseConfidence('guessing')} style={{ flex: 1, maxWidth: '180px', padding: '14px', borderRadius: '14px', cursor: 'pointer', border: '2px solid #f59e0b', background: 'rgba(245,158,11,0.06)', color: '#b45309', fontWeight: 700, fontSize: '15px' }}>
              🤔 Not Sure
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#9090a8', marginTop: '1.5rem' }}>Step {currentStepIndex + 1} of {steps.length}</p>
        </div>
      </PageWrap>
    );
  }

  // ── QUESTION SCREEN (main or clone) ──
  return (
    <PageWrap>
      <PageHeader />
      <ProgressCard />

      {/* Problem context */}
      {bossQuestion?.question_text && (
        <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '1.25rem', border: `1px solid ${cfg.chipBorder}`, borderLeft: `4px solid ${cfg.primary}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '11px', color: cfg.primary, fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Problem Context</div>
          <div style={{ fontSize: '14px', color: '#3a3a5a', lineHeight: 1.7 }}><MathRenderer text={bossQuestion.question_text} /></div>
          {bossQuestion.question_image_url && <img src={bossQuestion.question_image_url} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginTop: '10px', display: 'block' }} />}
        </div>
      )}

      {/* Badge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {isClonePhase ? (
          <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>CLONE QUESTION</span>
        ) : (
          <>
            <span style={{ background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`, color: cfg.primary, fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>STEP {currentStep.step_number}</span>
            {confidence && (
              <span style={{ fontSize: '11px', color: confidence === 'confident' ? '#15803d' : '#b45309', background: confidence === 'confident' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                {confidence === 'confident' ? '✅ Confident' : '🤔 Not Sure'}
              </span>
            )}
            {currentStep.is_mastery_gate && (
              <span style={{ fontSize: '11px', color: '#b45309', background: 'rgba(245,158,11,0.12)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>⭐ Mastery Gate</span>
            )}
          </>
        )}
        {currentStep.concept_tag && <span style={{ fontSize: '12px', color: cfg.primary, fontWeight: 500 }}>{currentStep.concept_tag}</span>}
        {!isClonePhase && !submitted && currentStep.marks && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: cfg.primary, background: cfg.chipBg, padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>+{currentStep.marks} pts</span>
        )}
      </div>

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '1rem', border: `1px solid ${cfg.chipBorder}`, borderTop: `3px solid ${submitted ? (result?.is_correct ? '#22c55e' : '#ef4444') : cfg.primary}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        {isClonePhase && (
          <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '10px', background: cfg.chipBg, display: 'inline-block', padding: '2px 10px', borderRadius: '9999px' }}>A simplified version of the same concept</div>
        )}
        <div style={{ fontSize: '16px', lineHeight: 1.75, marginBottom: questionImageUrl ? '10px' : '1.25rem', fontWeight: 500, color: '#1a1035' }}>
          <MathRenderer text={questionText} />
        </div>
        {questionImageUrl && <img src={questionImageUrl} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginBottom: '1.25rem', display: 'block' }} />}

        {options.map(opt => (
          <button key={opt.label} disabled={submitted} onClick={() => !submitted && setSelected(opt.label)} style={getOptionStyle(opt.label)}>
            <span style={{ fontWeight: 700, marginRight: '10px', color: submitted ? 'inherit' : cfg.primary }}>{opt.label}.</span>
            {opt.text && <MathRenderer text={opt.text} />}
            {opt.img && <img src={opt.img} alt="" style={{ maxWidth: '240px', maxHeight: '100px', objectFit: 'contain', display: 'block', marginTop: opt.text ? '6px' : 0, borderRadius: '4px' }} />}
          </button>
        ))}

        {!submitted && (
          <button disabled={!selected || submitting} onClick={submitAnswer} style={{ width: '100%', marginTop: '1rem', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: selected ? cfg.gradient : '#e5e7eb', color: selected ? '#fff' : '#9ca3af', cursor: selected ? 'pointer' : 'default', transition: 'all 0.2s' }}>
            {submitting ? 'Checking...' : 'Submit Answer'}
          </button>
        )}
      </div>

      {/* ── CORRECT ── */}
      {submitted && result?.is_correct && (
        <>
          <div style={{ borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div style={{ fontWeight: 700, color: '#15803d', marginBottom: result.insight_correct || result.explanation ? '6px' : 0 }}>
              ✅ Correct! +{result.points_earned} pts
            </div>
            {(result.insight_correct || result.explanation) && (
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#1a5c2a' }}>
                <MathRenderer text={result.insight_correct || result.explanation} />
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1rem' }}><TheoryPanel /></div>
          <button onClick={goNextStep} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer' }}>
            {currentStepIndex + 1 >= steps.length ? 'Complete Ladder 🎉' : 'Next Step →'}
          </button>
        </>
      )}

      {/* ── WRONG on MAIN ── */}
      {submitted && !result?.is_correct && uiPhase === 'main' && (
        <>
          <div style={{ borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>❌ Incorrect</div>
            {(result.insight_wrong || result.explanation) && (
              <div style={{ fontSize: '14px', color: '#3a3a5a', lineHeight: 1.7 }}>
                <MathRenderer text={result.insight_wrong || result.explanation} />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}><TheoryPanel /></div>

          {currentStep.video_url && (
            <button onClick={openVideo} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', marginBottom: '10px', cursor: 'pointer', border: '1.5px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.05)', color: '#f43f5e' }}>
              ▶ Learn with Video
            </button>
          )}

          {currentStep.clone_question_text ? (
            !gotItPressed ? (
              <button onClick={() => setGotItPressed(true)} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
                Got it — Try Again →
              </button>
            ) : (
              <button onClick={startClone} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
                Try Clone Question →
              </button>
            )
          ) : (
            <button onClick={goNextStep} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
              Next Step →
            </button>
          )}

          <button onClick={goNextStep} style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: 600, borderRadius: '12px', background: '#fff', border: `1.5px solid ${cfg.chipBorder}`, color: '#8888aa', cursor: 'pointer' }}>
            Skip to Next Step
          </button>
        </>
      )}

      {/* ── WRONG on CLONE ── */}
      {submitted && !result?.is_correct && uiPhase === 'clone' && (
        <>
          <div style={{ borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)' }}>
            <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '6px' }}>❌ Not quite</div>
            {(result.insight_wrong || result.explanation) && (
              <div style={{ fontSize: '14px', color: '#3a3a5a', lineHeight: 1.7 }}>
                <MathRenderer text={result.insight_wrong || result.explanation} />
              </div>
            )}
          </div>

          {cloneWrongCount < 2 ? (
            <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '10px', border: `1px solid ${cfg.chipBorder}` }}>
              <div style={{ fontWeight: 700, color: '#1a1035', marginBottom: '12px', fontSize: '14px' }}>How would you like to continue?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {currentStep.video_url && (
                  <button onClick={() => { openVideo(); setTimeout(retryClone, 600); }} style={{ padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', border: '1.5px solid rgba(244,63,94,0.25)', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>
                    📹 Watch Video — then retry
                  </button>
                )}
                <button onClick={retryClone} style={{ padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', border: `1.5px solid ${cfg.chipBorder}`, background: cfg.chipBg, color: cfg.primary, fontWeight: 600, fontSize: '14px', textAlign: 'left' }}>
                  🔁 Solve Similar — try again
                </button>
                <TheoryPanel />
              </div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '10px', border: `1px solid ${cfg.chipBorder}` }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', lineHeight: 1.5 }}>
                💡 This concept needs more practice. Move on and come back to it later.
              </div>
              {currentStep.video_url && (
                <button onClick={openVideo} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer', border: '1.5px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', marginBottom: '8px' }}>
                  ▶ Watch Video before moving on
                </button>
              )}
            </div>
          )}

          <button onClick={goNextStep} style={{ width: '100%', padding: cloneWrongCount >= 2 ? '13px' : '11px', fontSize: cloneWrongCount >= 2 ? '15px' : '13px', fontWeight: 700, borderRadius: '12px', background: cloneWrongCount >= 2 ? cfg.gradient : '#fff', border: cloneWrongCount >= 2 ? 'none' : `1.5px solid ${cfg.chipBorder}`, color: cloneWrongCount >= 2 ? '#fff' : '#8888aa', cursor: 'pointer' }}>
            {currentStepIndex + 1 >= steps.length ? 'Complete Ladder 🎉' : (cloneWrongCount >= 2 ? 'Next Step →' : 'Skip to Next Step')}
          </button>
        </>
      )}
    </PageWrap>
  );
}
