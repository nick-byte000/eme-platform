'use client';
import { useState } from 'react';

export default function ImageUploader({ value, onChange, label = 'Image' }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [imgError, setImgError] = useState(false);

  const apply = () => {
    const url = draft.trim();
    if (url) { onChange(url); setImgError(false); }
    setOpen(false);
    setDraft('');
  };

  const clear = () => { onChange(''); setImgError(false); setOpen(false); setDraft(''); };

  if (value) {
    return (
      <div style={{ marginTop: '6px' }}>
        {!imgError ? (
          <img
            src={value}
            alt={label}
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%', maxHeight: '160px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', display: 'block' }}
          />
        ) : (
          <div style={{ padding: '8px 12px', fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px' }}>
            ⚠ Could not load image — check the URL
          </div>
        )}
        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
          <button type="button" onClick={() => { setDraft(value); setOpen(true); }}
            style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '6px', color: '#a5a0ff', cursor: 'pointer' }}>
            Change URL
          </button>
          <button type="button" onClick={clear}
            style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }}>
            Remove
          </button>
        </div>
        {open && <UrlInput draft={draft} setDraft={setDraft} apply={apply} cancel={() => { setOpen(false); setDraft(''); }} />}
      </div>
    );
  }

  return (
    <div style={{ marginTop: '6px' }}>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '7px', color: '#9090a8', cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(108,99,255,0.5)'; e.currentTarget.style.color = '#a5a0ff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#9090a8'; }}>
          🔗 Add {label} URL
        </button>
      ) : (
        <UrlInput draft={draft} setDraft={setDraft} apply={apply} cancel={() => { setOpen(false); setDraft(''); }} />
      )}
    </div>
  );
}

function UrlInput({ draft, setDraft, apply, cancel }) {
  return (
    <div style={{ marginTop: '6px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: '#a5a0ff', fontWeight: 600, marginBottom: '6px' }}>Paste Cloudinary (or any image) URL</div>
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') cancel(); }}
        placeholder="https://res.cloudinary.com/..."
        style={{ width: '100%', marginBottom: '8px', fontSize: '12px', fontFamily: 'monospace' }}
      />
      {draft.trim() && (
        <img src={draft.trim()} alt="preview" onError={e => e.currentTarget.style.display = 'none'}
          style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '6px', marginBottom: '8px', display: 'block', border: '1px solid rgba(255,255,255,0.1)' }} />
      )}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button type="button" onClick={apply} disabled={!draft.trim()}
          style={{ fontSize: '12px', padding: '5px 14px', background: draft.trim() ? 'rgba(108,99,255,0.25)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(108,99,255,0.4)', borderRadius: '6px', color: draft.trim() ? '#a5a0ff' : '#7070a0', cursor: draft.trim() ? 'pointer' : 'default' }}>
          ✓ Use this image
        </button>
        <button type="button" onClick={cancel}
          style={{ fontSize: '12px', padding: '5px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#9090a8', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
