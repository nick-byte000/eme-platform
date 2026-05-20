'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCall } from '../../src/lib/api';

const EMPTY = { chapter_name: '', subject: 'Physics', topics: [], subtopics: [], sort_order: 0 };

const Chip = ({ label, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)',
    borderRadius: '9999px', padding: '3px 10px 3px 12px',
    fontSize: '12px', color: '#c4c0ff', margin: '3px',
  }}>
    {label}
    <button
      onClick={onRemove}
      style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0 }}
    >×</button>
  </span>
);

const TagInput = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  };

  const remove = (i) => onChange(values.filter((_, idx) => idx !== i));

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: '36px', marginBottom: '6px' }}>
        {values.map((v, i) => <Chip key={i} label={v} onRemove={() => remove(i)} />)}
        {values.length === 0 && <span style={{ fontSize: '12px', color: '#9090a8', padding: '6px 4px' }}>None added yet</span>}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          style={{ flex: 1, fontSize: '13px' }}
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          style={{
            padding: '6px 14px', fontSize: '12px', fontWeight: 600,
            background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)',
            borderRadius: '6px', color: '#a5a0ff', cursor: 'pointer',
          }}
        >+ Add</button>
      </div>
    </div>
  );
};

export default function LibraryPage() {
  const router = useRouter();
  const [chapters, setChapters] = useState([]);
  const [selected, setSelected] = useState(null);   // chapter being edited (or null = new)
  const [form, setForm] = useState({ ...EMPTY });
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) router.push('/');
    load();
  }, []);

  const load = async () => {
    const data = await apiCall('/admin/library');
    if (data.success) setChapters(data.chapters || []);
  };

  const selectChapter = (ch) => {
    setSelected(ch);
    setIsNew(false);
    setForm({
      chapter_name: ch.chapter_name,
      subject: ch.subject,
      topics: ch.topics || [],
      subtopics: ch.subtopics || [],
      sort_order: ch.sort_order || 0,
    });
    setMessage('');
  };

  const startNew = () => {
    setSelected(null);
    setIsNew(true);
    setForm({ ...EMPTY });
    setMessage('');
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.chapter_name.trim()) { setMessage('Chapter name is required'); return; }
    setSaving(true);
    setMessage('');
    let data;
    if (isNew) {
      data = await apiCall('/admin/library', 'POST', form);
    } else {
      data = await apiCall(`/admin/library/${selected.id}`, 'PUT', form);
    }
    setSaving(false);
    if (data.success) {
      setMessage('✓ Saved');
      await load();
      if (isNew) {
        setIsNew(false);
        setSelected(data.chapter);
      }
    } else {
      setMessage('Error: ' + (data.error || 'Failed'));
    }
  };

  const deleteChapter = async (id) => {
    await apiCall(`/admin/library/${id}`, 'DELETE');
    setDeleteConfirm(null);
    if (selected?.id === id) { setSelected(null); setIsNew(false); setForm({ ...EMPTY }); }
    load();
  };

  const filtered = chapters.filter(ch =>
    ch.chapter_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <nav className="nav">
        <a href="/dashboard" style={{ textDecoration: 'none', color: '#9090a8' }}>Dashboard</a>
        <a href="/courses" style={{ textDecoration: 'none', color: '#9090a8' }}>Courses</a>
        <a href="/concepts" style={{ textDecoration: 'none', color: '#9090a8' }}>Concepts</a>
        <a href="/questions" style={{ textDecoration: 'none', color: '#9090a8' }}>Questions</a>
        <a href="/library" style={{ textDecoration: 'none', color: '#6c63ff' }}>Library</a>
        <a href="/students" style={{ textDecoration: 'none', color: '#9090a8' }}>Students</a>
        <a href="/revenue" style={{ textDecoration: 'none', color: '#9090a8' }}>Revenue</a>
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { localStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── LEFT: Chapter tree ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Topic Library
              <span style={{ fontSize: '12px', color: '#9090a8', fontWeight: 400, marginLeft: '8px' }}>({chapters.length})</span>
            </h1>
            <button className="btn-primary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={startNew}>
              + New Chapter
            </button>
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chapters..."
            style={{ width: '100%', marginBottom: '10px', fontSize: '13px' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map(ch => (
              <div
                key={ch.id}
                onClick={() => selectChapter(ch)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: selected?.id === ch.id ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: selected?.id === ch.id ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (selected?.id !== ch.id) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { if (selected?.id !== ch.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              >
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{ch.chapter_name}</div>
                <div style={{ fontSize: '11px', color: '#9090a8', marginTop: '3px' }}>
                  {(ch.topics || []).length} topics · {(ch.subtopics || []).length} subtopics
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9090a8', fontSize: '13px', padding: '1.5rem' }}>
                {search ? 'No chapters match' : 'No chapters yet'}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor ── */}
        <div>
          {!selected && !isNew ? (
            <div className="card" style={{ textAlign: 'center', color: '#9090a8', padding: '4rem 2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📚</div>
              <div style={{ fontWeight: 600, marginBottom: '6px' }}>Select a chapter to edit</div>
              <div style={{ fontSize: '13px' }}>or click "+ New Chapter" to add one</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                  {isNew ? 'New Chapter' : 'Edit Chapter'}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {!isNew && deleteConfirm !== selected?.id && (
                    <button
                      style={{ fontSize: '12px', padding: '6px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => setDeleteConfirm(selected?.id)}
                    >
                      Delete Chapter
                    </button>
                  )}
                  {!isNew && deleteConfirm === selected?.id && (
                    <>
                      <button
                        style={{ fontSize: '12px', padding: '6px 12px', background: '#ef4444', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => deleteChapter(selected.id)}
                      >
                        Confirm Delete
                      </button>
                      <button className="btn-ghost" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={() => setDeleteConfirm(null)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>

              {message && (
                <div className={`alert ${message.startsWith('Error') ? 'alert-error' : 'alert-success'}`} style={{ marginBottom: '1rem' }}>
                  {message}
                </div>
              )}

              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px', gap: '12px', marginBottom: '0' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Chapter Name</label>
                    <input
                      value={form.chapter_name}
                      onChange={e => set('chapter_name', e.target.value)}
                      placeholder="e.g. Newton's Laws of Motion"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Subject</label>
                    <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Physics" />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Order</label>
                    <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} min="0" />
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Topics
                  <span style={{ fontWeight: 400, color: '#9090a8', textTransform: 'none', marginLeft: '8px' }}>({form.topics.length}) — shown in concept dropdowns</span>
                </div>
                <TagInput
                  values={form.topics}
                  onChange={v => set('topics', v)}
                  placeholder="Type a topic and press Enter or + Add"
                />
              </div>

              {/* Subtopics */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Subtopics
                  <span style={{ fontWeight: 400, color: '#9090a8', textTransform: 'none', marginLeft: '8px' }}>({form.subtopics.length}) — used as concept names</span>
                </div>
                <TagInput
                  values={form.subtopics}
                  onChange={v => set('subtopics', v)}
                  placeholder="Type a subtopic and press Enter or + Add"
                />
              </div>

              {/* Preview */}
              {(form.topics.length > 0 || form.subtopics.length > 0) && (
                <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(108,99,255,0.04)' }}>
                  <div style={{ fontSize: '11px', color: '#9090a8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Preview — how it appears in the Concept form
                  </div>
                  <div style={{ fontSize: '13px', color: '#c4c0ff', fontWeight: 600, marginBottom: '6px' }}>{form.chapter_name || 'Chapter name'}</div>
                  {form.topics.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#9090a8', marginBottom: '4px' }}>
                      Topics: {form.topics.join(', ')}
                    </div>
                  )}
                  {form.subtopics.length > 0 && (
                    <div style={{ fontSize: '12px', color: '#9090a8' }}>
                      Subtopics: {form.subtopics.slice(0, 5).join(', ')}{form.subtopics.length > 5 ? ` +${form.subtopics.length - 5} more` : ''}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={save}
                disabled={saving}
                style={{ width: '100%', padding: '13px', fontSize: '15px' }}
              >
                {saving ? 'Saving...' : isNew ? 'Create Chapter →' : 'Save Changes ✓'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
