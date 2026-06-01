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

const SUBJECT_COLORS = {
  Physics: '#6c63ff',
  Chemistry: '#10b981',
  Mathematics: '#3b82f6',
  Botany: '#22c55e',
  Zoology: '#f59e0b',
};

const SubjectChip = ({ label }) => (
  <span style={{
    display: 'inline-block',
    background: `rgba(${label === 'Physics' ? '108,99,255' : label === 'Chemistry' ? '16,185,129' : label === 'Mathematics' ? '59,130,246' : label === 'Botany' ? '34,197,94' : '245,158,11'}, 0.15)`,
    border: `1px solid ${SUBJECT_COLORS[label] || '#9090a8'}40`,
    color: SUBJECT_COLORS[label] || '#9090a8',
    borderRadius: '9999px',
    padding: '2px 10px',
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '4px',
    marginBottom: '4px',
  }}>
    {label}
  </span>
);

const EMPTY_FORM = {
  name: '',
  class: '11',
  exam_type: 'JEE',
  subjects: [],
  price: 0,
  original_price: 0,
  description: '',
  features: [],
  is_active: true,
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) router.push('/');
    loadCourses();
    loadAnalytics();
  }, []);

  const loadCourses = async () => {
    const data = await apiCall('/admin/courses');
    if (data.success) setCourses(data.courses || []);
  };

  const loadAnalytics = async () => {
    const data = await apiCall('/admin/revenue');
    if (data.success) setAnalytics(data);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addSubject = () => {
    const v = subjectInput.trim();
    if (v && !form.subjects.includes(v)) set('subjects', [...form.subjects, v]);
    setSubjectInput('');
  };

  const addFeature = () => {
    const v = featureInput.trim();
    if (v && !form.features.includes(v)) set('features', [...form.features, v]);
    setFeatureInput('');
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      class: c.class,
      exam_type: c.exam_type,
      subjects: c.subjects || [],
      price: c.price,
      original_price: c.original_price || 0,
      description: c.description || '',
      features: c.features || [],
      is_active: c.is_active,
    });
    setMessage('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setMessage('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let data;
    if (editingId) {
      data = await apiCall(`/admin/courses/${editingId}`, 'PUT', form);
    } else {
      data = await apiCall('/admin/courses', 'POST', form);
    }
    if (data.success) {
      setMessage(editingId ? 'Course updated!' : 'Course created!');
      cancelEdit();
      loadCourses();
      loadAnalytics();
    } else {
      setMessage('Error: ' + (data.error || 'Unknown error'));
    }
    setLoading(false);
  };

  const toggleActive = async (c) => {
    await apiCall(`/admin/courses/${c.id}`, 'PUT', { ...c, is_active: !c.is_active });
    loadCourses();
  };

  const deleteCourse = async (c) => {
    if (!window.confirm(`Delete course "${c.name}"? This cannot be undone.`)) return;
    await apiCall(`/admin/courses/${c.id}`, 'DELETE');
    if (editingId === c.id) cancelEdit();
    setCourses(prev => prev.filter(x => x.id !== c.id));
    loadAnalytics();
  };

  const getEnrollments = (courseId) => {
    if (!analytics) return 0;
    const found = analytics.by_course?.find(bc => bc.course_name === courses.find(c => c.id === courseId)?.name);
    return found ? parseInt(found.enrollments) : 0;
  };

  return (
    <div>
      <nav className="nav">
        {NAV_LINKS.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/courses' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/courses' ? 600 : 400 }}>
            {l.label}
          </a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>
          Sign Out
        </button>
      </nav>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* LEFT: Form */}
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>{editingId ? 'Edit Course' : 'Add Course'}</h1>
          <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '1.5rem' }}>
            {editingId ? 'Update course details below' : 'Create a new course for students to enroll in'}
          </p>

          {message && (
            <div className={`alert ${message.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          {editingId && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Editing course #{editingId}</span>
              <button type="button" onClick={cancelEdit} style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>Cancel</button>
            </div>
          )}

          <div className="card">
            <form onSubmit={submit}>
              <div className="form-group">
                <label>Course Name</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Class 11 JEE (Main + Advanced)" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Class</label>
                  <select value={form.class} onChange={e => set('class', e.target.value)}>
                    <option value="11">Class 11</option>
                    <option value="12">Class 12</option>
                    <option value="Dropper">Dropper</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Exam Type</label>
                  <select value={form.exam_type} onChange={e => set('exam_type', e.target.value)}>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => set('price', parseInt(e.target.value) || 0)} min="0" />
                </div>
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input type="number" value={form.original_price} onChange={e => set('original_price', parseInt(e.target.value) || 0)} min="0" />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} style={{ resize: 'vertical' }} placeholder="Short description of the course..." />
              </div>

              {/* Subjects */}
              <div className="form-group">
                <label>Subjects</label>
                <div style={{ marginBottom: '6px' }}>
                  {form.subjects.map(s => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '9999px', padding: '2px 8px', fontSize: '12px', color: '#c4c0ff', marginRight: '4px', marginBottom: '4px' }}>
                      {s}
                      <button type="button" onClick={() => set('subjects', form.subjects.filter(x => x !== s))} style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <select value={subjectInput} onChange={e => setSubjectInput(e.target.value)} style={{ flex: 1, fontSize: '13px' }}>
                    <option value="">Select subject...</option>
                    {['Physics', 'Chemistry', 'Mathematics', 'Botany', 'Zoology'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button type="button" onClick={addSubject} disabled={!subjectInput} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: '6px', color: '#a5a0ff', cursor: 'pointer' }}>+ Add</button>
                </div>
              </div>

              {/* Features */}
              <div className="form-group">
                <label>Features</label>
                <div style={{ marginBottom: '6px' }}>
                  {form.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
                      <span style={{ fontSize: '13px', color: '#e0e0e0', flex: 1 }}>{f}</span>
                      <button type="button" onClick={() => set('features', form.features.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '16px' }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} placeholder="e.g. AI-powered adaptive learning" style={{ flex: 1, fontSize: '13px' }} />
                  <button type="button" onClick={addFeature} disabled={!featureInput.trim()} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: '6px', color: '#a5a0ff', cursor: 'pointer' }}>+ Add</button>
                </div>
              </div>

              {editingId && (
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.is_active ? 'active' : 'inactive'} onChange={e => set('is_active', e.target.value === 'active')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '11px' }} disabled={loading}>
                  {loading ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
                </button>
                {editingId && (
                  <button type="button" className="btn-ghost" onClick={cancelEdit} style={{ padding: '11px 20px' }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT: Course list */}
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            Courses
            <span style={{ fontSize: '12px', color: '#9090a8', fontWeight: 400, marginLeft: '8px' }}>({courses.length})</span>
          </h2>

          {courses.length === 0 && (
            <div className="card" style={{ color: '#9090a8', textAlign: 'center' }}>No courses yet</div>
          )}

          {courses.map(c => {
            const enrollments = analytics?.by_course?.find(bc => bc.course_name === c.name);
            const enrollCount = enrollments ? parseInt(enrollments.enrollments) : 0;
            return (
              <div key={c.id} className="card" style={{ padding: '1rem', marginBottom: '12px', border: editingId === c.id ? '1px solid rgba(245,158,11,0.5)' : c.is_active ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(239,68,68,0.2)', opacity: c.is_active ? 1 : 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: c.exam_type === 'JEE' ? '#6c63ff' : '#10b981', background: c.exam_type === 'JEE' ? 'rgba(108,99,255,0.12)' : 'rgba(16,185,129,0.12)', padding: '1px 8px', borderRadius: '9999px' }}>
                        {c.exam_type}
                      </span>
                      <span style={{ fontSize: '11px', color: '#9090a8' }}>Class {c.class}</span>
                      {!c.is_active && <span style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 8px', borderRadius: '9999px' }}>Inactive</span>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{c.name}</div>
                    <div style={{ marginBottom: '6px' }}>
                      {(c.subjects || []).map(s => <SubjectChip key={s} label={s} />)}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
                      <span style={{ color: '#6c63ff', fontWeight: 700 }}>₹{c.price?.toLocaleString()}</span>
                      {c.original_price > 0 && <span style={{ color: '#9090a8', textDecoration: 'line-through' }}>₹{c.original_price?.toLocaleString()}</span>}
                      <span style={{ color: '#9090a8' }}>{enrollCount} enrolled</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn-ghost" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={() => startEdit(c)}>Edit</button>
                    <button
                      style={{ fontSize: '12px', padding: '5px 10px', background: c.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: c.is_active ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: c.is_active ? '#ef4444' : '#22c55e', cursor: 'pointer' }}
                      onClick={() => toggleActive(c)}
                    >
                      {c.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      style={{ fontSize: '12px', padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => deleteCourse(c)}
                      title="Delete course permanently"
                    >Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
