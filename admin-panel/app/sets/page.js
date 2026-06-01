'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/courses',   label: 'Courses'   },
  { href: '/concepts',  label: 'Concepts'  },
  { href: '/questions', label: 'Questions' },
  { href: '/sets',      label: 'Sets'      },
  { href: '/library',   label: 'Library'   },
  { href: '/students',  label: 'Students'  },
  { href: '/revenue',   label: 'Revenue'   },
  { href: '/landing',   label: 'Landing Page' },
];

const LEVEL_COLOR = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };

export default function SetsPage() {
  const router = useRouter();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) { router.push('/'); return; }
    loadSets();
  }, []);

  const loadSets = async () => {
    setLoading(true);
    const data = await apiCall('/admin/question-sets');
    if (data.success) setSets(data.sets || []);
    setLoading(false);
  };

  const deleteSet = async (id, title) => {
    if (!window.confirm(`Delete question set "${title}"?\nThis removes all questions in it. Cannot be undone.`)) return;
    setDeleting(id);
    await apiCall(`/admin/boss-questions/${id}`, 'DELETE');
    setSets(prev => prev.filter(s => s.id !== id));
    setDeleting(null);
  };

  const subjects = [...new Set(sets.map(s => s.subject).filter(Boolean))].sort();

  const filtered = sets.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.title?.toLowerCase().includes(q) || s.concept_name?.toLowerCase().includes(q) || s.chapter_name?.toLowerCase().includes(q);
    const matchSubject = !filterSubject || s.subject === filterSubject;
    return matchSearch && matchSubject;
  });

  // Group by subject
  const grouped = filtered.reduce((acc, s) => {
    const key = s.subject || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div>
      <nav className="nav">
        {NAV.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/sets' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/sets' ? 700 : 400 }}>{l.label}</a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#f0f0ff', marginBottom: '4px' }}>Question Sets</h1>
            <div style={{ fontSize: '13px', color: '#9090a8' }}>{sets.filter(s => (s.steps||[]).length > 0).length} sets with questions</div>
          </div>
          <a href="/questions">
            <button className="btn-primary" style={{ padding: '10px 22px', fontSize: '14px' }}>+ Add New Set</button>
          </a>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, concept or chapter..."
            style={{ flex: 1, minWidth: '200px', padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', fontSize: '13px', outline: 'none' }}
          />
          <select
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#e0e0e0', fontSize: '13px' }}
          >
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9090a8' }}>Loading sets...</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#9090a8', padding: '3rem' }}>
            {search || filterSubject ? 'No sets match your search.' : 'No question sets yet. Go to Questions to add one.'}
          </div>
        ) : (
          Object.entries(grouped).map(([subject, subjectSets]) => (
            <div key={subject} style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid rgba(108,99,255,0.2)' }}>
                {subject} · {subjectSets.length} set{subjectSets.length !== 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}>
                {subjectSets.map(s => {
                  const qCount = (s.steps || []).length;
                  const isEmpty = qCount === 0;
                  return (
                    <div key={s.id} className="card" style={{ opacity: isEmpty ? 0.5 : 1, position: 'relative', padding: '14px 16px' }}>
                      {isEmpty && (
                        <div style={{ position: 'absolute', top: 8, right: 8, fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', padding: '2px 7px', borderRadius: '9999px' }}>
                          EMPTY
                        </div>
                      )}
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: '#f0f0ff', marginBottom: '4px', paddingRight: isEmpty ? '60px' : 0 }}>{s.title}</div>
                        <div style={{ fontSize: '12px', color: '#9090a8' }}>
                          {s.concept_name && <span>{s.concept_name}</span>}
                          {s.chapter_name && <span> · {s.chapter_name}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {s.level && (
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', color: LEVEL_COLOR[s.level] || '#9090a8', background: `${LEVEL_COLOR[s.level] || '#9090a8'}18`, textTransform: 'capitalize' }}>
                            {s.level}
                          </span>
                        )}
                        {s.question_type_category && s.question_type_category !== 'single_correct' && (
                          <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', color: '#a5a0ff', background: 'rgba(108,99,255,0.12)' }}>
                            {s.question_type_category.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', color: qCount > 0 ? '#34d399' : '#9090a8', background: qCount > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)' }}>
                          {qCount} question{qCount !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '10px', color: '#6b6b80' }}>#{s.id}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a href={`/questions?concept_id=${s.concept_id}`} style={{ flex: 1 }}>
                          <button className="btn-ghost" style={{ width: '100%', padding: '7px', fontSize: '12px' }}>✏ Edit / Add Questions</button>
                        </a>
                        <button
                          className="btn-ghost"
                          style={{ padding: '7px 12px', fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', flexShrink: 0 }}
                          onClick={() => deleteSet(s.id, s.title)}
                          disabled={deleting === s.id}
                        >
                          {deleting === s.id ? '...' : '🗑'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
