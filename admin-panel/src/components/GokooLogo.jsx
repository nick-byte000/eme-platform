'use client';

export default function GokooLogo({ size = 'md', dark = false }) {
  const scale = size === 'sm' ? 0.7 : size === 'lg' ? 1.3 : 1;
  const iconSize = Math.round(42 * scale);
  const nameSize = Math.round(18 * scale);
  const infSize = Math.round(28 * scale);
  const subSize = Math.round(8.5 * scale);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(10 * scale) + 'px', textDecoration: 'none' }}>
      <div style={{
        width: iconSize, height: iconSize, borderRadius: Math.round(12 * scale),
        background: 'linear-gradient(135deg, #6c5ce7, #8b7ff5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(11 * scale), fontWeight: 900, color: '#fff',
        letterSpacing: '-0.5px', position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        <span style={{ position: 'relative', zIndex: 1 }}>G∞</span>
        <span style={{
          position: 'absolute', fontSize: Math.round(22 * scale), fontWeight: 900,
          color: 'rgba(255,255,255,0.15)', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', userSelect: 'none',
        }}>∞</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: nameSize, fontWeight: 800, color: dark ? '#ffffff' : '#1a1035', letterSpacing: '-0.3px', lineHeight: 1 }}>
          Gok<span style={{ color: '#f5c842', fontSize: infSize, lineHeight: 0.7, verticalAlign: 'middle' }}>∞</span>
        </span>
        <span style={{ fontSize: subSize, fontWeight: 600, color: dark ? 'rgba(255,255,255,0.5)' : '#8888aa', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>
          Goal of Infinity Knowledge
        </span>
      </div>
    </div>
  );
}
