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

const MEDALS = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];
const MEDAL_BG = ['rgba(245,158,11,0.08)', 'rgba(156,163,175,0.08)', 'rgba(180,83,9,0.08)'];

export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const student = getStudent();

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    if (typeof window !== 'undefined') {
      const subject = localStorage.getItem('activeSubject');
      if (subject && SUBJECT_CONFIG[subject]) setCfg(SUBJECT_CONFIG[subject]);
    }
    apiCall('/leaderboard').then(d => {
      if (d.success) setData(d);
      setLoading(false);
    });
  }, []);

  const board = data?.leaderboard || [];
  const myRank = data?.student_rank;

  return (
    <div style={{ minHeight: '100vh', background: cfg.bg }}>
      <Navbar />

      {/* Hero strip */}
      <div style={{ background: cfg.gradient, padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '36px 36px', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>Leaderboard</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Top students ranked by total points</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1.5rem 5rem' }}>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#8888aa', padding: '4rem' }}>Loading leaderboard...</div>
        ) : (
          <>
            {/* Your rank banner */}
            {myRank && (
              <div style={{ background: cfg.chipBg, border: `1.5px solid ${cfg.chipBorder}`, borderRadius: '14px', padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '1.5rem' }}>🎖️</div>
                <div>
                  <div style={{ fontWeight: 700, color: cfg.primary, fontSize: '15px' }}>Your Rank: #{myRank}</div>
                  <div style={{ fontSize: '12px', color: '#8888aa' }}>Keep practicing to climb higher!</div>
                </div>
              </div>
            )}

            {/* Top 3 podium */}
            {board.length >= 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                {[board[1], board[0], board[2]].map((entry, podiumIdx) => {
                  if (!entry) return <div key={podiumIdx} />;
                  const rank = podiumIdx === 1 ? 0 : podiumIdx === 0 ? 1 : 2;
                  const isMe = entry.id === student?.id;
                  const heights = ['80%', '100%', '75%'];
                  return (
                    <div key={entry.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: podiumIdx === 1 ? '0' : '20px' }}>
                      <div style={{ fontSize: '1.8rem' }}>{MEDALS[rank]}</div>
                      <div style={{ background: isMe ? cfg.chipBg : '#fff', border: isMe ? `2px solid ${cfg.primary}` : `1px solid ${MEDAL_COLORS[rank]}30`, borderRadius: '12px', padding: '10px 8px', textAlign: 'center', width: '100%', boxShadow: rank === 0 ? `0 4px 16px ${MEDAL_COLORS[rank]}30` : '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1a1035', marginBottom: '2px' }}>{entry.name}{isMe && <span style={{ fontSize: '10px', color: cfg.primary }}> (you)</span>}</div>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: MEDAL_COLORS[rank] }}>{entry.total_points}</div>
                        <div style={{ fontSize: '10px', color: '#9090a8' }}>pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full list */}
            {board.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: '16px', padding: '3rem', textAlign: 'center', border: `1px solid ${cfg.chipBorder}` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏆</div>
                <div style={{ color: '#1a1035', fontWeight: 600 }}>No entries yet. Be the first!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {board.map((entry, i) => {
                  const isMe = entry.id === student?.id;
                  return (
                    <div key={entry.id} style={{
                      background: isMe ? cfg.chipBg : '#fff',
                      borderRadius: '14px', padding: '14px 18px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      border: isMe ? `2px solid ${cfg.primary}` : `1px solid ${i < 3 ? `${MEDAL_COLORS[i]}30` : cfg.chipBorder}`,
                      boxShadow: isMe ? `0 4px 16px ${cfg.primary}20` : '0 2px 6px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { if (!isMe) e.currentTarget.style.boxShadow = `0 4px 16px ${cfg.primary}14`; }}
                      onMouseLeave={e => { if (!isMe) e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)'; }}>

                      {/* Rank */}
                      <div style={{ minWidth: '36px', textAlign: 'center', fontSize: i < 3 ? '1.5rem' : '14px', fontWeight: 700, color: i < 3 ? MEDAL_COLORS[i] : '#9090a8' }}>
                        {i < 3 ? MEDALS[i] : `#${i + 1}`}
                      </div>

                      {/* Avatar */}
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: isMe ? cfg.gradient : `${cfg.chipBorder}88`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: isMe ? '#fff' : cfg.primary, flexShrink: 0 }}>
                        {entry.name?.charAt(0)?.toUpperCase()}
                      </div>

                      {/* Name + level */}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1035' }}>
                          {entry.name} {isMe && <span style={{ fontSize: '11px', color: cfg.primary, fontWeight: 700 }}>(you)</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9090a8' }}>Level {entry.current_level ?? 1}</div>
                      </div>

                      {/* Points */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '18px', background: i < 3 ? 'none' : cfg.gradient, WebkitBackgroundClip: i < 3 ? 'unset' : 'text', WebkitTextFillColor: i < 3 ? MEDAL_COLORS[i] : 'transparent', backgroundClip: i < 3 ? 'unset' : 'text', color: i < 3 ? MEDAL_COLORS[i] : undefined }}>
                          {entry.total_points}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9090a8' }}>pts</div>
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
