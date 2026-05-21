'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent } from '../../src/lib/auth';

const SUBJECT_CONFIG = {
  Physics:     { gradient: 'linear-gradient(135deg, #4776e6 0%, #6c5ce7 100%)', primary: '#6c5ce7', bg: '#f4f3ff', chipBg: '#ede9ff', chipBorder: '#c4b9ff' },
  Chemistry:   { gradient: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)', primary: '#059669', bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7' },
  Mathematics: { gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)', primary: '#2563eb', bg: '#f0f4ff', chipBg: '#dbeafe', chipBorder: '#93c5fd' },
  Biology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Botany:      { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
  Zoology:     { gradient: 'linear-gradient(135deg, #14532d 0%, #16a34a 100%)',  primary: '#16a34a', bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac' },
};
const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const student = getStudent();

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (!student) return;
    if (typeof window !== 'undefined') {
      const subject = localStorage.getItem('activeSubject');
      if (subject && SUBJECT_CONFIG[subject]) setCfg(SUBJECT_CONFIG[subject]);
    }
    apiCall(`/progress/${student.id}`).then(d => {
      if (d.success) setData(d);
      setLoading(false);
    });
  }, []);

  const overall = data?.overall || {};
  const byBQ = data?.by_boss_question || [];

  const statCards = [
    { label: 'Total Points',         value: overall.total_points ?? student?.total_points ?? 0,         icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
    { label: 'Ladders Completed',    value: overall.ladders_completed ?? 0,                              icon: '🏆', color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.25)' },
    { label: 'Questions Attempted',  value: overall.total_attempts ?? 0,                                 icon: '✏️', color: cfg.primary, bg: cfg.chipBg,             border: cfg.chipBorder },
    { label: 'Accuracy',             value: overall.accuracy_pct ? `${overall.accuracy_pct}%` : '—',    icon: '🎯', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      <Navbar />

      {/* Hero strip */}
      <div style={{ background: cfg.gradient, padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Your Progress</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Track your learning journey and achievements</p>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#8888aa', padding: '4rem' }}>Loading progress...</div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
              {statCards.map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', border: `1px solid ${s.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{s.icon}</div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '12px', color: '#8888aa', marginTop: '6px', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Ladder history */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <div style={{ width: '4px', height: '20px', borderRadius: '2px', background: cfg.gradient }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: cfg.primary }}>Ladder History</h2>
              <span style={{ fontSize: '11px', background: cfg.chipBg, color: cfg.primary, padding: '2px 10px', borderRadius: '9999px', fontWeight: 600 }}>
                {byBQ.length}
              </span>
            </div>

            {byBQ.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: `1px solid ${cfg.chipBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📚</div>
                <div style={{ color: '#1a1035', fontWeight: 600, marginBottom: '6px' }}>No attempts yet</div>
                <div style={{ color: '#8888aa', fontSize: '13px' }}>Start a ladder to see your progress here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {byBQ.map(bq => {
                  const pct = Math.round((bq.steps_completed / (bq.total_steps || 8)) * 100);
                  return (
                    <div key={bq.boss_question_id} style={{ background: '#fff', borderRadius: '14px', padding: '16px 18px', border: `1px solid ${cfg.chipBorder}`, borderLeft: `4px solid ${bq.is_completed ? '#22c55e' : cfg.primary}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${cfg.primary}16`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'none'; }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1035' }}>{bq.title || `Ladder #${bq.boss_question_id}`}</div>
                        {bq.is_completed && (
                          <span style={{ fontSize: '11px', color: '#16a34a', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', padding: '2px 10px', borderRadius: '9999px', fontWeight: 700, flexShrink: 0, marginLeft: '8px' }}>
                            ✓ Completed
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8888aa', marginBottom: '10px' }}>
                        {bq.steps_completed} / {bq.total_steps} steps · <span style={{ color: cfg.primary, fontWeight: 600 }}>{bq.total_points_earned ?? 0} pts</span>
                      </div>
                      <div style={{ background: cfg.chipBg, borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: '999px', background: bq.is_completed ? 'linear-gradient(90deg,#22c55e,#16a34a)' : cfg.gradient, width: `${pct}%`, transition: 'width 0.5s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <span style={{ fontSize: '11px', color: bq.is_completed ? '#16a34a' : cfg.primary, fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
