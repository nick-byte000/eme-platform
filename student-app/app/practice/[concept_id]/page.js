'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import { isLoggedIn } from '../../../src/lib/auth';
import MathRenderer from '../../../src/components/MathRenderer';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api');

const OPTIONS = ['a', 'b', 'c', 'd'];
const OPT_COLORS = { a: '#818cf8', b: '#34d399', c: '#f59e0b', d: '#f87171' };

export default function PracticePage() {
  const router = useRouter();
  const { concept_id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qIdx, setQIdx] = useState(0);       // current question index
  const [selected, setSelected] = useState(null);  // option the student picked
  const [answered, setAnswered] = useState(false);  // has submitted this question
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('studentToken');
      const res = await fetch(`${API_URL}/practice/${concept_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        router.back();
      }
    } catch {
      router.back();
    }
    setLoading(false);
  };

  const submitAnswer = () => {
    if (!selected || answered) return;
    const q = questions[qIdx];
    const correct = selected === q.correct_option;
    const newScore = correct ? score + 1 : score;
    setAnswered(true);
    setIsCorrect(correct);
    setShowHint(!correct && !!q.hint_text);
    if (correct) {
      setScore(newScore);
      setAdvancing(true);
      setTimeout(() => {
        doAdvance(newScore);
        setAdvancing(false);
      }, 1400);
    }
  };

  const advanceNext = (scoreSnapshot) => {
    doAdvance(scoreSnapshot ?? score);
  };

  const doAdvance = async (currentScore) => {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) {
      setDone(true);
      try {
        const token = localStorage.getItem('studentToken');
        await fetch(`${API_URL}/practice/${concept_id}/result`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ score: currentScore, total: questions.length }),
        });
      } catch {}
    } else {
      setQIdx(nextIdx);
      setSelected(null);
      setAnswered(false);
      setIsCorrect(false);
      setShowHint(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '4rem', color: '#9090a8' }}>Loading...</div>
    </>
  );

  const q = questions[qIdx];
  const progress = ((qIdx) / questions.length) * 100;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : pct >= 40 ? '💪' : '📚';
    return (
      <>
        <style>{`
          @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `}</style>
        <Navbar />
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0820,#14103a)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ width: '100%', maxWidth: '480px', textAlign: 'center', animation: 'fadeUp 0.5s ease' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'popIn 0.5s 0.1s both' }}>{emoji}</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#f0f0ff', marginBottom: '8px' }}>Quiz Complete!</h1>
            <div style={{ fontSize: '4rem', fontWeight: 900, color: pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#818cf8', marginBottom: '6px', animation: 'popIn 0.5s 0.2s both' }}>
              {score}/{questions.length}
            </div>
            <div style={{ fontSize: '1.1rem', color: '#9090a8', marginBottom: '2.5rem' }}>{pct}% correct</div>

            {/* Per-question review */}
            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              {questions.map((qq, i) => (
                <div key={qq.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 14px', borderRadius: '10px', marginBottom: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0, marginTop: '1px' }}>
                    {/* We can't track per-question correctness in done state without more state, so show number */}
                    {i + 1}.
                  </span>
                  <div style={{ fontSize: '13px', color: '#e0e0e0', lineHeight: 1.4, flex: 1 }}><MathRenderer text={qq.question_text} /></div>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, flexShrink: 0 }}>
                    ✓ {qq.correct_option.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { setQIdx(0); setScore(0); setSelected(null); setAnswered(false); setIsCorrect(false); setShowHint(false); setAdvancing(false); setDone(false); }}
                style={{ padding: '13px 28px', fontWeight: 700, fontSize: '15px', background: 'linear-gradient(135deg,#f59e0b,#f97316)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer' }}
              >
                ↺ Try Again
              </button>
              <Link href={`/concepts/${concept_id}`}>
                <button style={{ padding: '13px 28px', fontWeight: 700, fontSize: '15px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#e0e0e0', cursor: 'pointer' }}>
                  ← Back
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes correctFlash {
          0%   { background: rgba(34,197,94,0.35); }
          100% { background: rgba(34,197,94,0.1); }
        }
        @keyframes wrongShake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        @keyframes slideInQ {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .opt-btn { transition: all 0.18s; }
        .opt-btn:hover:not(:disabled) { transform: translateX(4px); }
      `}</style>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#08061a,#12103a)', padding: '0 0 4rem' }}>

        {/* Top progress bar */}
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#818cf8,#f59e0b)', width: `${progress}%`, transition: 'width 0.5s ease' }} />
        </div>

        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <Link href={`/concepts/${concept_id}`} style={{ color: '#9090a8', fontSize: '13px', textDecoration: 'none' }}>← Back</Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: '#9090a8' }}>Question</span>
              <span style={{ fontWeight: 800, fontSize: '16px', color: '#818cf8' }}>{qIdx + 1}</span>
              <span style={{ fontSize: '13px', color: '#9090a8' }}>/ {questions.length}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 700 }}>
              Score: {score}
            </div>
          </div>

          {/* Question card */}
          <div
            key={qIdx}
            style={{
              animation: 'slideInQ 0.35s ease',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${answered ? (isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.35)') : 'rgba(129,140,248,0.2)'}`,
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '1.5rem',
              backdropFilter: 'blur(10px)',
              transition: 'border 0.3s',
              animation: answered && !isCorrect ? 'wrongShake 0.4s ease' : 'slideInQ 0.35s ease',
            }}
          >
            <div style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
              Practice Questionnaire
            </div>
            <p style={{ fontSize: '17px', fontWeight: 600, color: '#f0f0ff', lineHeight: 1.55, marginBottom: 0 }}>
              <MathRenderer text={q.question_text} />
            </p>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
            {OPTIONS.filter(o => q[`option_${o}`]).map(o => {
              const isSelected = selected === o;
              const isRight = o === q.correct_option;
              let bg = 'rgba(255,255,255,0.04)';
              let border = '1px solid rgba(255,255,255,0.1)';
              let color = '#d0d0e8';
              if (answered) {
                if (isRight) { bg = 'rgba(34,197,94,0.15)'; border = '1.5px solid rgba(34,197,94,0.5)'; color = '#86efac'; }
                else if (isSelected) { bg = 'rgba(239,68,68,0.12)'; border = '1.5px solid rgba(239,68,68,0.4)'; color = '#fca5a5'; }
              } else if (isSelected) {
                bg = `${OPT_COLORS[o]}20`;
                border = `1.5px solid ${OPT_COLORS[o]}70`;
                color = OPT_COLORS[o];
              }

              return (
                <button
                  key={o}
                  className="opt-btn"
                  disabled={answered}
                  onClick={() => setSelected(o)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px', borderRadius: '14px',
                    background: bg, border, color, cursor: answered ? 'default' : 'pointer',
                    textAlign: 'left', fontSize: '15px', fontWeight: isSelected || (answered && isRight) ? 700 : 400,
                    boxShadow: isSelected && !answered ? `0 4px 20px ${OPT_COLORS[o]}25` : 'none',
                  }}
                >
                  <span style={{
                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', fontWeight: 800,
                    background: answered && isRight ? 'rgba(34,197,94,0.25)' : answered && isSelected ? 'rgba(239,68,68,0.2)' : isSelected ? `${OPT_COLORS[o]}30` : 'rgba(255,255,255,0.08)',
                    color: answered && isRight ? '#22c55e' : answered && isSelected ? '#f87171' : isSelected ? OPT_COLORS[o] : '#7070a0',
                    border: isSelected ? `1.5px solid currentColor` : '1px solid rgba(255,255,255,0.12)',
                  }}>
                    {answered && isRight ? '✓' : answered && isSelected && !isRight ? '✕' : o.toUpperCase()}
                  </span>
                  <MathRenderer text={q[`option_${o}`]} />
                </button>
              );
            })}
          </div>

          {/* Hint (wrong answer only) */}
          {showHint && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: '14px', padding: '14px 18px', marginBottom: '1.5rem',
              animation: 'slideInQ 0.3s ease',
            }}>
              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                💡 Hint
              </div>
              <p style={{ color: '#fde68a', fontSize: '14px', lineHeight: 1.5, margin: 0 }}><MathRenderer text={q.hint_text} /></p>
            </div>
          )}

          {/* Correct feedback */}
          {answered && isCorrect && (
            <div style={{
              background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: '14px', padding: '14px 18px', marginBottom: '1.5rem',
              animation: 'slideInQ 0.3s ease', textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🎉</div>
              <div style={{ color: '#86efac', fontWeight: 700, fontSize: '15px' }}>Correct!</div>
              {advancing && <div style={{ color: '#9090a8', fontSize: '12px', marginTop: '4px' }}>Moving to next...</div>}
            </div>
          )}

          {/* Action button */}
          {!advancing && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {!answered ? (
                <button
                  onClick={submitAnswer}
                  disabled={!selected}
                  style={{
                    flex: 1, padding: '14px', fontWeight: 700, fontSize: '16px',
                    background: selected ? 'linear-gradient(135deg,#818cf8,#6c63ff)' : 'rgba(255,255,255,0.06)',
                    border: 'none', borderRadius: '14px',
                    color: selected ? '#fff' : '#7070a0',
                    cursor: selected ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: selected ? '0 4px 20px rgba(108,99,255,0.35)' : 'none',
                  }}
                >
                  Submit Answer
                </button>
              ) : !isCorrect ? (
                <>
                  <button
                    onClick={() => { setSelected(null); setAnswered(false); setIsCorrect(false); setShowHint(false); }}
                    style={{
                      flex: 1, padding: '14px', fontWeight: 700, fontSize: '15px',
                      background: 'linear-gradient(135deg,#818cf8,#6c63ff)',
                      border: 'none', borderRadius: '14px', color: '#fff', cursor: 'pointer',
                    }}
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => doAdvance(score)}
                    style={{
                      padding: '14px 22px', fontWeight: 600, fontSize: '14px',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px', color: '#9090a8', cursor: 'pointer',
                    }}
                  >
                    Skip →
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
