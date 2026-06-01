'use client';
import { useEffect, useState, Fragment } from 'react';
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

export default function StudentsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [hardQuestions, setHardQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [studentDetail, setStudentDetail] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) router.push('/');
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [analyticsData, hardData] = await Promise.all([
      apiCall('/admin/student-analytics'),
      apiCall('/admin/analytics/hard-questions'),
    ]);
    if (analyticsData.success) setAnalytics(analyticsData);
    if (hardData.success) setHardQuestions(hardData.questions || []);
    setLoading(false);
  };

  const toggleStudent = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!studentDetail[id]) {
      setLoadingDetail(id);
      const data = await apiCall(`/admin/student-analytics/${id}`);
      if (data.success) {
        setStudentDetail(prev => ({ ...prev, [id]: data }));
      }
      setLoadingDetail(null);
    }
  };

  const deleteStudent = async (e, id, name) => {
    e.stopPropagation();
    if (!window.confirm(`Delete student "${name || id}"? This cannot be undone.`)) return;
    const res = await apiCall(`/admin/students/${id}`, 'DELETE');
    if (!res.success) { alert('Delete failed: ' + (res.error || 'Unknown error')); return; }
    if (expandedId === id) setExpandedId(null);
    setAnalytics(prev => prev ? { ...prev, students: prev.students.filter(s => s.id !== id) } : prev);
  };

  const formatDate = (d) => {
    if (!d) return 'Never';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <nav className="nav">
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/students' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/students' ? 600 : 400 }}>
            {l.label}
          </a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>
          Sign Out
        </button>
      </nav>

      <div className="container">
        <h1 style={{ marginBottom: '2rem' }}>Students</h1>

        {loading ? (
          <div style={{ color: '#9090a8', textAlign: 'center', padding: '3rem' }}>Loading...</div>
        ) : (
          <>
            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Total Students</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: '#6c63ff' }}>{analytics?.total_students || 0}</p>
              </div>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Active Today</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: '#22c55e' }}>{analytics?.active_today || 0}</p>
              </div>
              <div className="card">
                <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '4px' }}>Active This Week</p>
                <p style={{ fontSize: '32px', fontWeight: 700, color: '#f59e0b' }}>{analytics?.active_week || 0}</p>
              </div>
            </div>

            {/* Student Table */}
            <div className="card" style={{ marginBottom: '2rem', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Student List</h2>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Name', 'Phone', 'Course', 'Accuracy %', 'Total Attempts', 'Last Active', '', ''].map((h, i) => (
                        <th key={i} style={{ padding: '10px 14px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.students || []).map(s => (
                      <Fragment key={s.id}>
                        <tr style={{ borderTop: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: expandedId === s.id ? 'rgba(108,99,255,0.06)' : 'transparent' }} onClick={() => toggleStudent(s.id)}>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>{s.name || '—'}</td>
                          <td style={{ padding: '10px 14px', color: '#9090a8' }}>{s.phone}</td>
                          <td style={{ padding: '10px 14px' }}>
                            {s.enrolled_course_name ? (
                              <span style={{ fontSize: '11px', background: 'rgba(108,99,255,0.12)', color: '#a5a0ff', padding: '2px 8px', borderRadius: '9999px' }}>
                                {s.enrolled_course_name.replace('Class ', 'Cl ')}
                              </span>
                            ) : (
                              <span style={{ color: '#9090a8', fontSize: '12px' }}>Not enrolled</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: parseFloat(s.accuracy_pct) >= 70 ? '#22c55e' : parseFloat(s.accuracy_pct) >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                              {s.accuracy_pct || 0}%
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#e0e0e0' }}>{s.attempts_total || 0}</td>
                          <td style={{ padding: '10px 14px', color: '#9090a8' }}>{formatDate(s.last_active)}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: '#6c63ff', fontSize: '12px' }}>{expandedId === s.id ? '▲' : '▼'}</span>
                          </td>
                          <td style={{ padding: '10px 10px' }}>
                            <button
                              onClick={e => deleteStudent(e, s.id, s.name)}
                              style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                              title="Delete student"
                            >Delete</button>
                          </td>
                        </tr>
                        {expandedId === s.id && (
                          <tr>
                            <td colSpan={8} style={{ padding: 0 }}>
                              <div style={{ padding: '1rem 1.5rem', background: 'rgba(108,99,255,0.04)', borderTop: '1px solid rgba(108,99,255,0.15)' }}>
                                {loadingDetail === s.id ? (
                                  <p style={{ color: '#9090a8', fontSize: '13px' }}>Loading...</p>
                                ) : studentDetail[s.id] ? (
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#6c63ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Attempts by Concept</div>
                                      {studentDetail[s.id].attempts_by_concept?.length === 0 && <p style={{ color: '#9090a8', fontSize: '13px' }}>No attempts yet</p>}
                                      {studentDetail[s.id].attempts_by_concept?.slice(0, 6).map(a => (
                                        <div key={a.concept_name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                                          <span style={{ color: '#e0e0e0' }}>{a.concept_name}</span>
                                          <span style={{ color: parseFloat(a.accuracy) >= 70 ? '#22c55e' : parseFloat(a.accuracy) >= 50 ? '#f59e0b' : '#ef4444' }}>
                                            {a.correct}/{a.total} ({a.accuracy}%)
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '11px', color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Recent Activity</div>
                                      {studentDetail[s.id].recent_activity?.length === 0 && <p style={{ color: '#9090a8', fontSize: '13px' }}>No recent activity</p>}
                                      {studentDetail[s.id].recent_activity?.slice(0, 6).map(a => (
                                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                                          <span style={{ color: '#e0e0e0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
                                            {a.concept_tag || a.question_text?.substring(0, 40)}
                                          </span>
                                          <span style={{ color: a.is_correct ? '#22c55e' : '#ef4444', fontWeight: 600, flexShrink: 0 }}>
                                            {a.is_correct ? 'Correct' : 'Wrong'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                    {(analytics?.students || []).length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#9090a8' }}>No students yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hard Questions Section */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Hard Questions</h2>
                <p style={{ fontSize: '12px', color: '#9090a8', marginTop: '2px' }}>Questions where 50%+ of attempts are wrong</p>
              </div>
              {hardQuestions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#9090a8', fontSize: '13px' }}>No hard questions data yet</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                        {['Question', 'Concept Tag', 'Boss Title', 'Fail Rate', 'Total Attempts'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#9090a8', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hardQuestions.map(q => (
                        <tr key={q.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px 14px', maxWidth: '300px', color: '#e0e0e0' }}>{q.question_text}...</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: '11px', background: 'rgba(108,99,255,0.12)', color: '#a5a0ff', padding: '2px 8px', borderRadius: '9999px' }}>{q.concept_tag || '—'}</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#9090a8', fontSize: '12px' }}>{q.boss_title}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>{q.fail_rate}%</span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#e0e0e0' }}>{q.total_attempts}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
