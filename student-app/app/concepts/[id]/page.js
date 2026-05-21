'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import { apiCall } from '../../../src/lib/api';
import { isLoggedIn } from '../../../src/lib/auth';

const SUBJECT_CONFIG = {
  Physics:     { gradient: 'linear-gradient(135deg, #4776e6 0%, #6c5ce7 100%)', primary: '#6c5ce7', bg: '#f4f3ff', chipBg: '#ede9ff', chipBorder: '#c4b9ff' },
  Chemistry:   { gradient: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)', primary: '#059669', bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7' },
  Mathematics: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', primary: '#2563eb', bg: '#f0f4ff', chipBg: '#dbeafe', chipBorder: '#93c5fd' },
  Biology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Botany:      { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Zoology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
};
const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

const LEVELS = [
  { value: 'beginner',     label: 'Beginner',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   desc: 'Build your foundation' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  desc: 'Strengthen your skills' },
  { value: 'advanced',     label: 'Advanced',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   desc: 'Master the concept' },
];

const JEE_QTYPES = [
  { value: 'all',                 label: 'All Types' },
  { value: 'single_correct',      label: 'Single Correct' },
  { value: 'multi_correct',       label: 'Multi-Correct' },
  { value: 'numerical',           label: 'Numerical' },
  { value: 'assertion_reasoning', label: 'Assertion-Reasoning' },
  { value: 'matching',            label: 'Matching' },
];

export default function ConceptDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [activeLevel, setActiveLevel] = useState('beginner');
  const [activeQType, setActiveQType] = useState('all');

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    Promise.all([
      apiCall(`/concepts/${id}`),
      apiCall('/enrollment/my-course'),
    ]).then(([conceptRes, enrollRes]) => {
      if (conceptRes.success) setData(conceptRes);
      if (enrollRes.success) setEnrollment(enrollRes.enrollment);
      setLoading(false);
    });
  }, [id]);

  const cfg = (data?.concept?.subject && SUBJECT_CONFIG[data.concept.subject])
    ? SUBJECT_CONFIG[data.concept.subject] : DEFAULT_CFG;

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f4f3ff' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Navbar />
      </div>
      <div style={{ paddingTop: '80px', textAlign: 'center', color: '#8888aa', padding: '5rem 2rem' }}>Loading...</div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: '100vh', background: '#f4f3ff' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <Navbar />
      </div>
      <div style={{ paddingTop: '80px', maxWidth: '800px', margin: '0 auto', padding: '5rem 1.5rem' }}>
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '12px', padding: '1rem', color: '#dc2626' }}>Concept not found.</div>
      </div>
    </div>
  );

  const { concept, boss_questions = [], practice_questions = [], practice_result = null } = data;
  const isJEE = enrollment?.exam_type === 'JEE';
  const anyCompleted = boss_questions.some(bq => bq.student_progress?.is_completed);
  const hasPractice = practice_questions.length > 0;

  const countByLevel = {};
  LEVELS.forEach(lv => {
    countByLevel[lv.value] = boss_questions.filter(bq => (bq.level || 'beginner') === lv.value).length;
  });

  const filtered = boss_questions.filter(bq => {
    const matchLevel = (bq.level || 'beginner') === activeLevel;
    const matchType = !isJEE || activeQType === 'all' || bq.question_type_category === activeQType;
    return matchLevel && matchType;
  });

  const activeLevelCfg = LEVELS.find(l => l.value === activeLevel);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .concept-card { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      {/* Themed sticky navbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${cfg.chipBorder}`, transition: 'all 0.3s' }}>
        <Navbar />
      </div>

      <div style={{ minHeight: '100vh', background: cfg.bg, paddingTop: '64px' }}>

        {/* Hero strip */}
        <div style={{ background: cfg.gradient, padding: '1.5rem 1.5rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
          {/* subtle bg pattern */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />
          <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
            <Link href="/concepts" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '0.75rem' }}>
              ← Back to {concept.subject}
            </Link>
            <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '9999px', padding: '2px 10px', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {concept.subject}
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>{concept.concept_name}</h1>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '13px' }}>{concept.chapter_name} → {concept.topic_name}</div>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>

          {/* Level selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
            {LEVELS.map(lv => {
              const isActive = activeLevel === lv.value;
              const count = countByLevel[lv.value];
              return (
                <button key={lv.value} onClick={() => { setActiveLevel(lv.value); setActiveQType('all'); }} style={{
                  padding: '14px 10px', borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                  border: isActive ? `2px solid ${lv.color}` : `1px solid ${cfg.chipBorder}`,
                  background: isActive ? lv.bg : '#fff',
                  boxShadow: isActive ? `0 0 18px ${lv.color}28` : '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: isActive ? lv.color : '#5a5a7a', marginBottom: '2px' }}>{lv.label}</div>
                  <div style={{ fontSize: '11px', color: isActive ? lv.color : '#9090a8', opacity: 0.85 }}>{lv.desc}</div>
                  <div style={{ marginTop: '8px', display: 'inline-block', background: isActive ? lv.color : cfg.chipBg, color: isActive ? '#fff' : cfg.primary, borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>
                    {count} set{count !== 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>

          {/* JEE type filter */}
          {isJEE && countByLevel[activeLevel] > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {JEE_QTYPES.map(qt => (
                <button key={qt.value} onClick={() => setActiveQType(qt.value)} style={{
                  padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                  background: activeQType === qt.value ? cfg.chipBg : '#fff',
                  color: activeQType === qt.value ? cfg.primary : '#8888aa',
                  border: activeQType === qt.value ? `1.5px solid ${cfg.primary}` : `1px solid ${cfg.chipBorder}`,
                }}>
                  {qt.label}
                </button>
              ))}
            </div>
          )}

          {/* Question sets */}
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '16px', border: `1px solid ${cfg.chipBorder}`, padding: '2.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
                {activeLevel === 'beginner' ? '🌱' : activeLevel === 'intermediate' ? '⚡' : '🔥'}
              </div>
              <div style={{ color: '#1a1035', fontWeight: 600, marginBottom: '6px' }}>No {activeLevelCfg?.label} questions yet</div>
              <div style={{ color: '#8888aa', fontSize: '13px' }}>
                {countByLevel['beginner'] + countByLevel['intermediate'] + countByLevel['advanced'] === 0
                  ? 'Questions for this concept are coming soon.'
                  : `Try another level — ${LEVELS.filter(l => countByLevel[l.value] > 0).map(l => l.label).join(', ')} available.`}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map((bq, idx) => {
                const prog = bq.student_progress;
                const isCompleted = prog?.is_completed;
                const pct = prog ? Math.round((prog.steps_completed / (prog.total_steps || bq.total_steps || 8)) * 100) : 0;
                const levelCfg = LEVELS.find(l => l.value === (bq.level || 'beginner'));
                const qTypeLabel = JEE_QTYPES.find(q => q.value === bq.question_type_category)?.label;
                return (
                  <div key={bq.id} className="concept-card" style={{ animationDelay: `${idx * 0.05}s`, background: '#fff', borderRadius: '16px', padding: '18px', border: `1px solid ${cfg.chipBorder}`, borderTop: `3px solid ${levelCfg?.color}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}18`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', color: levelCfg?.color, background: levelCfg?.bg, textTransform: 'capitalize' }}>{bq.level || 'Beginner'}</span>
                          {isJEE && qTypeLabel && qTypeLabel !== 'Single Correct' && (
                            <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', color: cfg.primary, background: cfg.chipBg }}>{qTypeLabel}</span>
                          )}
                          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: bq.difficulty === 'hard' ? 'rgba(244,63,94,0.1)' : bq.difficulty === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: bq.difficulty === 'hard' ? '#f43f5e' : bq.difficulty === 'medium' ? '#f59e0b' : '#22c55e' }}>{bq.difficulty}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1035', marginBottom: '4px' }}>{bq.title}</div>
                        {bq.question_text && <div style={{ fontSize: '13px', color: '#8888aa', lineHeight: 1.5 }}>{bq.question_text.substring(0, 100)}{bq.question_text.length > 100 ? '...' : ''}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: '11px', color: '#9090a8' }}>{bq.total_steps} steps</div>
                        {isCompleted && <div style={{ marginTop: '4px', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✓ Done</div>}
                      </div>
                    </div>

                    {prog && prog.steps_completed > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9090a8', marginBottom: '4px' }}>
                          <span>{isCompleted ? 'Completed' : `Step ${prog.steps_completed}/${prog.total_steps || bq.total_steps}`}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ background: cfg.chipBg, borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '999px', background: cfg.gradient, width: `${pct}%`, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    )}

                    <Link href={`/ladder/${bq.id}`}>
                      <button style={{
                        width: '100%', padding: '10px', fontWeight: 700, fontSize: '14px',
                        background: isCompleted ? cfg.chipBg : cfg.gradient,
                        border: isCompleted ? `1px solid ${cfg.chipBorder}` : 'none',
                        borderRadius: '10px', color: isCompleted ? cfg.primary : '#fff',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        {isCompleted ? '↺ Review' : prog?.steps_completed > 0 ? '▶ Continue' : '▶ Start'}
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Practice Questionnaire */}
          {hasPractice && (
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ width: '4px', height: '22px', borderRadius: '2px', background: 'linear-gradient(180deg,#f59e0b,#f97316)' }} />
                <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1a1035', margin: 0 }}>Practice Questionnaire</h2>
                <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 9px', borderRadius: '9999px', fontWeight: 600 }}>
                  {practice_questions.length} Q
                </span>
              </div>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: anyCompleted ? '1px solid rgba(245,158,11,0.4)' : `1px solid ${cfg.chipBorder}`, borderTop: '3px solid #f59e0b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                {anyCompleted && <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.12) 0%,transparent 70%)', pointerEvents: 'none' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{practice_result ? '🏆' : anyCompleted ? '📝' : '🔒'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1035', marginBottom: '4px' }}>
                      {practice_result ? 'Completed!' : anyCompleted ? 'Ready to Practice' : 'Locked'}
                    </div>
                    {practice_result ? (
                      <div style={{ fontSize: '13px', color: '#8888aa' }}>
                        Your score: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{practice_result.score}/{practice_result.total}</span>
                        <span style={{ marginLeft: '8px', fontSize: '12px' }}>({Math.round((practice_result.score / practice_result.total) * 100)}%)</span>
                      </div>
                    ) : anyCompleted ? (
                      <div style={{ fontSize: '13px', color: '#8888aa' }}>{practice_questions.length} questions · Hint on wrong answer</div>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#8888aa' }}>Complete at least one question set to unlock</div>
                    )}
                  </div>
                  {anyCompleted && (
                    <Link href={`/practice/${concept.id}`}>
                      <button style={{ padding: '10px 22px', fontWeight: 700, fontSize: '14px', background: practice_result ? 'rgba(245,158,11,0.1)' : 'linear-gradient(135deg,#f59e0b,#f97316)', border: practice_result ? '1px solid rgba(245,158,11,0.4)' : 'none', borderRadius: '10px', color: practice_result ? '#f59e0b' : '#fff', cursor: 'pointer', flexShrink: 0 }}>
                        {practice_result ? '↺ Retry' : '▶ Start Quiz'}
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
