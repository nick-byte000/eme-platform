'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../src/components/Navbar';
import { apiCall } from '../../../src/lib/api';
import { isLoggedIn } from '../../../src/lib/auth';

const LEVELS = [
  { value: 'beginner',     label: 'Beginner',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  desc: 'Build your foundation' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', desc: 'Strengthen your skills' },
  { value: 'advanced',     label: 'Advanced',     color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  desc: 'Master the concept' },
];

const JEE_QTYPES = [
  { value: 'all',                  label: 'All Types' },
  { value: 'single_correct',       label: 'Single Correct' },
  { value: 'multi_correct',        label: 'Multi-Correct' },
  { value: 'numerical',            label: 'Numerical' },
  { value: 'assertion_reasoning',  label: 'Assertion-Reasoning' },
  { value: 'matching',             label: 'Matching' },
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

  if (loading) return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center', color: '#9090a8' }}>Loading...</div>
    </>
  );

  if (!data) return (
    <>
      <Navbar />
      <div className="container"><div className="alert alert-error">Concept not found.</div></div>
    </>
  );

  const { concept, boss_questions = [], practice_questions = [], practice_result = null } = data;
  const isJEE = enrollment?.exam_type === 'JEE';
  const anyCompleted = boss_questions.some(bq => bq.student_progress?.is_completed);
  const hasPractice = practice_questions.length > 0;

  // Count per level
  const countByLevel = {};
  LEVELS.forEach(lv => {
    countByLevel[lv.value] = boss_questions.filter(bq => (bq.level || 'beginner') === lv.value).length;
  });

  // Filter by active level + question type
  const filtered = boss_questions.filter(bq => {
    const matchLevel = (bq.level || 'beginner') === activeLevel;
    const matchType = !isJEE || activeQType === 'all' || bq.question_type_category === activeQType;
    return matchLevel && matchType;
  });

  // Find the active level config
  const activeLevelCfg = LEVELS.find(l => l.value === activeLevel);

  return (
    <>
      <Navbar />
      <div className="container">
        <Link href="/concepts" style={{ color: '#9090a8', fontSize: '13px', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
          ← Back
        </Link>

        {/* Concept header */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {concept.subject}
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>{concept.concept_name}</h1>
          <div style={{ color: '#9090a8', fontSize: '13px' }}>{concept.chapter_name} → {concept.topic_name}</div>
        </div>

        {/* Level selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
          {LEVELS.map(lv => {
            const isActive = activeLevel === lv.value;
            const count = countByLevel[lv.value];
            return (
              <button
                key={lv.value}
                onClick={() => { setActiveLevel(lv.value); setActiveQType('all'); }}
                style={{
                  padding: '14px 10px',
                  borderRadius: '12px',
                  border: isActive ? `2px solid ${lv.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? lv.bg : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  boxShadow: isActive ? `0 0 18px ${lv.color}28` : 'none',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 800, color: isActive ? lv.color : '#9090a8', marginBottom: '2px' }}>
                  {lv.label}
                </div>
                <div style={{ fontSize: '11px', color: isActive ? lv.color : '#6b6b80', opacity: 0.8 }}>
                  {lv.desc}
                </div>
                <div style={{
                  marginTop: '8px', display: 'inline-block',
                  background: isActive ? lv.color : 'rgba(255,255,255,0.1)',
                  color: isActive ? '#000' : '#9090a8',
                  borderRadius: '9999px', padding: '2px 10px', fontSize: '11px', fontWeight: 700,
                }}>
                  {count} set{count !== 1 ? 's' : ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* JEE Question type filter */}
        {isJEE && countByLevel[activeLevel] > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {JEE_QTYPES.map(qt => (
              <button
                key={qt.value}
                onClick={() => setActiveQType(qt.value)}
                style={{
                  padding: '5px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  background: activeQType === qt.value ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.05)',
                  color: activeQType === qt.value ? '#a5a0ff' : '#9090a8',
                  border: activeQType === qt.value ? '1.5px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {qt.label}
              </button>
            ))}
          </div>
        )}

        {/* Question sets */}
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>
              {activeLevel === 'beginner' ? '🌱' : activeLevel === 'intermediate' ? '⚡' : '🔥'}
            </div>
            <div style={{ color: '#e0e0e0', fontWeight: 600, marginBottom: '6px' }}>
              No {activeLevelCfg?.label} questions yet
            </div>
            <div style={{ color: '#9090a8', fontSize: '13px' }}>
              {countByLevel['beginner'] + countByLevel['intermediate'] + countByLevel['advanced'] === 0
                ? 'Questions for this concept are coming soon.'
                : `Try another level — ${LEVELS.filter(l => countByLevel[l.value] > 0).map(l => l.label).join(', ')} available.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(bq => {
              const prog = bq.student_progress;
              const isCompleted = prog?.is_completed;
              const pct = prog ? Math.round((prog.steps_completed / (prog.total_steps || bq.total_steps || 8)) * 100) : 0;
              const levelCfg = LEVELS.find(l => l.value === (bq.level || 'beginner'));
              const qTypeLabel = JEE_QTYPES.find(q => q.value === bq.question_type_category)?.label;

              return (
                <div key={bq.id} className="card" style={{ border: `1px solid ${levelCfg?.color}22` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ flex: 1, paddingRight: '12px' }}>
                      {/* Badges */}
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                          color: levelCfg?.color, background: levelCfg?.bg, textTransform: 'capitalize',
                        }}>
                          {bq.level || 'Beginner'}
                        </span>
                        {isJEE && qTypeLabel && qTypeLabel !== 'Single Correct' && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', color: '#a5a0ff', background: 'rgba(108,99,255,0.12)' }}>
                            {qTypeLabel}
                          </span>
                        )}
                        <span style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '9999px',
                          background: bq.difficulty === 'hard' ? 'rgba(244,63,94,0.12)' : bq.difficulty === 'medium' ? 'rgba(245,158,11,0.12)' : 'rgba(34,197,94,0.12)',
                          color: bq.difficulty === 'hard' ? '#f43f5e' : bq.difficulty === 'medium' ? '#f59e0b' : '#22c55e',
                        }}>
                          {bq.difficulty}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>{bq.title}</div>
                      {bq.question_text && (
                        <div style={{ fontSize: '13px', color: '#9090a8', lineHeight: 1.5 }}>
                          {bq.question_text.substring(0, 100)}{bq.question_text.length > 100 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '11px', color: '#9090a8' }}>{bq.total_steps} steps</div>
                      {isCompleted && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>✓ Done</div>
                      )}
                    </div>
                  </div>

                  {prog && prog.steps_completed > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9090a8', marginBottom: '4px' }}>
                        <span>{isCompleted ? 'Completed' : `Step ${prog.steps_completed}/${prog.total_steps || bq.total_steps}`}</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '999px', background: `linear-gradient(90deg, ${levelCfg?.color}, ${levelCfg?.color}99)`, width: `${pct}%`, transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )}

                  <Link href={`/ladder/${bq.id}`}>
                    <button
                      className={isCompleted ? 'btn-ghost' : 'btn-primary'}
                      style={{
                        width: '100%', padding: '10px', fontWeight: 700,
                        ...(isCompleted ? {} : { background: `linear-gradient(135deg, ${levelCfg?.color}cc, ${levelCfg?.color})`, border: 'none' }),
                      }}
                    >
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
          <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ width: '4px', height: '22px', borderRadius: '2px', background: 'linear-gradient(180deg,#f59e0b,#f97316)' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0e0', margin: 0 }}>Practice Questionnaire</h2>
              <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 9px', borderRadius: '9999px', fontWeight: 600 }}>
                {practice_questions.length} Q
              </span>
            </div>

            <div className="card" style={{
              border: anyCompleted ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.08)',
              background: anyCompleted ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Decorative glow */}
              {anyCompleted && (
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(245,158,11,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>
                  {practice_result ? '🏆' : anyCompleted ? '📝' : '🔒'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#f0f0ff', marginBottom: '4px' }}>
                    {practice_result ? 'Completed!' : anyCompleted ? 'Ready to Practice' : 'Locked'}
                  </div>
                  {practice_result ? (
                    <div style={{ fontSize: '13px', color: '#9090a8' }}>
                      Your score: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{practice_result.score}/{practice_result.total}</span>
                      <span style={{ marginLeft: '8px', fontSize: '12px' }}>({Math.round((practice_result.score / practice_result.total) * 100)}%)</span>
                    </div>
                  ) : anyCompleted ? (
                    <div style={{ fontSize: '13px', color: '#9090a8' }}>{practice_questions.length} questions · Hint on wrong answer</div>
                  ) : (
                    <div style={{ fontSize: '13px', color: '#9090a8' }}>Complete at least one question set to unlock</div>
                  )}
                </div>
                {anyCompleted && (
                  <Link href={`/practice/${concept.id}`}>
                    <button
                      style={{
                        padding: '10px 22px', fontWeight: 700, fontSize: '14px',
                        background: practice_result ? 'rgba(245,158,11,0.15)' : 'linear-gradient(135deg,#f59e0b,#f97316)',
                        border: practice_result ? '1px solid rgba(245,158,11,0.4)' : 'none',
                        borderRadius: '10px', color: practice_result ? '#f59e0b' : '#fff',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      {practice_result ? '↺ Retry' : '▶ Start Quiz'}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
