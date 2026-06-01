'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/courses', label: 'Courses' },
  { href: '/concepts', label: 'Concepts' },
  { href: '/questions', label: 'Questions' },
  { href: '/sets',      label: 'Sets'      },
  { href: '/library', label: 'Library' },
  { href: '/students', label: 'Students' },
  { href: '/revenue', label: 'Revenue' },
];

export default function RevenuePage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) router.push('/');
    loadRevenue();
  }, []);

  const loadRevenue = async () => {
    setLoading(true);
    const res = await apiCall('/admin/revenue');
    if (res.success) setData(res);
    setLoading(false);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatMonth = (m) => {
    if (!m) return '—';
    const [year, month] = m.split('-');
    return new Date(year, parseInt(month) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <nav className="nav">
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/revenue' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/revenue' ? 600 : 400 }}>
            {l.label}
          </a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>
          Sign Out
        </button>
      </nav>

      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Revenue</h1>

        {loading ? (
          <div style={{ color: '#9090a8', textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Total Revenue</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
                  ₹{(data?.total_revenue || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Total Enrollments</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#6c63ff' }}>{data?.total_enrollments || 0}</p>
              </div>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Avg Revenue / Student</p>
                <p style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                  ₹{(data?.avg_revenue_per_student || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              {/* By Course Table */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Revenue by Course</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Course', 'Enrollments', 'Revenue'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.by_course || []).map(c => (
                      <tr key={c.course_name} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', color: '#e0e0e0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.course_name}</td>
                        <td style={{ padding: '10px 14px', color: '#6c63ff', fontWeight: 600 }}>{c.enrollments}</td>
                        <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: 600 }}>₹{parseInt(c.revenue || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(data?.by_course || []).length === 0 && (
                      <tr><td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: '#9090a8' }}>No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Monthly Revenue */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Monthly Revenue (Last 6 Months)</h2>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Month', 'Enrollments', 'Revenue'].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.monthly || []).map(m => (
                      <tr key={m.month} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 14px', color: '#e0e0e0' }}>{formatMonth(m.month)}</td>
                        <td style={{ padding: '10px 14px', color: '#6c63ff', fontWeight: 600 }}>{m.enrollments}</td>
                        <td style={{ padding: '10px 14px', color: '#22c55e', fontWeight: 600 }}>₹{parseInt(m.revenue || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {(data?.monthly || []).length === 0 && (
                      <tr><td colSpan={3} style={{ padding: '1.5rem', textAlign: 'center', color: '#9090a8' }}>No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Enrollments */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Enrollments</h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                    {['Student', 'Course', 'Amount', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.recent_enrollments || []).map((e, i) => (
                    <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#e0e0e0' }}>{e.student_name || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#9090a8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.course_name}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>₹{parseInt(e.amount_paid || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#9090a8' }}>{formatDate(e.enrolled_at)}</td>
                    </tr>
                  ))}
                  {(data?.recent_enrollments || []).length === 0 && (
                    <tr><td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: '#9090a8' }}>No enrollments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
