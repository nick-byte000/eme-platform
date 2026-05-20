'use client';
import { useState } from 'react';

export default function RemediationPanel({ step, onHintOpened, onVideoWatched, onTheoryOpened }) {
  const [showHint, setShowHint] = useState(false);
  const [showTheory, setShowTheory] = useState(false);

  const handleHint = () => {
    setShowHint(true);
    onHintOpened?.();
  };

  const handleTheory = () => {
    setShowTheory(true);
    onTheoryOpened?.();
  };

  const handleVideo = () => {
    onVideoWatched?.();
    window.open(step.video_url, '_blank');
  };

  return (
    <div className="remediation">
      <h4>Need Help?</h4>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {step.hint_text && (
          <button onClick={handleHint} className="btn-ghost" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Hint
          </button>
        )}
        {step.theory_card && (
          <button onClick={handleTheory} className="btn-ghost" style={{ fontSize: '13px', padding: '6px 14px' }}>
            Theory
          </button>
        )}
        {step.video_url && (
          <button onClick={handleVideo} className="btn-ghost" style={{ fontSize: '13px', padding: '6px 14px', color: '#f43f5e' }}>
            Watch Video
          </button>
        )}
      </div>

      {showHint && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: '#a5a0ff', marginBottom: '4px', fontWeight: 600 }}>HINT</div>
          <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.6 }}>{step.hint_text}</div>
        </div>
      )}

      {showTheory && (
        <div>
          <div style={{ fontSize: '12px', color: '#a5a0ff', marginBottom: '4px', fontWeight: 600 }}>THEORY</div>
          <div style={{ fontSize: '14px', color: '#e0e0e0', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{step.theory_card}</div>
        </div>
      )}
    </div>
  );
}
