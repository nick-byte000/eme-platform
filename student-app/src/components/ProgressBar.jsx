'use client';

export default function ProgressBar({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9090a8', marginBottom: '6px' }}>
        <span>Step {current} of {total}</span>
        <span>{pct}% complete</span>
      </div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="step-dots" style={{ marginTop: '10px' }}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const cls = step < current ? 'completed' : step === current ? 'current' : '';
          return (
            <div key={step} className={`step-dot ${cls}`}>
              {step < current ? '✓' : step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
