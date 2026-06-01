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
  Physics:     { gradient: 'linear-gradient(135deg, #4776e6 0%, #6c5ce7 100%)', primary: '#6c5ce7', bg: '#f4f3ff', chipBg: '#ede9ff', chipBorder: '#c4b9ff', optionBorder: '#c4b9ff', optionHover: '#ede9ff' },
  Chemistry:   { gradient: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)', primary: '#059669', bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7', optionBorder: '#6ee7b7', optionHover: '#d1fae5' },
  Mathematics: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', primary: '#2563eb', bg: '#f0f4ff', chipBg: '#dbeafe', chipBorder: '#93c5fd', optionBorder: '#93c5fd', optionHover: '#dbeafe' },
  Biology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac', optionBorder: '#86efac', optionHover: '#dcfce7' },
  Botany:      { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac', optionBorder: '#86efac', optionHover: '#dcfce7' },
  Zoology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac', optionBorder: '#86efac', optionHover: '#dcfce7' },
};
const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

export default function LadderPage() {
  const router = useRouter();
  const { bossId } = useParams();

  const [bossQuestion, setBossQuestion] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const [uiPhase, setUiPhase] = useState('main');
  const [hintVisible, setHintVisible] = useState(false);
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
    setTimerRunning(true);
  };

  const resetAnswerState = () => {
    secondsRef.current = 0;
    hintOpenedRef.current = false;
    theoryOpenedRef.current = false;
    videoWatchedRef.current = false;
    setSelected(null); setSubmitting(false); setSubmitted(false); setResult(null);
    setTimerRunning(true);
  };

  const handleTimerTick = useCallback(secs => { secondsRef.current = secs; }, []);
  const currentStep = steps[currentStepIndex];

  const getBackendPhase = () => {
    if (uiPhase === 'main') return 'main';
    if (uiPhase === 'clone' && hintVisible) return 'clone_hint';
    return 'clone';
  };

  const submitAnswer = async () => {
    if (!selected || submitting || submitted) return;
    setSubmitting(true); setTimerRunning(false);
    const data = await apiCall('/attempts/submit', 'POST', {
      boss_question_id: parseInt(bossId), step_id: currentStep.id,
      selected_options: [selected], time_taken_seconds: secondsRef.current,
      phase: getBackendPhase(), hint_opened: hintOpenedRef.current,
      theory_opened: theoryOpenedRef.current, video_watched: videoWatchedRef.current,
    });
    setSubmitting(false);
    if (!data.success) { setError(data.error || 'Submission failed'); return; }
    setResult(data); setSubmitted(true);
    if (data.points_earned > 0) {
      setLastPoints(data.points_earned); setPointsTrigger(t => t + 1);
      const student = getStudent();
      if (student) saveAuth(localStorage.getItem('studentToken'), { ...student, total_points: data.student_total_points });
    }
    if (data.progress?.is_completed) {
      setTimeout(() => { setCompleted(true); setTotalEarned(data.progress.total_points_earned || 0); }, 1800);
      return;
    }
    if (!data.is_correct) {
      if (uiPhase === 'main') { setUiPhase('remediation'); setTheoryExpanded(false); }
      else if (uiPhase === 'clone' && !hintVisible) { setHintVisible(true); hintOpenedRef.current = true; }
      else if (uiPhase === 'clone' && hintVisible) {
        setUiPhase('remediation'); setHintVisible(false); setTheoryExpanded(false);
        setSelected(null); setSubmitted(false); setResult(null);
      }
    }
  };

  const goNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= steps.length) { setCompleted(true); return; }
    setCurrentStepIndex(nextIdx); setUiPhase('main'); setHintVisible(false);
    setTheoryExpanded(false); resetAnswerState();
  };

  const startCloneQuestion = () => { setUiPhase('clone'); setHintVisible(false); resetAnswerState(); };
  const retryCloneWithHint = () => { secondsRef.current = 0; setSelected(null); setSubmitted(false); setResult(null); setTimerRunning(true); };
  const openVideo = () => { videoWatchedRef.current = true; if (currentStep?.video_url) window.open(currentStep.video_url, '_blank'); };
  const expandTheory = () => { theoryOpenedRef.current = true; setTheoryExpanded(true); };

  const isClonePhase = uiPhase === 'clone';
  const questionText = isClonePhase ? currentStep?.clone_question_text : currentStep?.question_text;
  const questionImageUrl = isClonePhase ? currentStep?.clone_question_image_url : currentStep?.question_image_url;
  const options = (isClonePhase
    ? [{ label:'A', text:currentStep?.clone_option_a, img:currentStep?.clone_option_a_image_url }, { label:'B', text:currentStep?.clone_option_b, img:currentStep?.clone_option_b_image_url }, { label:'C', text:currentStep?.clone_option_c, img:currentStep?.clone_option_c_image_url }, { label:'D', text:currentStep?.clone_option_d, img:currentStep?.clone_option_d_image_url }]
    : [{ label:'A', text:currentStep?.option_a, img:currentStep?.option_a_image_url }, { label:'B', text:currentStep?.option_b, img:currentStep?.option_b_image_url }, { label:'C', text:currentStep?.option_c, img:currentStep?.option_c_image_url }, { label:'D', text:currentStep?.option_d, img:currentStep?.option_d_image_url }]
  ).filter(o => o.text || o.img);

  const cfg = (bossQuestion?.subject && SUBJECT_CONFIG[bossQuestion.subject]) ? SUBJECT_CONFIG[bossQuestion.subject] : DEFAULT_CFG;

  const getOptionStyle = (label) => {
    if (!submitted) {
      return {
        display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left',
        borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s', fontSize: '15px',
        background: selected === label ? cfg.chipBg : '#fff',
        border: selected === label ? `2px solid ${cfg.primary}` : `1.5px solid ${cfg.chipBorder}`,
        color: '#1a1035', fontWeight: selected === label ? 600 : 400,
        boxShadow: selected === label ? `0 0 0 3px ${cfg.primary}18` : 'none',
      };
    }
    const correct = String(result?.correct_options || '').toUpperCase().trim();
    if (correct.includes(label)) return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: '2px solid #22c55e', background: 'rgba(34,197,94,0.1)', color: '#15803d', fontWeight: 600, cursor: 'default' };
    if (selected === label) return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: '2px solid #ef4444', background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontWeight: 600, cursor: 'default' };
    return { display: 'block', width: '100%', padding: '13px 16px', marginBottom: '8px', textAlign: 'left', borderRadius: '12px', fontSize: '15px', border: `1.5px solid ${cfg.chipBorder}`, background: '#fff', color: '#8888aa', cursor: 'default' };
  };

  const navBar = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cfg.chipBorder}`, transition: 'all 0.3s' }}>
      <Navbar />
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f4f3ff' }}>
      {navBar}
      <div style={{ paddingTop: '5rem', textAlign: 'center', color: '#8888aa' }}>Loading ladder...</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem', color: '#dc2626' }}>{error}</div>
      </div>
    </div>
  );

  if (completed) return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <div style={{ maxWidth: '560px', margin: '0 auto', padding: '5rem 1.5rem 3rem', textAlign: 'center' }}>
        <div style={{ background: '#fff', borderRadius: '24px', padding: '3rem 2rem', border: `1px solid ${cfg.chipBorder}`, boxShadow: `0 8px 32px ${cfg.primary}18` }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1a1035', marginBottom: '0.5rem' }}>Ladder Complete!</h2>
          <p style={{ color: '#8888aa', fontSize: '14px', marginBottom: '4px' }}>You have mastered all {steps.length} steps of</p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a1035', marginBottom: '1.5rem' }}>{bossQuestion?.title}</p>
          <div style={{ fontSize: '3rem', fontWeight: 900, background: cfg.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>{totalEarned} pts</div>
          <p style={{ color: '#8888aa', fontSize: '13px', marginBottom: '2rem' }}>total points earned (includes 20 bonus pts)</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/concepts/${bossQuestion?.concept_id}`}>
              <button style={{ padding: '12px 24px', borderRadius: '12px', border: `1.5px solid ${cfg.chipBorder}`, background: '#fff', color: cfg.primary, fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>Back to Concept</button>
            </Link>
            <Link href="/leaderboard">
              <button style={{ padding: '12px 24px', borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>View Leaderboard</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!currentStep) return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <div style={{ paddingTop: '5rem', textAlign: 'center', color: '#8888aa' }}>No questions found for this ladder.</div>
    </div>
  );

  // ── Shared page wrapper ──
  const PageWrap = ({ children }) => (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      {navBar}
      <PointsBadge points={lastPoints} triggerKey={pointsTrigger} />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 1.25rem 4rem' }}>
        {children}
      </div>
    </div>
  );

  // Shared header
  const PageHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
      <div>
        <Link href={`/concepts/${bossQuestion?.concept_id}`} style={{ color: cfg.primary, fontSize: '12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
          ← {bossQuestion?.concept_name}
        </Link>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1035', marginTop: '2px' }}>{bossQuestion?.title}</h1>
      </div>
      <Timer running={timerRunning} onTick={handleTimerTick} />
    </div>
  );

  // Shared progress bar
  const ProgressCard = () => (
    <div style={{ background: '#fff', borderRadius: '14px', padding: '14px 16px', marginBottom: '1.25rem', border: `1px solid ${cfg.chipBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <ProgressBar current={currentStepIndex + 1} total={steps.length} />
    </div>
  );

  // ── Remediation screen ──
  if (uiPhase === 'remediation') return (
    <PageWrap>
      <PageHeader />
      <ProgressCard />

      {/* Wrong answer */}
      <div style={{ background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: '6px' }}>Incorrect</div>
        {result?.explanation && (
          <div style={{ fontSize: '14px', color: '#3a3a5a', lineHeight: 1.7 }}>
            <MathRenderer text={result.explanation} />
          </div>
        )}
      </div>

      {/* Original question context */}
      <div style={{ fontSize: '11px', color: '#9090a8', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>
        STEP {currentStep.step_number}{currentStep.concept_tag ? ` · ${currentStep.concept_tag}` : ''}
      </div>
      <div style={{ background: '#fff', borderRadius: '14px', padding: '16px', marginBottom: '1.25rem', border: `1px solid ${cfg.chipBorder}`, opacity: 0.85, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ fontSize: '11px', color: cfg.primary, marginBottom: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>The Question</div>
        <div style={{ fontSize: '15px', lineHeight: 1.7, color: '#1a1035' }}><MathRenderer text={currentStep.question_text} /></div>
        {currentStep.question_image_url && <img src={currentStep.question_image_url} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginTop: '10px', display: 'block' }} />}
      </div>

      {/* Review card */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '10px', border: `1px solid ${cfg.chipBorder}`, borderTop: `3px solid ${cfg.primary}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontWeight: 700, color: '#1a1035', marginBottom: '1rem' }}>Review before trying the practice question</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {currentStep.theory_card && (
            <button onClick={expandTheory} style={{ flex: 1, padding: '11px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer', border: `1.5px solid ${cfg.chipBorder}`, background: theoryExpanded ? cfg.chipBg : '#fff', color: cfg.primary, transition: 'background 0.2s' }}>
              📖 Learn Theory
            </button>
          )}
          {currentStep.video_url && (
            <button onClick={openVideo} style={{ flex: 1, padding: '11px 16px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', cursor: 'pointer', border: '1.5px solid rgba(244,63,94,0.2)', background: 'rgba(244,63,94,0.05)', color: '#f43f5e', transition: 'background 0.2s' }}>
              ▶ Learn with Video
            </button>
          )}
        </div>

        {theoryExpanded && (currentStep.theory_card || currentStep.theory_card_hinglish) && (
          <div style={{ background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`, borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '11px', color: cfg.primary, fontWeight: 700, letterSpacing: '0.05em' }}>THEORY</div>
              {currentStep.theory_card && currentStep.theory_card_hinglish && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['English','Hinglish'].map(lang => (
                    <button key={lang} onClick={() => setTheoryLang(lang)} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 600, background: theoryLang === lang ? cfg.primary : 'rgba(0,0,0,0.06)', color: theoryLang === lang ? '#fff' : '#8888aa' }}>
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: '14px', color: '#1a1035', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              <MathRenderer text={theoryLang === 'Hinglish' && currentStep.theory_card_hinglish ? currentStep.theory_card_hinglish : currentStep.theory_card} />
            </div>
          </div>
        )}

        <button onClick={startCloneQuestion} disabled={!currentStep.clone_question_text} style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: currentStep.clone_question_text ? cfg.gradient : '#e5e7eb', color: currentStep.clone_question_text ? '#fff' : '#9ca3af', cursor: currentStep.clone_question_text ? 'pointer' : 'default' }}>
          {currentStep.clone_question_text ? 'Try Practice Question →' : 'No practice question available'}
        </button>
      </div>

      <button onClick={goNextStep} style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: 600, borderRadius: '12px', background: '#fff', border: `1.5px solid ${cfg.chipBorder}`, color: '#8888aa', cursor: 'pointer' }}>
        Skip to Next Step
      </button>
    </PageWrap>
  );

  // ── Main / Clone question ──
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

      {/* Step / phase badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
        {isClonePhase ? (
          <span style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', color: '#f59e0b', fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
            PRACTICE QUESTION
          </span>
        ) : (
          <span style={{ background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`, color: cfg.primary, fontSize: '11px', fontWeight: 700, padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em' }}>
            STEP {currentStep.step_number}
          </span>
        )}
        {currentStep.concept_tag && <span style={{ fontSize: '12px', color: cfg.primary, fontWeight: 500 }}>{currentStep.concept_tag}</span>}
        {!isClonePhase && currentStep.marks && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: cfg.primary, background: cfg.chipBg, padding: '3px 10px', borderRadius: '10px', fontWeight: 600 }}>
            +{currentStep.marks} pts
          </span>
        )}
      </div>

      {/* Hint card */}
      {isClonePhase && hintVisible && currentStep.hint_text && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.05em' }}>HINT</div>
          <div style={{ fontSize: '14px', color: '#1a1035', lineHeight: 1.7 }}><MathRenderer text={currentStep.hint_text} /></div>
        </div>
      )}

      {/* Question card */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '1rem', border: `1px solid ${cfg.chipBorder}`, borderTop: `3px solid ${cfg.primary}`, boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        {isClonePhase && (
          <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '10px', background: cfg.chipBg, display: 'inline-block', padding: '2px 10px', borderRadius: '9999px' }}>
            A simplified version of the same concept
          </div>
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

      {/* Result feedback */}
      {submitted && result && (
        <div style={{ borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1rem', background: result.is_correct ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)', border: result.is_correct ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(244,63,94,0.3)' }}>
          <div style={{ fontWeight: 700, marginBottom: result.explanation ? '4px' : 0, color: result.is_correct ? '#15803d' : '#dc2626' }}>
            {result.is_correct ? `Correct! +${result.points_earned} pts` : isClonePhase && hintVisible ? 'Not quite — read the hint above and try again' : 'Incorrect'}
          </div>
          {result.is_correct && result.explanation && (
            <div style={{ fontSize: '14px', marginTop: '6px', lineHeight: 1.6, color: '#1a5c2a' }}>
              <MathRenderer text={result.explanation} />
            </div>
          )}
        </div>
      )}

      {submitted && result?.is_correct && (
        <button onClick={goNextStep} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
          {currentStepIndex + 1 >= steps.length ? 'Complete Ladder 🎉' : 'Next Step →'}
        </button>
      )}

      {submitted && !result?.is_correct && isClonePhase && hintVisible && (
        <button onClick={retryCloneWithHint} style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 700, borderRadius: '12px', border: 'none', background: cfg.gradient, color: '#fff', cursor: 'pointer', marginBottom: '10px' }}>
          Try Again with Hint →
        </button>
      )}

      {submitted && !result?.is_correct && (
        <button onClick={goNextStep} style={{ width: '100%', padding: '11px', fontSize: '13px', fontWeight: 600, borderRadius: '12px', background: '#fff', border: `1.5px solid ${cfg.chipBorder}`, color: '#8888aa', cursor: 'pointer' }}>
          Skip to Next Step
        </button>
      )}
    </PageWrap>
  );
}
