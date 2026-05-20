'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent } from '../../src/lib/auth';

export default function ProgressPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const student = getStudent();

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (!student) return;
    apiCall(`/progress/${student.id}`).then(d => {
      if (d.success) setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center', color: '#9090a8' }}>Loading progress...</div>
    </>
  );

  const overall = data?.overall || {};
  const byBQ = data?.by_boss_question || [];

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Your Progress</h1>

        {/* Overall stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
          {[
            { label: 'Total Points', value: overall.total_points ?? student?.total_points ?? 0, color: '#facc15' },
            { label: 'Ladders Done', value: overall.ladders_completed ?? 0, color: '#22c55e' },
            { label: 'Questions Attempted', value: overall.total_attempts ?? 0, color: '#6c63ff' },
            { label: 'Accuracy', value: overall.accuracy_pct ? `${overall.accuracy_pct}%` : '—', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#9090a8', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Per boss question */}
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Ladder History</h2>
        {byBQ.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#9090a8', padding: '2rem' }}>
            No attempts yet. Start a ladder to see your progress here.
          </div>
        )}
        {byBQ.map(bq => {
          const pct = Math.round((bq.steps_completed / (bq.total_steps || 8)) * 100);
          return (
            <div key={bq.boss_question_id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontWeight: 600 }}>{bq.title || `Boss Question #${bq.boss_question_id}`}</div>
                {bq.is_completed && (
                  <span style={{ fontSize: '12px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    Completed
                  </span>
                )}
              </div>
              <div style={{ fontSize: '13px', color: '#9090a8', marginBottom: '10px' }}>
                {bq.steps_completed} / {bq.total_steps} steps · {bq.total_points_earned ?? 0} pts earned
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
