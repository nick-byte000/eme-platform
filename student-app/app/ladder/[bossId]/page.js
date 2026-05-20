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

export default function LadderPage() {
  const router = useRouter();
  const { bossId } = useParams();

  const [bossQuestion, setBossQuestion] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // UI state machine: 'main' | 'remediation' | 'clone'
  const [uiPhase, setUiPhase] = useState('main');
  const [hintVisible, setHintVisible] = useState(false);
  const [theoryExpanded, setTheoryExpanded] = useState(false);
  const [theoryLang, setTheoryLang] = useState('English');

  // Per-question answer state
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Timer tracking
  const [timerRunning, setTimerRunning] = useState(false);
  const secondsRef = useRef(0);
  const hintOpenedRef = useRef(false);
  const theoryOpenedRef = useRef(false);
  const videoWatchedRef = useRef(false);

  // Points pop animation
  const [lastPoints, setLastPoints] = useState(0);
  const [pointsTrigger, setPointsTrigger] = useState(0);

  // Completion
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
      if (prog && prog.steps_completed > 0) {
        startIndex = Math.min(prog.steps_completed, activeSteps.length - 1);
      }
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
    setSelected(null);
    setSubmitting(false);
    setSubmitted(false);
    setResult(null);
    setTimerRunning(true);
  };

  const handleTimerTick = useCallback(secs => { secondsRef.current = secs; }, []);

  const currentStep = steps[currentStepIndex];

  // Map UI phase + hint state → backend phase field
  const getBackendPhase = () => {
    if (uiPhase === 'main') return 'main';
    if (uiPhase === 'clone' && hintVisible) return 'clone_hint';
    return 'clone';
  };

  const submitAnswer = async () => {
    if (!selected || submitting || submitted) return;
    setSubmitting(true);
    setTimerRunning(false);

    const data = await apiCall('/attempts/submit', 'POST', {
      boss_question_id: parseInt(bossId),
      step_id: currentStep.id,
      selected_options: [selected],
      time_taken_seconds: secondsRef.current,
      phase: getBackendPhase(),
      hint_opened: hintOpenedRef.current,
      theory_opened: theoryOpenedRef.current,
      video_watched: videoWatchedRef.current,
    });

    setSubmitting(false);
    if (!data.success) { setError(data.error || 'Submission failed'); return; }

    setResult(data);
    setSubmitted(true);

    if (data.points_earned > 0) {
      setLastPoints(data.points_earned);
      setPointsTrigger(t => t + 1);
      const student = getStudent();
      if (student) {
        saveAuth(localStorage.getItem('studentToken'), {
          ...student,
          total_points: data.student_total_points,
        });
      }
    }

    if (data.progress?.is_completed) {
      setTimeout(() => {
        setCompleted(true);
        setTotalEarned(data.progress.total_points_earned || 0);
      }, 1800);
      return;
    }

    if (!data.is_correct) {
      if (uiPhase === 'main') {
        // Main wrong → show remediation screen
        setUiPhase('remediation');
        setTheoryExpanded(false);
      } else if (uiPhase === 'clone' && !hintVisible) {
        // First clone failure → auto-reveal hint, student stays on clone
        setHintVisible(true);
        hintOpenedRef.current = true;
      } else if (uiPhase === 'clone' && hintVisible) {
        // Clone-with-hint failure → back to remediation for another review loop
        setUiPhase('remediation');
        setHintVisible(false);
        setTheoryExpanded(false);
        setSelected(null);
        setSubmitted(false);
        setResult(null);
      }
    }
  };

  const goNextStep = () => {
    const nextIdx = currentStepIndex + 1;
    if (nextIdx >= steps.length) { setCompleted(true); return; }
    setCurrentStepIndex(nextIdx);
    setUiPhase('main');
    setHintVisible(false);
    setTheoryExpanded(false);
    resetAnswerState();
  };

  const startCloneQuestion = () => {
    setUiPhase('clone');
    setHintVisible(false);
    resetAnswerState();
  };

  const retryCloneWithHint = () => {
    secondsRef.current = 0;
    setSelected(null);
    setSubmitted(false);
    setResult(null);
    setTimerRunning(true);
  };

  const openVideo = () => {
    videoWatchedRef.current = true;
    if (currentStep?.video_url) window.open(currentStep.video_url, '_blank');
  };

  const expandTheory = () => {
    theoryOpenedRef.current = true;
    setTheoryExpanded(true);
  };

  // Derive current question fields from phase
  const isClonePhase = uiPhase === 'clone';
  const questionText = isClonePhase ? currentStep?.clone_question_text : currentStep?.question_text;
  const questionImageUrl = isClonePhase ? currentStep?.clone_question_image_url : currentStep?.question_image_url;
  const options = (isClonePhase
    ? [
        { label: 'A', text: currentStep?.clone_option_a, img: currentStep?.clone_option_a_image_url },
        { label: 'B', text: currentStep?.clone_option_b, img: currentStep?.clone_option_b_image_url },
        { label: 'C', text: currentStep?.clone_option_c, img: currentStep?.clone_option_c_image_url },
        { label: 'D', text: currentStep?.clone_option_d, img: currentStep?.clone_option_d_image_url },
      ]
    : [
        { label: 'A', text: currentStep?.option_a, img: currentStep?.option_a_image_url },
        { label: 'B', text: currentStep?.option_b, img: currentStep?.option_b_image_url },
        { label: 'C', text: currentStep?.option_c, img: currentStep?.option_c_image_url },
        { label: 'D', text: currentStep?.option_d, img: currentStep?.option_d_image_url },
      ]
  ).filter(o => o.text || o.img);

  const getOptionClass = (label) => {
    if (!submitted) return selected === label ? 'option-btn selected' : 'option-btn';
    const correct = String(result?.correct_options || '').toUpperCase().trim();
    if (correct.includes(label)) return 'option-btn correct';
    if (selected === label) return 'option-btn wrong';
    return 'option-btn';
  };

  // ── Guard renders ──────────────────────────────────────────

  if (loading) return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center', color: '#9090a8' }}>
        Loading ladder...
      </div>
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div className="container"><div className="alert alert-error">{error}</div></div>
    </>
  );

  if (completed) return (
    <>
      <Navbar />
      <div className="container">
        <div className="completion-screen">
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h2>Ladder Complete!</h2>
          <p style={{ color: '#9090a8', marginTop: '0.5rem' }}>
            You have mastered all {steps.length} steps of
          </p>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '4px' }}>{bossQuestion?.title}</p>
          <div className="big-points">{totalEarned} pts</div>
          <p style={{ color: '#9090a8', fontSize: '14px', marginBottom: '2rem' }}>
            total points earned (includes 20 bonus pts for completion)
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href={`/concepts/${bossQuestion?.concept_id}`}>
              <button className="btn-ghost" style={{ padding: '12px 24px' }}>Back to Concept</button>
            </Link>
            <Link href="/leaderboard">
              <button className="btn-primary" style={{ padding: '12px 24px' }}>View Leaderboard</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );

  if (!currentStep) return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center', color: '#9090a8' }}>
        No questions found for this ladder.
      </div>
    </>
  );

  // ── Remediation screen ─────────────────────────────────────

  if (uiPhase === 'remediation') return (
    <>
      <Navbar />
      <PointsBadge points={lastPoints} triggerKey={pointsTrigger} />
      <div className="container">
        <div style={{ marginBottom: '1.5rem' }}>
          <Link href={`/concepts/${bossQuestion?.concept_id}`} style={{ color: '#9090a8', fontSize: '12px', textDecoration: 'none' }}>
            ← {bossQuestion?.concept_name}
          </Link>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{bossQuestion?.title}</h1>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <ProgressBar current={currentStepIndex + 1} total={steps.length} />
        </div>

        {/* Wrong answer result */}
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontWeight: 700, color: '#f43f5e', marginBottom: '6px' }}>Incorrect</div>
          {result?.explanation && (
            <div style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.7 }}>
              <MathRenderer text={result.explanation} />
            </div>
          )}
        </div>

        {/* Original question for context */}
        <div style={{ fontSize: '11px', color: '#9090a8', fontWeight: 600, marginBottom: '6px', letterSpacing: '0.05em' }}>
          STEP {currentStep.step_number}{currentStep.concept_tag ? ` · ${currentStep.concept_tag}` : ''}
        </div>
        <div className="card" style={{ marginBottom: '1.5rem', opacity: 0.75 }}>
          <div style={{ fontSize: '11px', color: '#9090a8', marginBottom: '8px', fontWeight: 600 }}>THE QUESTION</div>
          <div style={{ fontSize: '15px', lineHeight: 1.7 }}><MathRenderer text={currentStep.question_text} /></div>
          {currentStep.question_image_url && <img src={currentStep.question_image_url} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginTop: '10px', display: 'block' }} />}
        </div>

        {/* Review + clone CTA */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '1rem' }}>
            Review before trying the practice question
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem', flexWrap: 'wrap' }}>
            {currentStep.theory_card && (
              <button
                onClick={expandTheory}
                style={{
                  flex: 1, padding: '11px 16px', fontSize: '14px', fontWeight: 600,
                  borderRadius: '8px', cursor: 'pointer', border: 'none',
                  background: theoryExpanded ? 'rgba(108,99,255,0.25)' : 'rgba(108,99,255,0.1)',
                  color: '#a5a0ff',
                  transition: 'background 0.2s',
                }}
              >
                📖 Learn Theory
              </button>
            )}
            {currentStep.video_url && (
              <button
                onClick={openVideo}
                style={{
                  flex: 1, padding: '11px 16px', fontSize: '14px', fontWeight: 600,
                  borderRadius: '8px', cursor: 'pointer', border: 'none',
                  background: 'rgba(244, 63, 94, 0.1)',
                  color: '#f87171',
                  transition: 'background 0.2s',
                }}
              >
                ▶ Learn with Video
              </button>
            )}
          </div>

          {theoryExpanded && (currentStep.theory_card || currentStep.theory_card_hinglish) && (
            <div style={{
              background: 'rgba(108, 99, 255, 0.08)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 700, letterSpacing: '0.05em' }}>THEORY</div>
                {currentStep.theory_card && currentStep.theory_card_hinglish && (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {['English', 'Hinglish'].map(lang => (
                      <button key={lang} onClick={() => setTheoryLang(lang)}
                        style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: 600,
                          background: theoryLang === lang ? '#6c63ff' : 'rgba(255,255,255,0.08)',
                          color: theoryLang === lang ? '#fff' : '#9090a8' }}>
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                <MathRenderer text={theoryLang === 'Hinglish' && currentStep.theory_card_hinglish ? currentStep.theory_card_hinglish : currentStep.theory_card} />
              </div>
            </div>
          )}

          <button
            className="btn-success"
            onClick={startCloneQuestion}
            disabled={!currentStep.clone_question_text}
            style={{ width: '100%', padding: '13px', fontSize: '15px' }}
          >
            {currentStep.clone_question_text ? 'Try Practice Question →' : 'No practice question available'}
          </button>
        </div>

        <button
          className="btn-ghost"
          onClick={goNextStep}
          style={{ width: '100%', padding: '10px', fontSize: '13px' }}
        >
          Skip to Next Step
        </button>
      </div>
    </>
  );

  // ── Main / Clone question screen ───────────────────────────

  return (
    <>
      <Navbar />
      <PointsBadge points={lastPoints} triggerKey={pointsTrigger} />
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <Link href={`/concepts/${bossQuestion?.concept_id}`} style={{ color: '#9090a8', fontSize: '12px', textDecoration: 'none' }}>
              ← {bossQuestion?.concept_name}
            </Link>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '2px' }}>{bossQuestion?.title}</h1>
          </div>
          <Timer running={timerRunning} onTick={handleTimerTick} />
        </div>

        {/* Progress */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <ProgressBar current={currentStepIndex + 1} total={steps.length} />
        </div>

        {/* Problem context */}
        {bossQuestion?.question_text && (
          <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '3px solid #6c63ff' }}>
            <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Problem Context
            </div>
            <div style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.7 }}><MathRenderer text={bossQuestion.question_text} /></div>
            {bossQuestion.question_image_url && <img src={bossQuestion.question_image_url} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginTop: '10px', display: 'block' }} />}
          </div>
        )}

        {/* Step / phase badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.75rem' }}>
          {isClonePhase ? (
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#f59e0b',
              fontSize: '11px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em',
            }}>
              PRACTICE QUESTION
            </span>
          ) : (
            <span style={{
              background: 'rgba(108, 99, 255, 0.15)',
              border: '1px solid rgba(108, 99, 255, 0.4)',
              color: '#a5a0ff',
              fontSize: '11px', fontWeight: 700,
              padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.05em',
            }}>
              STEP {currentStep.step_number}
            </span>
          )}
          {currentStep.concept_tag && (
            <span style={{ fontSize: '12px', color: '#6c63ff' }}>{currentStep.concept_tag}</span>
          )}
          {!isClonePhase && currentStep.marks && (
            <span style={{
              marginLeft: 'auto', fontSize: '11px', color: '#9090a8',
              background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '10px',
            }}>
              +{currentStep.marks} pts
            </span>
          )}
        </div>

        {/* Hint card — only on clone phase after first failure */}
        {isClonePhase && hintVisible && currentStep.hint_text && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px', letterSpacing: '0.05em' }}>
              HINT
            </div>
            <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.7 }}>
              <MathRenderer text={currentStep.hint_text} />
            </div>
          </div>
        )}

        {/* Question card */}
        <div className="card" style={{ marginBottom: '1rem' }}>
          {isClonePhase && (
            <div style={{ fontSize: '12px', color: '#9090a8', marginBottom: '10px' }}>
              A simplified version of the same concept
            </div>
          )}

          <div style={{ fontSize: '16px', lineHeight: 1.7, marginBottom: questionImageUrl ? '10px' : '1.25rem', fontWeight: 500 }}>
            <MathRenderer text={questionText} />
          </div>
          {questionImageUrl && (
            <img src={questionImageUrl} alt="" style={{ maxWidth: '360px', maxHeight: '220px', objectFit: 'contain', borderRadius: '8px', marginBottom: '1.25rem', display: 'block' }} />
          )}

          {options.map(opt => (
            <button
              key={opt.label}
              className={getOptionClass(opt.label)}
              disabled={submitted}
              onClick={() => !submitted && setSelected(opt.label)}
            >
              <span style={{ fontWeight: 700, marginRight: '10px', color: '#6c63ff' }}>{opt.label}.</span>
              {opt.text && <MathRenderer text={opt.text} />}
              {opt.img && <img src={opt.img} alt="" style={{ maxWidth: '240px', maxHeight: '100px', objectFit: 'contain', display: 'block', marginTop: opt.text ? '6px' : 0, borderRadius: '4px' }} />}
            </button>
          ))}

          {!submitted && (
            <button
              className="btn-primary"
              disabled={!selected || submitting}
              onClick={submitAnswer}
              style={{ width: '100%', marginTop: '1rem', padding: '12px' }}
            >
              {submitting ? 'Checking...' : 'Submit Answer'}
            </button>
          )}
        </div>

        {/* Result feedback */}
        {submitted && result && (
          <div
            className={`alert ${result.is_correct ? 'alert-success' : 'alert-error'}`}
            style={{ marginBottom: '1rem' }}
          >
            <div style={{ fontWeight: 700, marginBottom: result.explanation ? '4px' : 0 }}>
              {result.is_correct
                ? `Correct! +${result.points_earned} pts`
                : isClonePhase && hintVisible
                  ? 'Not quite — read the hint above and try again'
                  : 'Incorrect'}
            </div>
            {result.is_correct && result.explanation && (
              <div style={{ fontSize: '14px', marginTop: '6px', lineHeight: 1.6 }}>
                <MathRenderer text={result.explanation} />
              </div>
            )}
          </div>
        )}

        {/* Correct → Next Step */}
        {submitted && result?.is_correct && (
          <button
            className="btn-success"
            onClick={goNextStep}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginBottom: '10px' }}
          >
            {currentStepIndex + 1 >= steps.length ? 'Complete Ladder 🎉' : 'Next Step →'}
          </button>
        )}

        {/* Clone wrong, hint just revealed → retry with hint */}
        {submitted && !result?.is_correct && isClonePhase && hintVisible && (
          <button
            className="btn-primary"
            onClick={retryCloneWithHint}
            style={{ width: '100%', padding: '14px', fontSize: '15px', marginBottom: '10px' }}
          >
            Try Again with Hint →
          </button>
        )}

        {/* Skip option on any wrong answer */}
        {submitted && !result?.is_correct && (
          <button
            className="btn-ghost"
            onClick={goNextStep}
            style={{ width: '100%', padding: '10px', fontSize: '13px' }}
          >
            Skip to Next Step
          </button>
        )}
      </div>
    </>
  );
}
