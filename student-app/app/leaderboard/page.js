'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent } from '../../src/lib/auth';

export default function LeaderboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const student = getStudent();

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    apiCall('/leaderboard').then(d => {
      if (d.success) setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <Navbar />
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center', color: '#9090a8' }}>Loading...</div>
    </>
  );

  const board = data?.leaderboard || [];
  const myRank = data?.student_rank;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <Navbar />
      <div className="container">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Leaderboard</h1>
        <p style={{ color: '#9090a8', fontSize: '14px', marginBottom: '1.5rem' }}>Top students by total points</p>

        {myRank && (
          <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
            Your rank: <strong>#{myRank}</strong>
          </div>
        )}

        <div>
          {board.map((entry, i) => {
            const isMe = entry.id === student?.id;
            return (
              <div
                key={entry.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  border: isMe ? '1px solid rgba(108,99,255,0.5)' : undefined,
                  background: isMe ? 'rgba(108,99,255,0.07)' : undefined,
                }}
              >
                <div style={{ fontSize: i < 3 ? '1.5rem' : '1rem', minWidth: '32px', textAlign: 'center', color: i >= 3 ? '#9090a8' : undefined, fontWeight: 700 }}>
                  {i < 3 ? medals[i] : `#${i + 1}`}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>
                    {entry.name} {isMe && <span style={{ fontSize: '12px', color: '#6c63ff' }}>(you)</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: '#9090a8' }}>
                    Level {entry.current_level ?? 1}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#facc15', fontSize: '18px' }}>{entry.total_points}</div>
                  <div style={{ fontSize: '11px', color: '#9090a8' }}>pts</div>
                </div>
              </div>
            );
          })}
        </div>

        {board.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: '#9090a8', padding: '2rem' }}>
            No entries yet. Be the first!
          </div>
        )}
      </div>
    </>
  );
}
