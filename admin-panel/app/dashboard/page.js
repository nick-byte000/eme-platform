'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '../../src/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/courses',   label: 'Courses'   },
  { href: '/concepts',  label: 'Concepts'  },
  { href: '/questions', label: 'Questions' },
  { href: '/library',   label: 'Library'   },
  { href: '/students',  label: 'Students'  },
  { href: '/revenue',   label: 'Revenue'   },
];

const QUICK = [
  { href: '/courses',   icon: '🎓', label: 'Manage Courses',   desc: 'Add / edit course pricing & subjects',    color: '#6c63ff' },
  { href: '/concepts',  icon: '📚', label: 'Add Concepts',     desc: 'Create subtopics per subject & course',   color: '#34d399' },
  { href: '/questions', icon: '❓', label: 'Add Questions',    desc: 'Build ladder sets + practice quizzes',    color: '#f59e0b' },
  { href: '/library',   icon: '🔬', label: 'Physics Library',  desc: 'Manage chapters, topics & subtopics',     color: '#60a5fa' },
  { href: '/students',  icon: '👥', label: 'Students',         desc: 'View usage, accuracy & delete users',     color: '#f87171' },
  { href: '/revenue',   icon: '💰', label: 'Revenue',          desc: 'Enrollment totals, monthly breakdown',    color: '#a78bfa' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) { router.push('/'); return; }
    loadAll();
    const tick = () => setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [analyticsRes, revenueRes, conceptsRes, questionsRes] = await Promise.all([
        apiCall('/admin/student-analytics').catch(() => ({})),
        apiCall('/admin/revenue').catch(() => ({})),
        apiCall('/admin/concepts-list').catch(() => ({})),
        apiCall('/admin/question-sets-count').catch(() => ({})),
      ]);
      setData({
        students:     analyticsRes.success ? analyticsRes : {},
        revenue:      revenueRes.success   ? revenueRes   : {},
        conceptCount: conceptsRes.success  ? (conceptsRes.concepts || []).length : 0,
        setCount:     questionsRes.success ? (questionsRes.count    || 0)        : 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

  const StatCard = ({ label, value, sub, color, icon }) => (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '2rem', lineHeight: 1, filter: `drop-shadow(0 0 8px ${color}60)` }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '11px', color: '#9090a8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>{label}</div>
        <div style={{ fontSize: '2rem', fontWeight: 900, color, lineHeight: 1, marginBottom: '3px' }}>{value}</div>
        {sub && <div style={{ fontSize: '11px', color: '#7070a0' }}>{sub}</div>}
      </div>
    </div>
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <nav className="nav">
        {NAV.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/dashboard' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/dashboard' ? 700 : 400 }}>{l.label}</a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px', color: '#f0f0ff' }}>Admin Dashboard</h1>
            <div style={{ fontSize: '13px', color: '#9090a8' }}>{today}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6c63ff', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{time}</div>
            <div style={{ fontSize: '11px', color: '#7070a0', marginTop: '2px' }}>Live clock</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9090a8' }}>Loading dashboard...</div>
        ) : (
          <>
            {/* ── KPI stats ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard icon="👥" label="Total Students"  value={fmt(data.students?.total_students)} sub={`${fmt(data.students?.active_today)} active today`}    color="#6c63ff" />
              <StatCard icon="📅" label="Active This Week" value={fmt(data.students?.active_week)}   sub="unique students"                                          color="#34d399" />
              <StatCard icon="💰" label="Total Revenue"   value={`₹${fmt(data.revenue?.total_revenue)}`} sub={`${fmt(data.revenue?.total_enrollments)} enrollments`} color="#f59e0b" />
              <StatCard icon="📚" label="Concepts"        value={fmt(data.conceptCount)}             sub="subtopics added"                                          color="#60a5fa" />
            </div>

            {/* ── Two-column section ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', marginBottom: '2rem', alignItems: 'start' }}>

              {/* Quick actions */}
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e0e0e0' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  {QUICK.map(q => (
                    <Link key={q.href} href={q.href} style={{ textDecoration: 'none' }}>
                      <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', border: `1px solid ${q.color}22` }}
                        onMouseEnter={e => { e.currentTarget.style.border = `1px solid ${q.color}55`; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${q.color}20`; }}
                        onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${q.color}22`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '1.4rem', filter: `drop-shadow(0 0 6px ${q.color}80)` }}>{q.icon}</span>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#f0f0ff' }}>{q.label}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#7070a0', lineHeight: 1.4 }}>{q.desc}</div>
                        <div style={{ marginTop: '10px', fontSize: '11px', color: q.color, fontWeight: 700 }}>Go →</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Revenue breakdown */}
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e0e0e0' }}>Revenue by Course</h2>
                <div className="card" style={{ padding: '1rem' }}>
                  {(data.revenue?.by_course || []).length === 0 ? (
                    <p style={{ color: '#9090a8', fontSize: '13px' }}>No enrollments yet</p>
                  ) : (
                    (data.revenue?.by_course || []).map((c, i) => {
                      const pct = data.revenue?.total_revenue > 0 ? Math.round((c.revenue / data.revenue.total_revenue) * 100) : 0;
                      return (
                        <div key={i} style={{ marginBottom: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                            <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{c.course_name?.replace('Class ', 'Cl ')}</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700 }}>₹{fmt(c.revenue)}</span>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '999px', height: '5px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#f59e0b,#f97316)', width: `${pct}%`, transition: 'width 0.6s' }} />
                          </div>
                          <div style={{ fontSize: '10px', color: '#7070a0', marginTop: '2px' }}>{c.enrollments} student{c.enrollments !== 1 ? 's' : ''} · {pct}%</div>
                        </div>
                      );
                    })
                  )}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#9090a8', fontWeight: 600 }}>Total</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>₹{fmt(data.revenue?.total_revenue)}</span>
                  </div>
                </div>

                {/* Avg revenue per student */}
                <div className="card" style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#9090a8', marginBottom: '2px' }}>Avg. Revenue / Student</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa' }}>₹{fmt(data.revenue?.avg_revenue_per_student)}</div>
                  </div>
                  <div style={{ fontSize: '2rem' }}>📊</div>
                </div>
              </div>
            </div>

            {/* ── Monthly revenue chart (bar) ── */}
            {(data.revenue?.monthly || []).length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e0e0e0' }}>Monthly Revenue</h2>
                <div className="card">
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', padding: '0 4px' }}>
                    {(() => {
                      const months = data.revenue.monthly.slice(-8);
                      const maxRev = Math.max(...months.map(m => Number(m.revenue || 0)), 1);
                      return months.map(m => {
                        const h = Math.max(6, Math.round((Number(m.revenue) / maxRev) * 100));
                        return (
                          <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <div style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700 }}>₹{Number(m.revenue) >= 1000 ? (Number(m.revenue)/1000).toFixed(1)+'k' : m.revenue}</div>
                            <div style={{ width: '100%', height: `${h}%`, borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg,#f59e0b,#f97316)', minHeight: '6px', transition: 'height 0.5s' }} />
                            <div style={{ fontSize: '9px', color: '#7070a0', textAlign: 'center', lineHeight: 1.2 }}>
                              {new Date(m.month).toLocaleDateString('en-IN', { month: 'short' })}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ── Recent enrollments ── */}
            {(data.revenue?.recent_enrollments || []).length > 0 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#e0e0e0' }}>Recent Enrollments</h2>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Student', 'Course', 'Amount', 'Date'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.revenue.recent_enrollments.slice(0, 8).map((e, i) => (
                        <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600, color: '#e0e0e0' }}>{e.student_name || '—'}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ fontSize: '11px', background: 'rgba(108,99,255,0.12)', color: '#a5a0ff', padding: '2px 8px', borderRadius: '9999px' }}>
                              {e.course_name?.replace('Class ', 'Cl ')}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: '#f59e0b', fontWeight: 700 }}>₹{fmt(e.amount_paid)}</td>
                          <td style={{ padding: '10px 16px', color: '#9090a8' }}>
                            {new Date(e.enrolled_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
