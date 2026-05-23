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
  { href: '/landing',   label: 'Landing Page' },
];

const SECTIONS = [
  {
    id: 'hero',
    label: 'Hero Section',
    color: '#6c63ff',
    fields: [
      { key: 'hero_badge',       label: 'Badge Text',          type: 'text' },
      { key: 'hero_h1_line1',    label: 'Heading Line 1',      type: 'text' },
      { key: 'hero_h1_line2',    label: 'Heading Line 2',      type: 'text', hint: 'First word = yellow, last word = purple' },
      { key: 'hero_sub',         label: 'Subtitle',            type: 'textarea' },
      { key: 'hero_cta_primary', label: 'Primary Button Text', type: 'text' },
      { key: 'hero_cta_secondary', label: 'Secondary Button Text', type: 'text' },
    ],
  },
  {
    id: 'features',
    label: 'Features Section',
    color: '#34d399',
    fields: [
      { key: 'features_title1', label: 'Feature 1 Title',       type: 'text' },
      { key: 'features_desc1',  label: 'Feature 1 Description', type: 'textarea' },
      { key: 'features_title2', label: 'Feature 2 Title',       type: 'text' },
      { key: 'features_desc2',  label: 'Feature 2 Description', type: 'textarea' },
      { key: 'features_title3', label: 'Feature 3 Title',       type: 'text' },
      { key: 'features_desc3',  label: 'Feature 3 Description', type: 'textarea' },
      { key: 'features_title4', label: 'Feature 4 Title',       type: 'text' },
      { key: 'features_desc4',  label: 'Feature 4 Description', type: 'textarea' },
    ],
  },
  {
    id: 'trusted',
    label: 'Trusted Section',
    color: '#f59e0b',
    fields: [
      { key: 'trusted_tagline', label: 'Tagline Text', type: 'text' },
    ],
  },
  {
    id: 'how_it_works',
    label: 'How It Works',
    color: '#60a5fa',
    fields: [
      { key: 'hiw_tag',         label: 'Section Tag',    type: 'text' },
      { key: 'hiw_h2',          label: 'Section Heading', type: 'text' },
      { key: 'hiw_desc',        label: 'Section Description', type: 'textarea' },
      { key: 'hiw_step1_title', label: 'Step 1 Title',   type: 'text' },
      { key: 'hiw_step1_desc',  label: 'Step 1 Description', type: 'textarea' },
      { key: 'hiw_step2_title', label: 'Step 2 Title',   type: 'text' },
      { key: 'hiw_step2_desc',  label: 'Step 2 Description', type: 'textarea' },
      { key: 'hiw_step3_title', label: 'Step 3 Title',   type: 'text' },
      { key: 'hiw_step3_desc',  label: 'Step 3 Description', type: 'textarea' },
      { key: 'hiw_step4_title', label: 'Step 4 Title',   type: 'text' },
      { key: 'hiw_step4_desc',  label: 'Step 4 Description', type: 'textarea' },
    ],
  },
  {
    id: 'courses',
    label: 'Courses Section',
    color: '#a78bfa',
    fields: [
      { key: 'courses_tag',  label: 'Section Tag',         type: 'text' },
      { key: 'courses_h2',   label: 'Section Heading',     type: 'text' },
      { key: 'courses_desc', label: 'Section Description', type: 'textarea' },
    ],
  },
  {
    id: 'about',
    label: 'About Us',
    color: '#f87171',
    fields: [
      { key: 'about_tag',   label: 'Section Tag',     type: 'text' },
      { key: 'about_h2',    label: 'Section Heading', type: 'text' },
      { key: 'about_para1', label: 'Paragraph 1',     type: 'textarea' },
      { key: 'about_para2', label: 'Paragraph 2',     type: 'textarea' },
    ],
  },
  {
    id: 'cta',
    label: 'CTA Section',
    color: '#f5c842',
    fields: [
      { key: 'cta_h2',   label: 'Heading',          type: 'text' },
      { key: 'cta_p',    label: 'Description',      type: 'textarea' },
      { key: 'cta_note', label: 'Note / Trust Text', type: 'text' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    color: '#9090a8',
    fields: [
      { key: 'footer_tagline', label: 'Brand Tagline', type: 'text' },
    ],
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [values, setValues]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState('');
  const [dirty, setDirty]       = useState({});
  const [openSection, setOpenSection] = useState('hero');

  useEffect(() => {
    if (!sessionStorage.getItem('adminToken')) { router.push('/'); return; }
    loadContent();
  }, []);

  const loadContent = async () => {
    setLoading(true);
    const data = await apiCall('/admin/landing-content');
    if (data.success) {
      const map = {};
      data.content.forEach(row => { map[row.key] = row.value; });
      setValues(map);
    } else {
      setError(data.error || 'Failed to load content');
    }
    setLoading(false);
  };

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setDirty(prev => ({ ...prev, [key]: true }));
    setSaved(false);
  };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    const updates = Object.keys(dirty).map(key => ({ key, value: values[key] || '' }));
    if (updates.length === 0) { setSaving(false); return; }
    const data = await apiCall('/admin/landing-content', 'PUT', { updates });
    if (data.success) {
      setSaved(true);
      setDirty({});
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(data.error || 'Save failed');
    }
    setSaving(false);
  };

  const dirtyCount = Object.keys(dirty).length;

  return (
    <div>
      <nav className="nav">
        {NAV.map(l => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none', color: l.href === '/landing' ? '#6c63ff' : '#9090a8', fontWeight: l.href === '/landing' ? 700 : 400 }}>{l.label}</a>
        ))}
        <button className="btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { sessionStorage.removeItem('adminToken'); router.push('/'); }}>Sign Out</button>
      </nav>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '4px', color: '#f0f0ff' }}>Landing Page Editor</h1>
            <p style={{ fontSize: '13px', color: '#9090a8' }}>Edit all text on the public landing page. Changes go live instantly after saving.</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {dirtyCount > 0 && (
              <span style={{ fontSize: '12px', color: '#f5c842', fontWeight: 600 }}>
                {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
              </span>
            )}
            {saved && <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>✓ Saved!</span>}
            <button
              onClick={saveAll}
              disabled={saving || dirtyCount === 0}
              style={{
                background: dirtyCount > 0 ? 'linear-gradient(135deg,#6c63ff,#8b7ff5)' : 'rgba(255,255,255,0.06)',
                color: dirtyCount > 0 ? '#fff' : '#9090a8',
                border: 'none', borderRadius: '9px', padding: '10px 24px',
                fontSize: '14px', fontWeight: 700, cursor: dirtyCount > 0 ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', color: '#f87171', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9090a8' }}>Loading content...</div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

            {/* Section nav sidebar */}
            <div style={{ width: '200px', flexShrink: 0, position: 'sticky', top: '80px' }}>
              {SECTIONS.map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setOpenSection(sec.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 14px', marginBottom: '4px', borderRadius: '8px',
                    border: openSection === sec.id ? `1px solid ${sec.color}44` : '1px solid transparent',
                    background: openSection === sec.id ? `${sec.color}14` : 'transparent',
                    color: openSection === sec.id ? '#f0f0ff' : '#9090a8',
                    fontSize: '13px', fontWeight: openSection === sec.id ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: sec.color, marginRight: '8px', verticalAlign: 'middle' }} />
                  {sec.label}
                  {Object.keys(dirty).some(k => sec.fields.some(f => f.key === k)) && (
                    <span style={{ marginLeft: '6px', fontSize: '10px', color: sec.color, fontWeight: 800 }}>●</span>
                  )}
                </button>
              ))}
            </div>

            {/* Editor panel */}
            <div style={{ flex: 1 }}>
              {SECTIONS.filter(s => s.id === openSection).map(sec => (
                <div key={sec.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                    <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: sec.color }} />
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f0ff' }}>{sec.label}</h2>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sec.fields.map(field => {
                      const isDirty = dirty[field.key];
                      return (
                        <div key={field.key} className="card" style={{ padding: '16px 20px', border: isDirty ? `1px solid ${sec.color}55` : undefined }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 700, color: isDirty ? sec.color : '#b0b8d4' }}>
                              {field.label}
                              {isDirty && <span style={{ marginLeft: '6px', fontSize: '10px', color: sec.color }}>● edited</span>}
                            </label>
                            <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>{field.key}</span>
                          </div>
                          {field.hint && (
                            <div style={{ fontSize: '11px', color: '#7070a0', marginBottom: '6px', fontStyle: 'italic' }}>{field.hint}</div>
                          )}
                          {field.type === 'textarea' ? (
                            <textarea
                              value={values[field.key] || ''}
                              onChange={e => handleChange(field.key, e.target.value)}
                              rows={3}
                              style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isDirty ? sec.color + '66' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px', padding: '10px 12px',
                                color: '#f0f0ff', fontSize: '13.5px', lineHeight: 1.6,
                                resize: 'vertical', outline: 'none', fontFamily: 'Inter, sans-serif',
                                transition: 'border-color 0.15s',
                              }}
                              onFocus={e => { e.target.style.borderColor = sec.color; }}
                              onBlur={e => { e.target.style.borderColor = isDirty ? sec.color + '66' : 'rgba(255,255,255,0.1)'; }}
                            />
                          ) : (
                            <input
                              type="text"
                              value={values[field.key] || ''}
                              onChange={e => handleChange(field.key, e.target.value)}
                              style={{
                                width: '100%', background: 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isDirty ? sec.color + '66' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px', padding: '10px 12px',
                                color: '#f0f0ff', fontSize: '13.5px',
                                outline: 'none', fontFamily: 'Inter, sans-serif',
                                transition: 'border-color 0.15s',
                              }}
                              onFocus={e => { e.target.style.borderColor = sec.color; }}
                              onBlur={e => { e.target.style.borderColor = isDirty ? sec.color + '66' : 'rgba(255,255,255,0.1)'; }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button
                      onClick={saveAll}
                      disabled={saving || dirtyCount === 0}
                      style={{
                        background: dirtyCount > 0 ? `linear-gradient(135deg,${sec.color},${sec.color}cc)` : 'rgba(255,255,255,0.06)',
                        color: dirtyCount > 0 ? '#fff' : '#9090a8',
                        border: 'none', borderRadius: '9px', padding: '10px 24px',
                        fontSize: '14px', fontWeight: 700, cursor: dirtyCount > 0 ? 'pointer' : 'default',
                      }}
                    >
                      {saving ? 'Saving...' : `Save Changes${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
                    </button>
                    {saved && <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600, alignSelf: 'center' }}>✓ All changes saved!</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
