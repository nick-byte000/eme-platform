'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiCall } from '../../src/lib/api';
import ImageUploader from '../../src/components/ImageUploader';
import MathRenderer from '../../src/components/MathRenderer';

// Shows a live math preview below a textarea when the value contains $
function MathPreview({ value }) {
  if (!value || !value.includes('$')) return null;
  return (
    <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '6px' }}>
      <div style={{ fontSize: '10px', color: '#6c63ff', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</div>
      <MathRenderer text={value} style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.6 }} />
    </div>
  );
}

const EMPTY_STEP = {
  concept_tag: '',
  question_text: '',
  question_image_url: '',
  option_a: '', option_a_image_url: '',
  option_b: '', option_b_image_url: '',
  option_c: '', option_c_image_url: '',
  option_d: '', option_d_image_url: '',
  correct_options: 'a',
  explanation: '',
  theory_card: '',
  theory_card_hinglish: '',
  video_url: '',
  hint_text: '',
  difficulty: 'medium',
  clone_question_text: '',
  clone_question_image_url: '',
  clone_option_a: '', clone_option_a_image_url: '',
  clone_option_b: '', clone_option_b_image_url: '',
  clone_option_c: '', clone_option_c_image_url: '',
  clone_option_d: '', clone_option_d_image_url: '',
  clone_correct_options: 'a',
  clone_explanation: '',
};

function QuestionsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const conceptId = params.get('concept_id');

  const [concepts, setConcepts] = useState([]);
  const [courses, setCourses] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedConceptId, setSelectedConceptId] = useState(conceptId || '');
  const [conceptCourseIds, setConceptCourseIds] = useState([]);
  const [savingCourses, setSavingCourses] = useState(false);
  const [courseMsg, setCourseMsg] = useState('');

  // Practice questions
  const EMPTY_PQ = { question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'a', hint_text:'' };
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [pqForm, setPqForm] = useState({ ...EMPTY_PQ });
  const [pqLoading, setPqLoading] = useState(false);
  const [pqMsg, setPqMsg] = useState('');
  const [editingPq, setEditingPq] = useState(null);

  // New set form
  const [bossTitle, setBossTitle] = useState('');
  const [bossText, setBossText] = useState('');
  const [bossImageUrl, setBossImageUrl] = useState('');
  const [bossLevel, setBossLevel] = useState('beginner');
  const [bossQType, setBossQType] = useState('single_correct');
  const [steps, setSteps] = useState(Array.from({ length: 8 }, (_, i) => ({ ...EMPTY_STEP, step_number: i + 1 })));
  const [openStep, setOpenStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState('');
  const [savedSetId, setSavedSetId] = useState(null); // locks form after save

  // Existing sets
  const [questionSets, setQuestionSets] = useState([]);
  const [expandedSet, setExpandedSet] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null); // { setId, stepId }
  const [editingStep, setEditingStep] = useState(null);   // step data being edited
  const [savingStep, setSavingStep] = useState(false);
  const [stepSaveMsg, setStepSaveMsg] = useState('');

  const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api').replace('/api', '');

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) router.push('/');
    loadConcepts();
    loadVideos();
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedConceptId) {
      loadQuestionSets(selectedConceptId);
      loadPracticeQuestions(selectedConceptId);
      const concept = concepts.find(c => String(c.id) === String(selectedConceptId));
      setConceptCourseIds(concept?.course_ids || []);
      setCourseMsg('');
    } else {
      setQuestionSets([]);
      setConceptCourseIds([]);
    }
  }, [selectedConceptId, concepts]);

  const loadConcepts = async () => {
    const data = await apiCall('/admin/concepts-list');
    if (data.success) setConcepts(data.concepts || []);
  };

  const loadCourses = async () => {
    const data = await apiCall('/admin/courses');
    if (data.success) setCourses(data.courses || []);
  };

  const toggleConceptCourse = (courseId) => {
    setConceptCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const saveConceptCourses = async () => {
    if (!selectedConceptId) return;
    setSavingCourses(true);
    setCourseMsg('');
    const data = await apiCall(`/admin/concepts/${selectedConceptId}/courses`, 'PUT', { course_ids: conceptCourseIds });
    setSavingCourses(false);
    if (data.success) {
      setCourseMsg('Courses saved!');
      loadConcepts();
    } else {
      setCourseMsg('Error: ' + (data.error || 'Failed'));
    }
  };

  const loadVideos = async () => {
    const data = await apiCall('/admin/videos');
    if (data.success) setVideos(data.videos || []);
  };

  const loadQuestionSets = async (cid) => {
    const data = await apiCall(`/admin/question-sets?concept_id=${cid}`);
    if (data.success) setQuestionSets(data.sets || []);
  };

  const loadPracticeQuestions = async (cid) => {
    const data = await apiCall(`/admin/practice-questions?concept_id=${cid}`);
    if (data.success) setPracticeQuestions(data.questions || []);
  };

  const savePracticeQuestion = async () => {
    if (!selectedConceptId) return;
    if (!pqForm.question_text.trim() || !pqForm.option_a.trim() || !pqForm.option_b.trim()) {
      setPqMsg('Question text, Option A and Option B are required');
      return;
    }
    setPqLoading(true); setPqMsg('');
    let data;
    if (editingPq) {
      data = await apiCall(`/admin/practice-questions/${editingPq}`, 'PUT', pqForm);
    } else {
      data = await apiCall('/admin/practice-questions', 'POST', { ...pqForm, concept_id: parseInt(selectedConceptId) });
    }
    setPqLoading(false);
    if (data.success) {
      setPqMsg(editingPq ? '✓ Updated' : '✓ Added');
      setPqForm({ ...EMPTY_PQ });
      setEditingPq(null);
      loadPracticeQuestions(selectedConceptId);
    } else {
      setPqMsg('Error: ' + (data.error || 'Failed'));
    }
  };

  const deletePracticeQuestion = async (id) => {
    if (!window.confirm('Delete this practice question?')) return;
    await apiCall(`/admin/practice-questions/${id}`, 'DELETE');
    loadPracticeQuestions(selectedConceptId);
  };

  const setPq = (k, v) => setPqForm(f => ({ ...f, [k]: v }));

  const updateStep = (index, field, value) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const filledCount = steps.filter(s => s.question_text.trim() && s.clone_question_text.trim()).length;

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedConceptId) { setMessage('Please select a concept first'); return; }
    if (!bossTitle.trim()) { setMessage('Please enter a question set title'); return; }
    const filledSteps = steps.filter(s => s.question_text.trim());
    if (filledSteps.length === 0) { setMessage('Add at least 1 question'); return; }

    setLoading(true);
    setMessage('');

    const concept = concepts.find(c => String(c.id) === String(selectedConceptId));
    const bossResult = await apiCall('/admin/boss-questions', 'POST', {
      concept_id: selectedConceptId,
      subject: concept?.subject || 'Physics',
      chapter_name: concept?.chapter_name || '',
      topic_name: concept?.topic_name || '',
      subtopic_name: concept?.subtopic_name || '',
      concept_name: concept?.concept_name || '',
      title: bossTitle,
      question_text: bossText || bossTitle,
      question_image_url: bossImageUrl || null,
      difficulty: 'medium',
      total_steps: filledSteps.length,
      target_exam: selectedCourseObj?.exam_type || 'JEE',
      level: bossLevel,
      question_type_category: bossQType,
      language: concept?.language || 'english',
      source: 'Admin created',
    });

    if (!bossResult.success) {
      setMessage('Error: ' + (bossResult.error || ''));
      setLoading(false);
      return;
    }

    const bossId = bossResult.boss_question.id;
    let added = 0;
    setProgress({ current: 0, total: filledSteps.length });

    for (let i = 0; i < filledSteps.length; i++) {
      const s = filledSteps[i];
      const r = await apiCall('/admin/ladder-steps', 'POST', {
        boss_question_id: bossId,
        step_number: s.step_number,
        concept_tag: s.concept_tag || `Step ${s.step_number}`,
        question_type: 'mcq',
        question_text: s.question_text,
        question_image_url: s.question_image_url || null,
        option_a: s.option_a, option_a_image_url: s.option_a_image_url || null,
        option_b: s.option_b, option_b_image_url: s.option_b_image_url || null,
        option_c: s.option_c, option_c_image_url: s.option_c_image_url || null,
        option_d: s.option_d, option_d_image_url: s.option_d_image_url || null,
        correct_options: s.correct_options,
        marks: 4,
        hint_text: s.hint_text,
        explanation: s.explanation,
        theory_card: s.theory_card,
        theory_card_hinglish: s.theory_card_hinglish,
        video_url: s.video_url,
        difficulty: s.difficulty,
        target_exam: 'JEE',
        language: concept?.language || 'english',
        source: 'Admin created',
        is_boss_step: i === filledSteps.length - 1,
        clone_question_text: s.clone_question_text,
        clone_question_image_url: s.clone_question_image_url || null,
        clone_option_a: s.clone_option_a, clone_option_a_image_url: s.clone_option_a_image_url || null,
        clone_option_b: s.clone_option_b, clone_option_b_image_url: s.clone_option_b_image_url || null,
        clone_option_c: s.clone_option_c, clone_option_c_image_url: s.clone_option_c_image_url || null,
        clone_option_d: s.clone_option_d, clone_option_d_image_url: s.clone_option_d_image_url || null,
        clone_correct_options: s.clone_correct_options,
        clone_explanation: s.clone_explanation,
      });
      if (r.success) { added++; setProgress({ current: added, total: filledSteps.length }); }
    }

    setMessage(`✓ Saved "${bossTitle}" with ${added} questions`);
    setSavedSetId(bossId); // lock the form — prevents double-saving
    setLoading(false);
    loadQuestionSets(selectedConceptId);
  };

  // Derive exam type from selected concept's course
  const selectedConceptObj = concepts.find(c => String(c.id) === String(selectedConceptId));
  const selectedCourseObj = courses.find(c => c.id === (selectedConceptObj?.course_ids?.[0]));
  const isJEE = selectedCourseObj?.exam_type === 'JEE';

  const LEVELS = [
    { value: 'beginner',     label: 'Beginner',     color: '#22c55e' },
    { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
    { value: 'advanced',     label: 'Advanced',     color: '#ef4444' },
  ];
  const JEE_QTYPES = [
    { value: 'single_correct',      label: 'Single Correct' },
    { value: 'multi_correct',       label: 'Multi-Correct' },
    { value: 'numerical',           label: 'Numerical' },
    { value: 'assertion_reasoning', label: 'Assertion-Reasoning' },
    { value: 'matching',            label: 'Matching' },
  ];

  const startNewSet = () => {
    setSavedSetId(null);
    setBossTitle('');
    setBossText('');
    setBossImageUrl('');
    setBossLevel('beginner');
    setBossQType('single_correct');
    setSteps(Array.from({ length: 8 }, (_, i) => ({ ...EMPTY_STEP, step_number: i + 1 })));
    setOpenStep(1);
    setMessage('');
  };

  // ── Inline step editing ───────────────────────────────────

  const startEditStep = (step) => {
    setEditingStep({ ...step });
    setStepSaveMsg('');
  };

  const saveEditStep = async () => {
    if (!editingStep) return;
    setSavingStep(true);
    setStepSaveMsg('');
    const { id, ...fields } = editingStep;
    const data = await apiCall(`/admin/ladder-steps/${id}`, 'PUT', fields);
    setSavingStep(false);
    if (data.success) {
      setStepSaveMsg('✓ Saved');
      setEditingStep(null);
      loadQuestionSets(selectedConceptId);
    } else {
      setStepSaveMsg('Error: ' + (data.error || 'Failed'));
    }
  };

  const setEdit = (field, value) => setEditingStep(prev => ({ ...prev, [field]: value }));

  const correctOptions = ['a', 'b', 'c', 'd'];

  // ── Video picker helper ───────────────────────────────────

  const VideoField = ({ value, onChange }) => (
    <div>
      {videos.length > 0 && (
        <select
          value={videos.some(v => `${BACKEND_URL}${v.url}` === value) ? value : '__custom__'}
          onChange={e => { if (e.target.value !== '__custom__') onChange(e.target.value); else onChange(''); }}
          style={{ marginBottom: '6px', width: '100%' }}
        >
          <option value="__custom__">— Type a URL —</option>
          {videos.map(v => (
            <option key={v.filename} value={`${BACKEND_URL}${v.url}`}>📹 {v.filename}</option>
          ))}
        </select>
      )}
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="http://localhost:4000/videos/... or YouTube URL" />
    </div>
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <div>
      <nav className="nav">
        <a href="/dashboard" style={{ textDecoration: 'none', color: '#9090a8' }}>Dashboard</a>
        <a href="/courses" style={{ textDecoration: 'none', color: '#9090a8' }}>Courses</a>
        <a href="/concepts" style={{ textDecoration: 'none', color: '#9090a8' }}>Concepts</a>
        <a href="/questions" style={{ textDecoration: 'none', color: '#6c63ff' }}>Questions</a>
        <a href="/library" style={{ textDecoration: 'none', color: '#9090a8' }}>Library</a>
        <a href="/students" style={{ textDecoration: 'none', color: '#9090a8' }}>Students</a>
        <a href="/revenue" style={{ textDecoration: 'none', color: '#9090a8' }}>Revenue</a>
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '2rem', alignItems: 'start' }}>

        {/* ── LEFT: Add new set form ── */}
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Add Question Set</h1>
          <p style={{ color: '#9090a8', fontSize: '13px', marginBottom: '1.5rem' }}>
            8 main questions + 8 clone (simplified) questions per concept
          </p>

          {message && (
            <div className={`alert ${message.startsWith('Error') || message.startsWith('Please') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
              {message}
            </div>
          )}

          <form onSubmit={submit}>
            {/* Set info */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '15px' }}>Question Set Info</h3>
              <div className="form-group">
                <label>Concept</label>
                <select value={selectedConceptId} onChange={e => setSelectedConceptId(e.target.value)} required>
                  <option value="">Select concept...</option>
                  {concepts.map(c => (
                    <option key={c.id} value={c.id}>{c.concept_name} — {c.chapter_name}</option>
                  ))}
                </select>
              </div>
              {/* Course assignment for concept */}
              {selectedConceptId && (
                <div className="form-group">
                  <label>Courses for this Concept</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    {courses.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleConceptCourse(c.id)}
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          borderRadius: '9999px',
                          cursor: 'pointer',
                          background: conceptCourseIds.includes(c.id) ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.05)',
                          border: conceptCourseIds.includes(c.id) ? '1px solid rgba(108,99,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                          color: conceptCourseIds.includes(c.id) ? '#a5a0ff' : '#9090a8',
                        }}
                      >
                        {c.name.replace('Class ', 'Cl ')}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" className="btn-ghost" style={{ fontSize: '12px', padding: '5px 14px' }} onClick={saveConceptCourses} disabled={savingCourses}>
                      {savingCourses ? 'Saving...' : 'Save Course Assignment'}
                    </button>
                    {courseMsg && <span style={{ fontSize: '12px', color: courseMsg.startsWith('Error') ? '#ef4444' : '#22c55e' }}>{courseMsg}</span>}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Question Set Title</label>
                <input type="text" value={bossTitle} onChange={e => setBossTitle(e.target.value)}
                  placeholder="e.g. Friction on a Truck — Full Problem" required />
              </div>
              <div className="form-group">
                <label>Problem Context <span style={{ color: '#9090a8', fontSize: '12px' }}>(optional intro)</span></label>
                <textarea value={bossText} onChange={e => setBossText(e.target.value)} rows={3}
                  placeholder="e.g. A 1 kg block sits on a truck moving at 20 m/s..." style={{ resize: 'vertical' }} />
              </div>

              {/* Level selector */}
              <div className="form-group">
                <label>Level</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  {LEVELS.map(lv => (
                    <button
                      key={lv.value}
                      type="button"
                      onClick={() => setBossLevel(lv.value)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: bossLevel === lv.value ? `${lv.color}22` : 'rgba(255,255,255,0.04)',
                        color: bossLevel === lv.value ? lv.color : '#9090a8',
                        border: bossLevel === lv.value ? `1.5px solid ${lv.color}` : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {lv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Type — for all courses */}
              <div className="form-group">
                <label>Question Type</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {JEE_QTYPES.map(qt => (
                    <button
                      key={qt.value}
                      type="button"
                      onClick={() => setBossQType(qt.value)}
                      style={{
                        padding: '5px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: bossQType === qt.value ? 'rgba(108,99,255,0.2)' : 'rgba(255,255,255,0.04)',
                        color: bossQType === qt.value ? '#a5a0ff' : '#9090a8',
                        border: bossQType === qt.value ? '1.5px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {qt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Context Image <span style={{ color: '#9090a8', fontSize: '12px' }}>(optional diagram)</span></label>
                <ImageUploader value={bossImageUrl} onChange={setBossImageUrl} label="Context Image" />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#9090a8', marginBottom: '8px' }}>
              <span>{filledCount}/8 questions filled (main + clone)</span>
              <span style={{ color: '#6c63ff' }}>Click a step to expand</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#6c63ff,#f97316)', width: `${(filledCount / 8) * 100}%`, transition: 'width 0.4s ease' }} />
            </div>

            {/* 8-step accordions */}
            {steps.map((step, idx) => {
              const isOpen = openStep === step.step_number;
              const isFilled = step.question_text.trim() && step.clone_question_text.trim();
              const hasMain = step.question_text.trim();
              return (
                <div key={idx} className="card" style={{ marginBottom: '10px', padding: 0, overflow: 'hidden' }}>
                  <div onClick={() => setOpenStep(isOpen ? null : step.step_number)} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 18px', cursor: 'pointer',
                    background: isOpen ? 'rgba(108,99,255,0.08)' : 'transparent',
                    borderBottom: isOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    userSelect: 'none'
                  }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                      background: isFilled ? '#22c55e' : hasMain ? '#f97316' : 'rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '12px', fontWeight: 700, color: 'white'
                    }}>
                      {isFilled ? '✓' : step.step_number}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>
                        Step {step.step_number}
                        {step.concept_tag && <span style={{ color: '#6c63ff', marginLeft: '8px' }}>{step.concept_tag}</span>}
                      </span>
                      {!isOpen && step.question_text && (
                        <div style={{ fontSize: '12px', color: '#9090a8', marginTop: '2px' }}>
                          {step.question_text.substring(0, 70)}...
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {hasMain && <span style={{ fontSize: '11px', color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: '10px' }}>Main ✓</span>}
                      {step.clone_question_text && <span style={{ fontSize: '11px', color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: '10px' }}>Clone ✓</span>}
                      <span style={{ color: '#9090a8', fontSize: '16px' }}>{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '20px 18px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Main */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(249,115,22,0.2)' }}>
                            Main Question
                          </div>
                          <div className="form-group"><label>Concept Tag</label>
                            <input value={step.concept_tag} onChange={e => updateStep(idx, 'concept_tag', e.target.value)} placeholder="e.g. Normal Force" />
                          </div>
                          <div className="form-group"><label>Question <span style={{ color: '#6c63ff', fontSize: '10px', fontWeight: 400 }}>use $...$ for math</span></label>
                            <textarea value={step.question_text} onChange={e => updateStep(idx, 'question_text', e.target.value)} rows={3} placeholder="e.g. Find $\frac{1}{2}mv^2$ when v = 10 m/s" style={{ resize: 'vertical' }} />
                            <MathPreview value={step.question_text} />
                            <ImageUploader value={step.question_image_url} onChange={v => updateStep(idx, 'question_image_url', v)} label="Question Image" />
                          </div>
                          {['a','b','c','d'].map(opt => (
                            <div className="form-group" key={opt} style={{ marginBottom: '8px' }}>
                              <label>Option {opt.toUpperCase()}</label>
                              <input value={step[`option_${opt}`]} onChange={e => updateStep(idx, `option_${opt}`, e.target.value)} placeholder={`Option ${opt.toUpperCase()}`} />
                              <MathPreview value={step[`option_${opt}`]} />
                              <ImageUploader value={step[`option_${opt}_image_url`]} onChange={v => updateStep(idx, `option_${opt}_image_url`, v)} label={`Option ${opt.toUpperCase()} Image`} />
                            </div>
                          ))}
                          <div className="form-group"><label>Correct Answer</label>
                            <select value={step.correct_options} onChange={e => updateStep(idx, 'correct_options', e.target.value)}>
                              {correctOptions.map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                            </select>
                          </div>
                          <div className="form-group"><label>Explanation</label>
                            <textarea value={step.explanation} onChange={e => updateStep(idx, 'explanation', e.target.value)} rows={2} placeholder="Why this answer is correct..." style={{ resize: 'vertical' }} />
                          </div>
                          <div className="form-group"><label>Difficulty</label>
                            <select value={step.difficulty} onChange={e => updateStep(idx, 'difficulty', e.target.value)}>
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        {/* Clone */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
                            Clone Question <span style={{ color: '#9090a8', fontWeight: 400, textTransform: 'none' }}>(simplified)</span>
                          </div>
                          <div className="form-group"><label>Theory (English)</label>
                            <textarea value={step.theory_card} onChange={e => updateStep(idx, 'theory_card', e.target.value)} rows={3} placeholder="Explain the concept in English..." style={{ resize: 'vertical' }} />
                          </div>
                          <div className="form-group"><label>Theory (Hinglish)</label>
                            <textarea value={step.theory_card_hinglish} onChange={e => updateStep(idx, 'theory_card_hinglish', e.target.value)} rows={3} placeholder="Hinglish mein concept explain karo..." style={{ resize: 'vertical' }} />
                          </div>
                          <div className="form-group">
                            <label>Video</label>
                            <VideoField value={step.video_url} onChange={v => updateStep(idx, 'video_url', v)} />
                          </div>
                          <div className="form-group"><label>Hint</label>
                            <textarea value={step.hint_text} onChange={e => updateStep(idx, 'hint_text', e.target.value)} rows={2} placeholder="A nudge without giving the answer..." style={{ resize: 'vertical' }} />
                          </div>
                          <div className="form-group"><label>Clone Question</label>
                            <textarea value={step.clone_question_text} onChange={e => updateStep(idx, 'clone_question_text', e.target.value)} rows={3} placeholder="Simpler version..." style={{ resize: 'vertical' }} />
                            <MathPreview value={step.clone_question_text} />
                            <ImageUploader value={step.clone_question_image_url} onChange={v => updateStep(idx, 'clone_question_image_url', v)} label="Clone Question Image" />
                          </div>
                          {['a','b','c','d'].map(opt => (
                            <div className="form-group" key={opt} style={{ marginBottom: '8px' }}>
                              <label>Option {opt.toUpperCase()}</label>
                              <input value={step[`clone_option_${opt}`]} onChange={e => updateStep(idx, `clone_option_${opt}`, e.target.value)} placeholder={`Option ${opt.toUpperCase()}`} />
                              <MathPreview value={step[`clone_option_${opt}`]} />
                              <ImageUploader value={step[`clone_option_${opt}_image_url`]} onChange={v => updateStep(idx, `clone_option_${opt}_image_url`, v)} label={`Option ${opt.toUpperCase()} Image`} />
                            </div>
                          ))}
                          <div className="form-group"><label>Correct Answer</label>
                            <select value={step.clone_correct_options} onChange={e => updateStep(idx, 'clone_correct_options', e.target.value)}>
                              {correctOptions.map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                            </select>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}><label>Explanation</label>
                            <textarea value={step.clone_explanation} onChange={e => updateStep(idx, 'clone_explanation', e.target.value)} rows={2} placeholder="Explain the clone answer..." style={{ resize: 'vertical' }} />
                          </div>
                        </div>
                      </div>

                      {idx < 7 && (
                        <div style={{ marginTop: '16px', textAlign: 'right' }}>
                          <button type="button" className="btn-ghost" style={{ fontSize: '13px' }} onClick={() => setOpenStep(step.step_number + 1)}>
                            Next Step →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Submit */}
            <div className="card" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              {loading && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#6c63ff,#22c55e)', borderRadius: '999px', width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%`, transition: 'width 0.3s' }} />
                  </div>
                  <p style={{ fontSize: '13px', color: '#9090a8' }}>Saving step {progress.current} of {progress.total}...</p>
                </div>
              )}

              {savedSetId ? (
                <div>
                  <div style={{ fontSize: '15px', color: '#22c55e', fontWeight: 700, marginBottom: '6px' }}>
                    ✓ Question set saved (ID #{savedSetId})
                  </div>
                  <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '16px' }}>
                    To edit these questions use the panel on the right. To add another set click below.
                  </p>
                  <button type="button" className="btn-primary" onClick={startNewSet} style={{ padding: '11px 32px', fontSize: '14px' }}>
                    + Add Another Question Set
                  </button>
                </div>
              ) : (
                <div>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 40px', fontSize: '15px' }}>
                    {loading ? 'Saving...' : `Save Question Set (${filledCount} questions)`}
                  </button>
                  <p style={{ fontSize: '12px', color: '#9090a8', marginTop: '10px' }}>
                    Only steps with a question filled will be saved
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        {/* ── RIGHT: Existing question sets ── */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
            Existing Question Sets
            {questionSets.length > 0 && (
              <span style={{ fontSize: '12px', color: '#9090a8', fontWeight: 400, marginLeft: '8px' }}>({questionSets.length})</span>
            )}
          </h2>

          {!selectedConceptId && (
            <div className="card" style={{ color: '#9090a8', fontSize: '13px', textAlign: 'center' }}>
              Select a concept to see existing sets
            </div>
          )}

          {selectedConceptId && questionSets.length === 0 && (
            <div className="card" style={{ color: '#9090a8', fontSize: '13px', textAlign: 'center' }}>
              No question sets yet for this concept
            </div>
          )}

          {/* ── Practice Questionnaire ── */}
          {selectedConceptId && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1rem', margin: 0 }}>Practice Questionnaire</h2>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '9999px',
                  background: practiceQuestions.length >= 10 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
                  color: practiceQuestions.length >= 10 ? '#f87171' : '#22c55e',
                }}>
                  {practiceQuestions.length}/10
                </span>
              </div>

              {/* Existing practice questions */}
              {practiceQuestions.map((pq, i) => (
                <div key={pq.id} className="card" style={{ marginBottom: '8px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(108,99,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#a5a0ff', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: '#e0e0e0', marginBottom: '4px', lineHeight: 1.4 }}><MathRenderer text={pq.question_text} /></div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['a','b','c','d'].filter(o => pq[`option_${o}`]).map(o => (
                          <span key={o} style={{
                            fontSize: '11px', padding: '1px 8px', borderRadius: '6px',
                            background: pq.correct_option === o ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                            color: pq.correct_option === o ? '#22c55e' : '#9090a8',
                            border: pq.correct_option === o ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.08)',
                            fontWeight: pq.correct_option === o ? 700 : 400,
                          }}>
                            {o.toUpperCase()}: <MathRenderer text={pq[`option_${o}`]} />
                          </span>
                        ))}
                      </div>
                      {pq.hint_text && (
                        <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>💡 {pq.hint_text}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '11px', padding: '3px 10px' }}
                        onClick={() => {
                          setEditingPq(pq.id);
                          setPqForm({ question_text: pq.question_text, option_a: pq.option_a, option_b: pq.option_b, option_c: pq.option_c || '', option_d: pq.option_d || '', correct_option: pq.correct_option, hint_text: pq.hint_text || '' });
                          setPqMsg('');
                        }}
                      >Edit</button>
                      <button
                        className="btn-ghost"
                        style={{ fontSize: '11px', padding: '3px 10px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        onClick={() => deletePracticeQuestion(pq.id)}
                      >✕</button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add / Edit form */}
              {practiceQuestions.length < 10 || editingPq ? (
                <div className="card" style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: editingPq ? '#f59e0b' : '#6c63ff', marginBottom: '12px' }}>
                    {editingPq ? '✏ Edit Practice Question' : '+ Add Practice Question'}
                  </div>
                  {pqMsg && (
                    <div className={`alert ${pqMsg.startsWith('Error') || pqMsg.startsWith('Question') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '10px', fontSize: '12px', padding: '8px 12px' }}>{pqMsg}</div>
                  )}
                  <div className="form-group">
                    <label>Question <span style={{ color: '#6c63ff', fontSize: '10px', fontWeight: 400 }}>use $...$ for math</span></label>
                    <textarea value={pqForm.question_text} onChange={e => setPq('question_text', e.target.value)} rows={3} placeholder="e.g. What is $\int x\,dx$?" style={{ resize: 'vertical' }} />
                    <MathPreview value={pqForm.question_text} />
                  </div>
                  {['a','b','c','d'].map(o => (
                    <div className="form-group" key={o} style={{ marginBottom: '7px' }}>
                      <label>Option {o.toUpperCase()} {o === 'a' || o === 'b' ? '' : <span style={{ color: '#9090a8', fontSize: '11px' }}>(optional)</span>}</label>
                      <input value={pqForm[`option_${o}`]} onChange={e => setPq(`option_${o}`, e.target.value)} placeholder={`Option ${o.toUpperCase()}`} />
                      <MathPreview value={pqForm[`option_${o}`]} />
                    </div>
                  ))}
                  <div className="form-group">
                    <label>Correct Answer</label>
                    <select value={pqForm.correct_option} onChange={e => setPq('correct_option', e.target.value)}>
                      {['a','b','c','d'].filter(o => pqForm[`option_${o}`]).map(o => (
                        <option key={o} value={o}>Option {o.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Hint <span style={{ color: '#9090a8', fontSize: '11px' }}>(shown only on wrong answer)</span></label>
                    <textarea value={pqForm.hint_text} onChange={e => setPq('hint_text', e.target.value)} rows={2} placeholder="A nudge without giving the answer..." style={{ resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '9px', fontSize: '13px' }} onClick={savePracticeQuestion} disabled={pqLoading}>
                      {pqLoading ? 'Saving...' : editingPq ? 'Update Question' : 'Add Question'}
                    </button>
                    {editingPq && (
                      <button className="btn-ghost" style={{ padding: '9px 14px', fontSize: '13px' }} onClick={() => { setEditingPq(null); setPqForm({ ...EMPTY_PQ }); setPqMsg(''); }}>Cancel</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', color: '#9090a8', fontSize: '13px', padding: '12px' }}>
                  Maximum 10 practice questions reached
                </div>
              )}
            </div>
          )}

          {/* ── Divider ── */}
          {selectedConceptId && questionSets.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '1.5rem 0 1rem', paddingTop: '1rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                Ladder Question Sets
                <span style={{ fontSize: '12px', color: '#9090a8', fontWeight: 400, marginLeft: '8px' }}>({questionSets.length})</span>
              </h2>
            </div>
          )}

          {questionSets.map(qs => (
            <div key={qs.id} className="card" style={{ marginBottom: '10px', padding: 0, overflow: 'hidden' }}>
              {/* Set header */}
              <div
                onClick={() => setExpandedSet(expandedSet === qs.id ? null : qs.id)}
                style={{
                  padding: '12px 14px', cursor: 'pointer',
                  background: expandedSet === qs.id ? 'rgba(108,99,255,0.08)' : 'transparent',
                  borderBottom: expandedSet === qs.id ? '1px solid rgba(255,255,255,0.07)' : 'none',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{qs.title}</div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {qs.level && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '1px 7px', borderRadius: '9999px',
                          color: qs.level === 'beginner' ? '#22c55e' : qs.level === 'intermediate' ? '#f59e0b' : '#ef4444',
                          background: qs.level === 'beginner' ? 'rgba(34,197,94,0.12)' : qs.level === 'intermediate' ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                          textTransform: 'capitalize',
                        }}>{qs.level}</span>
                      )}
                      {qs.question_type_category && qs.question_type_category !== 'single_correct' && (
                        <span style={{ fontSize: '10px', fontWeight: 600, padding: '1px 7px', borderRadius: '9999px', color: '#a5a0ff', background: 'rgba(108,99,255,0.12)' }}>
                          {qs.question_type_category.replace(/_/g, ' ')}
                        </span>
                      )}
                      <span style={{ fontSize: '10px', color: '#9090a8' }}>{qs.steps?.length || 0} steps · #{qs.id}</span>
                    </div>
                  </div>
                  <span style={{ color: '#9090a8' }}>{expandedSet === qs.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Steps list */}
              {expandedSet === qs.id && (
                <div style={{ padding: '8px' }}>
                  {(qs.steps || []).map(step => {
                    const isEditing = editingStep?.id === step.id;
                    const isExpanded = expandedStep?.setId === qs.id && expandedStep?.stepId === step.id;

                    return (
                      <div key={step.id} style={{
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.07)',
                        marginBottom: '6px',
                        overflow: 'hidden',
                      }}>
                        {/* Step row */}
                        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: '8px' }}>
                          <div style={{
                            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                            background: step.clone_question_text ? '#22c55e' : '#f97316',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: '#fff',
                          }}>
                            {step.step_number}
                          </div>
                          <div style={{ flex: 1, fontSize: '12px', overflow: 'hidden' }}>
                            <div style={{ color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {step.question_text || '(no question)'}
                            </div>
                            {step.concept_tag && (
                              <div style={{ fontSize: '11px', color: '#6c63ff', marginTop: '1px' }}>{step.concept_tag}</div>
                            )}
                          </div>
                          <button
                            className="btn-ghost"
                            style={{ fontSize: '11px', padding: '4px 10px', flexShrink: 0 }}
                            onClick={() => {
                              if (isEditing) {
                                setEditingStep(null);
                                setExpandedStep(null);
                              } else {
                                startEditStep(step);
                                setExpandedStep({ setId: qs.id, stepId: step.id });
                              }
                            }}
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                        </div>

                        {/* Inline edit form */}
                        {isEditing && (
                          <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.2)' }}>
                            {stepSaveMsg && (
                              <div className={`alert ${stepSaveMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '10px', padding: '8px 12px', fontSize: '12px' }}>
                                {stepSaveMsg}
                              </div>
                            )}

                            {/* Main side */}
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Main Question</div>
                            <div className="form-group"><label>Concept Tag</label>
                              <input value={editingStep.concept_tag || ''} onChange={e => setEdit('concept_tag', e.target.value)} />
                            </div>
                            <div className="form-group"><label>Question</label>
                              <textarea value={editingStep.question_text || ''} onChange={e => setEdit('question_text', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                              <ImageUploader value={editingStep.question_image_url || ''} onChange={v => setEdit('question_image_url', v)} label="Question Image" />
                            </div>
                            {['a','b','c','d'].map(opt => (
                              <div className="form-group" key={opt} style={{ marginBottom: '6px' }}>
                                <label>Option {opt.toUpperCase()}</label>
                                <input value={editingStep[`option_${opt}`] || ''} onChange={e => setEdit(`option_${opt}`, e.target.value)} />
                                <ImageUploader value={editingStep[`option_${opt}_image_url`] || ''} onChange={v => setEdit(`option_${opt}_image_url`, v)} label={`Option ${opt.toUpperCase()} Image`} />
                              </div>
                            ))}
                            <div className="form-group"><label>Correct Answer</label>
                              <select value={editingStep.correct_options || 'a'} onChange={e => setEdit('correct_options', e.target.value)}>
                                {correctOptions.map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                              </select>
                            </div>
                            <div className="form-group"><label>Explanation</label>
                              <textarea value={editingStep.explanation || ''} onChange={e => setEdit('explanation', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                            </div>

                            {/* Clone side */}
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#22c55e', marginTop: '12px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clone Question</div>
                            <div className="form-group"><label>Theory (English)</label>
                              <textarea value={editingStep.theory_card || ''} onChange={e => setEdit('theory_card', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group"><label>Theory (Hinglish)</label>
                              <textarea value={editingStep.theory_card_hinglish || ''} onChange={e => setEdit('theory_card_hinglish', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group"><label>Video</label>
                              <VideoField value={editingStep.video_url || ''} onChange={v => setEdit('video_url', v)} />
                            </div>
                            <div className="form-group"><label>Hint</label>
                              <textarea value={editingStep.hint_text || ''} onChange={e => setEdit('hint_text', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group"><label>Clone Question</label>
                              <textarea value={editingStep.clone_question_text || ''} onChange={e => setEdit('clone_question_text', e.target.value)} rows={3} style={{ resize: 'vertical' }} />
                              <ImageUploader value={editingStep.clone_question_image_url || ''} onChange={v => setEdit('clone_question_image_url', v)} label="Clone Question Image" />
                            </div>
                            {['a','b','c','d'].map(opt => (
                              <div className="form-group" key={opt} style={{ marginBottom: '6px' }}>
                                <label>Option {opt.toUpperCase()}</label>
                                <input value={editingStep[`clone_option_${opt}`] || ''} onChange={e => setEdit(`clone_option_${opt}`, e.target.value)} />
                                <ImageUploader value={editingStep[`clone_option_${opt}_image_url`] || ''} onChange={v => setEdit(`clone_option_${opt}_image_url`, v)} label={`Option ${opt.toUpperCase()} Image`} />
                              </div>
                            ))}
                            <div className="form-group"><label>Clone Correct Answer</label>
                              <select value={editingStep.clone_correct_options || 'a'} onChange={e => setEdit('clone_correct_options', e.target.value)}>
                                {correctOptions.map(o => <option key={o} value={o}>Option {o.toUpperCase()}</option>)}
                              </select>
                            </div>
                            <div className="form-group"><label>Clone Explanation</label>
                              <textarea value={editingStep.clone_explanation || ''} onChange={e => setEdit('clone_explanation', e.target.value)} rows={2} style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button className="btn-primary" style={{ flex: 1, padding: '9px' }} onClick={saveEditStep} disabled={savingStep}>
                                {savingStep ? 'Saving...' : 'Save Changes'}
                              </button>
                              <button className="btn-ghost" style={{ padding: '9px 16px' }} onClick={() => { setEditingStep(null); setExpandedStep(null); }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#9090a8' }}>Loading...</div>}>
      <QuestionsForm />
    </Suspense>
  );
}
