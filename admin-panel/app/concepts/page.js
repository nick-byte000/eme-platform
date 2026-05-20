'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

const EMPTY_FORM = {
  subject: '',
  chapter_name: '',
  topic_name: '',
  subtopic_name: '',
  concept_name: '',
  unlock_points: 0,
  language: 'english',
};

const SUBJECT_COLORS = {
  Physics:     '#6c63ff',
  Chemistry:   '#10b981',
  Mathematics: '#3b82f6',
  Botany:      '#22c55e',
  Zoology:     '#f59e0b',
};

export default function ConceptsPage() {
  const router = useRouter();
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  // Courses
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState(''); // for right panel filter

  // Library autocomplete
  const [library, setLibrary] = useState({});
  const [chapterSuggestions, setChapterSuggestions] = useState([]);
  const [topicOptions, setTopicOptions] = useState([]);
  const [subtopicOptions, setSubtopicOptions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [concepts, setConcepts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const chapterRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) router.push('/');
    loadLibrary();
    loadConcepts();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    const data = await apiCall('/admin/courses');
    if (data.success) setCourses(data.courses || []);
  };

  const loadLibrary = async () => {
    const data = await apiCall('/physics-library');
    if (data.success) setLibrary(data.library);
  };

  const loadConcepts = async () => {
    const data = await apiCall('/admin/concepts-list');
    if (data.success) setConcepts(data.concepts || []);
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // When course is selected, set subject if only one subject, else clear
  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    setForm(f => ({ ...f, subject: '' }));
    if (!courseId) return;
    const course = courses.find(c => String(c.id) === String(courseId));
    if (course?.subjects?.length === 1) {
      setForm(f => ({ ...f, subject: course.subjects[0] }));
    }
  };

  const selectedCourse = courses.find(c => String(c.id) === String(selectedCourseId));
  const subjectOptions = selectedCourse?.subjects || [];

  const handleChapterInput = (val) => {
    set('chapter_name', val);
    set('topic_name', '');
    set('subtopic_name', '');
    setTopicOptions([]);
    setSubtopicOptions([]);
    if (val.length < 1) { setChapterSuggestions([]); setShowSuggestions(false); return; }
    const matches = Object.keys(library).filter(ch =>
      ch.toLowerCase().includes(val.toLowerCase())
    );
    setChapterSuggestions(matches);
    setShowSuggestions(true);
  };

  const selectChapter = (chapter) => {
    set('chapter_name', chapter);
    const entry = library[chapter];
    if (entry) {
      // Only auto-set subject if it matches the selected course's subjects
      const entrySubject = entry.subject || 'Physics';
      if (!selectedCourse || selectedCourse.subjects.includes(entrySubject)) {
        set('subject', entrySubject);
      }
      setTopicOptions(entry.topics || []);
      setSubtopicOptions(entry.subtopics || []);
    }
    setChapterSuggestions([]);
    setShowSuggestions(false);
  };

  const startEdit = (concept) => {
    setEditingId(concept.id);
    // Restore course selection from concept's course_ids
    const cid = concept.course_ids?.[0] || '';
    setSelectedCourseId(String(cid));
    setForm({
      subject: concept.subject || '',
      chapter_name: concept.chapter_name || '',
      topic_name: concept.topic_name || '',
      subtopic_name: concept.subtopic_name || '',
      concept_name: concept.concept_name || '',
      unlock_points: concept.unlock_points || 0,
      language: concept.language || 'english',
    });
    setTopicOptions([]);
    setSubtopicOptions([]);
    setMessage('');
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setSelectedCourseId('');
    setForm({ ...EMPTY_FORM });
    setTopicOptions([]);
    setSubtopicOptions([]);
    setMessage('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedCourseId) { setMessage('Please select a course first'); return; }
    if (!form.subject) { setMessage('Please select a subject'); return; }
    setMessage('');
    setLoading(true);

    const payload = {
      ...form,
      course_ids: selectedCourseId ? [parseInt(selectedCourseId)] : [],
    };

    let data;
    if (editingId) {
      data = await apiCall(`/admin/concepts/${editingId}`, 'PUT', payload);
    } else {
      data = await apiCall('/admin/concepts', 'POST', payload);
    }

    if (data.success) {
      setMessage(editingId ? '✓ Concept updated!' : '✓ Concept added successfully!');
      cancelEdit();
      loadConcepts();
    } else {
      setMessage('Error: ' + (data.error || 'Unknown error'));
    }
    setLoading(false);
  };

  const deleteConcept = async (id) => {
    const data = await apiCall(`/admin/concepts/${id}`, 'DELETE');
    if (data.success) {
      setDeleteConfirm(null);
      loadConcepts();
    }
  };

  // Filter right-panel concepts by selected course filter
  const filteredConcepts = filterCourseId
    ? concepts.filter(c => (c.course_ids || []).map(String).includes(String(filterCourseId)))
    : concepts;

  const getCourseLabel = (concept) => {
    const cid = concept.course_ids?.[0];
    if (!cid) return null;
    return courses.find(c => c.id === cid)?.name || null;
  };

  return (
    <div>
      <nav className="nav">
        <a href="/dashboard" style={{ textDecoration: 'none', color: '#9090a8' }}>Dashboard</a>
        <a href="/courses" style={{ textDecoration: 'none', color: '#9090a8' }}>Courses</a>
        <a href="/concepts" style={{ textDecoration: 'none', color: '#6c63ff' }}>Concepts</a>
        <a href="/questions" style={{ textDecoration: 'none', color: '#9090a8' }}>Questions</a>
        <a href="/library" style={{ textDecoration: 'none', color: '#9090a8' }}>Library</a>
        <a href="/students" style={{ textDecoration: 'none', color: '#9090a8' }}>Students</a>
        <a href="/revenue" style={{ textDecoration: 'none', color: '#9090a8' }}>Revenue</a>
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

        {/* LEFT: Form */}
        <div ref={formRef}>
          <h1 style={{ marginBottom: '0.25rem' }}>
            {editingId ? 'Edit Concept' : 'Add Concept'}
          </h1>
          <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '1.5rem' }}>
            {editingId ? 'Make changes below and click Update Concept' : 'Select a course, then fill in the concept details'}
          </p>

          {message && (
            <div className={`alert ${message.startsWith('Error') || message.startsWith('Please') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          {editingId && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem',
              fontSize: '13px', color: '#f59e0b',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>Editing concept #{editingId}</span>
              <button type="button" onClick={cancelEdit}
                style={{ background: 'none', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}>
                Cancel
              </button>
            </div>
          )}

          <div className="card">
            <form onSubmit={submit}>

              {/* Step 1: Course */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#6c63ff', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>1</span>
                  Course
                </label>
                <select
                  value={selectedCourseId}
                  onChange={e => handleCourseSelect(e.target.value)}
                  required
                  style={{ borderColor: selectedCourseId ? 'rgba(108,99,255,0.5)' : undefined }}
                >
                  <option value="">Select course...</option>
                  {courses.filter(c => c.is_active).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Step 2: Subject — only shown after course selected */}
              {selectedCourseId && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#6c63ff', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>2</span>
                    Subject
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {subjectOptions.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('subject', s)}
                        style={{
                          padding: '6px 16px', borderRadius: '9999px', fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: form.subject === s ? (SUBJECT_COLORS[s] || '#6c63ff') : 'rgba(255,255,255,0.06)',
                          color: form.subject === s ? '#fff' : '#9090a8',
                          border: form.subject === s
                            ? `1px solid ${SUBJECT_COLORS[s] || '#6c63ff'}`
                            : '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rest of form — only shown after subject selected */}
              {selectedCourseId && form.subject && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '12px 0' }} />

                  {/* Chapter */}
                  <div className="form-group" style={{ position: 'relative' }} ref={chapterRef}>
                    <label>Chapter Name</label>
                    <input
                      type="text"
                      value={form.chapter_name}
                      onChange={e => handleChapterInput(e.target.value)}
                      onFocus={() => form.chapter_name && setShowSuggestions(chapterSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                      placeholder="Type chapter name..."
                      autoComplete="off"
                      required
                    />
                    {showSuggestions && chapterSuggestions.length > 0 && (
                      <div style={{
                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                        background: '#1a1a2e', border: '1px solid rgba(108,99,255,0.4)',
                        borderRadius: '8px', maxHeight: '220px', overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                      }}>
                        {chapterSuggestions.map(ch => (
                          <div key={ch} onMouseDown={() => selectChapter(ch)}
                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.target.style.background = 'rgba(108,99,255,0.15)'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                          >{ch}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Topic */}
                  <div className="form-group">
                    <label>Topic Name</label>
                    {topicOptions.length > 0 ? (
                      <select value={form.topic_name} onChange={e => set('topic_name', e.target.value)} required>
                        <option value="">Select topic...</option>
                        {topicOptions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={form.topic_name} onChange={e => set('topic_name', e.target.value)} placeholder="e.g. Forces" required />
                    )}
                  </div>

                  {/* Subtopic */}
                  <div className="form-group">
                    <label>Subtopic Name</label>
                    {subtopicOptions.length > 0 ? (
                      <select value={form.subtopic_name} onChange={e => set('subtopic_name', e.target.value)}>
                        <option value="">Select subtopic...</option>
                        {subtopicOptions.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={form.subtopic_name} onChange={e => set('subtopic_name', e.target.value)} placeholder="e.g. Static Friction" />
                    )}
                  </div>

                  {/* Concept name */}
                  <div className="form-group">
                    <label>Concept Name <span style={{ color: '#9090a8', fontSize: '12px' }}>(what students see)</span></label>
                    <input type="text" value={form.concept_name} onChange={e => set('concept_name', e.target.value)} placeholder="e.g. Static Friction" required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Unlock Points</label>
                      <input type="number" value={form.unlock_points} onChange={e => set('unlock_points', e.target.value)} min="0" />
                    </div>
                    <div className="form-group">
                      <label>Language</label>
                      <select value={form.language} onChange={e => set('language', e.target.value)}>
                        <option value="english">English</option>
                        <option value="hindi">Hindi</option>
                        <option value="hinglish">Hinglish</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '11px' }} disabled={loading}>
                      {loading
                        ? (editingId ? 'Updating...' : 'Adding...')
                        : (editingId ? 'Update Concept ✓' : 'Add Concept →')}
                    </button>
                    {editingId && (
                      <button type="button" className="btn-ghost" onClick={cancelEdit} style={{ padding: '11px 20px' }}>Cancel</button>
                    )}
                  </div>
                </>
              )}

              {/* Placeholder when no course selected */}
              {!selectedCourseId && (
                <div style={{ textAlign: 'center', color: '#9090a8', fontSize: '13px', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '4px' }}>
                  ↑ Select a course to continue
                </div>
              )}
              {selectedCourseId && !form.subject && (
                <div style={{ textAlign: 'center', color: '#9090a8', fontSize: '13px', padding: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '4px' }}>
                  ↑ Select a subject to continue
                </div>
              )}

            </form>
          </div>
        </div>

        {/* RIGHT: Existing concepts */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0 }}>
              Existing Concepts
              <span style={{ fontSize: '12px', color: '#9090a8', fontWeight: 400, marginLeft: '8px' }}>({filteredConcepts.length})</span>
            </h2>
            {/* Filter by course */}
            <select
              value={filterCourseId}
              onChange={e => setFilterCourseId(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 10px', borderRadius: '8px', maxWidth: '200px' }}
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {filteredConcepts.length === 0 && (
            <div className="card" style={{ color: '#9090a8', textAlign: 'center' }}>
              {filterCourseId ? 'No concepts for this course yet' : 'No concepts yet'}
            </div>
          )}

          {filteredConcepts.map(c => {
            const courseLabel = getCourseLabel(c);
            const subjectColor = SUBJECT_COLORS[c.subject] || '#9090a8';
            return (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: '1rem', marginBottom: '10px',
                  border: editingId === c.id ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'border 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, marginRight: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      {courseLabel && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: '#a5a0ff', background: 'rgba(108,99,255,0.12)', padding: '1px 7px', borderRadius: '9999px' }}>
                          {courseLabel}
                        </span>
                      )}
                      {c.subject && (
                        <span style={{ fontSize: '10px', fontWeight: 600, color: subjectColor, background: `${subjectColor}18`, padding: '1px 7px', borderRadius: '9999px' }}>
                          {c.subject}
                        </span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600 }}>{c.concept_name}</div>
                    <div style={{ fontSize: '12px', color: '#9090a8', marginTop: '2px' }}>{c.chapter_name} · {c.topic_name}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button className="btn-ghost" style={{ fontSize: '12px', padding: '5px 12px' }} onClick={() => startEdit(c)}>
                      Edit
                    </button>
                    <a href={`/questions?concept_id=${c.id}&concept_name=${encodeURIComponent(c.concept_name)}&course_id=${c.course_ids?.[0] || ''}`}>
                      <button className="btn-primary" style={{ fontSize: '12px', padding: '5px 12px' }}>
                        + Questions
                      </button>
                    </a>
                    {deleteConfirm === c.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button style={{ fontSize: '11px', padding: '5px 10px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer' }} onClick={() => deleteConcept(c.id)}>
                          Confirm
                        </button>
                        <button className="btn-ghost" style={{ fontSize: '11px', padding: '5px 8px' }} onClick={() => setDeleteConfirm(null)}>✕</button>
                      </div>
                    ) : (
                      <button style={{ fontSize: '12px', padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }} onClick={() => setDeleteConfirm(c.id)}>
                        Delete
                      </button>
                    )}
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
