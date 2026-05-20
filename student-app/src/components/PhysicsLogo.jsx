'use client';

export default function PhysicsLogo() {
  return (
    <>
      <style>{`
        @keyframes phy-float-a {
          0%, 100% { transform: translateY(0px) rotate(-8deg); opacity: 0.55; }
          50% { transform: translateY(-7px) rotate(4deg); opacity: 0.9; }
        }
        @keyframes phy-float-b {
          0%, 100% { transform: translateY(0px) rotate(6deg); opacity: 0.4; }
          50% { transform: translateY(-9px) rotate(-4deg); opacity: 0.75; }
        }
        @keyframes phy-float-c {
          0%, 100% { transform: translateY(0px) rotate(-4deg); opacity: 0.5; }
          50% { transform: translateY(-5px) rotate(8deg); opacity: 0.85; }
        }
        @keyframes phy-float-d {
          0%, 100% { transform: translateY(0px); opacity: 0.35; }
          50% { transform: translateY(-6px); opacity: 0.7; }
        }
        @keyframes phy-nucleus-pulse {
          0%, 100% { opacity: 0.12; r: 13; }
          50% { opacity: 0.22; r: 17; }
        }
        @keyframes phy-wave-move {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -28; }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', userSelect: 'none' }}>

        {/* ── Atom SVG ── */}
        <div style={{ position: 'relative', width: '96px', height: '96px', flexShrink: 0 }}>
          <svg width="96" height="96" viewBox="-50 -50 100 100">
            <defs>
              <radialGradient id="phy-ng" cx="38%" cy="32%">
                <stop offset="0%" stopColor="#d4d0ff" />
                <stop offset="60%" stopColor="#6c63ff" />
                <stop offset="100%" stopColor="#4438ca" />
              </radialGradient>
              <radialGradient id="phy-eg" cx="35%" cy="30%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#a5a0ff" />
              </radialGradient>
              <filter id="phy-glow" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="2.8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="phy-soft" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Nucleus aura */}
            <circle cx="0" cy="0" r="13" fill="rgba(108,99,255,0.15)">
              <animate attributeName="r" values="12;17;12" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;0.06;0.15" dur="2.4s" repeatCount="indefinite" />
            </circle>

            {/* Orbit 1 — 0° */}
            <g>
              <ellipse cx="0" cy="0" rx="42" ry="15"
                fill="none" stroke="rgba(108,99,255,0.38)" strokeWidth="1.2" />
              <circle r="5" fill="url(#phy-eg)" filter="url(#phy-glow)">
                <animateMotion dur="3.2s" repeatCount="indefinite"
                  path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
              </circle>
            </g>

            {/* Orbit 2 — 60° */}
            <g transform="rotate(60)">
              <ellipse cx="0" cy="0" rx="42" ry="15"
                fill="none" stroke="rgba(99,180,255,0.35)" strokeWidth="1.2" />
              <circle r="5" fill="url(#phy-eg)" filter="url(#phy-glow)">
                <animateMotion dur="4.4s" repeatCount="indefinite"
                  path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
              </circle>
            </g>

            {/* Orbit 3 — 120° */}
            <g transform="rotate(120)">
              <ellipse cx="0" cy="0" rx="42" ry="15"
                fill="none" stroke="rgba(180,99,255,0.35)" strokeWidth="1.2" />
              <circle r="5" fill="url(#phy-eg)" filter="url(#phy-glow)">
                <animateMotion dur="5.8s" repeatCount="indefinite"
                  path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
              </circle>
            </g>

            {/* Nucleus */}
            <circle cx="0" cy="0" r="11" fill="url(#phy-ng)" filter="url(#phy-glow)">
              <animate attributeName="r" values="10;12;10" dur="2.4s" repeatCount="indefinite" />
            </circle>
            {/* Proton marks */}
            <circle cx="-3.5" cy="-2" r="2.8" fill="rgba(255,255,255,0.55)" />
            <circle cx="3" cy="2" r="2.2" fill="rgba(255,255,255,0.4)" />
            <circle cx="0.5" cy="-4" r="1.8" fill="rgba(255,255,255,0.3)" />
          </svg>

          {/* Floating physics symbols */}
          <span style={{ position: 'absolute', top: '4px', right: '-2px', fontSize: '11px', fontStyle: 'italic', fontWeight: 700, color: '#a5a0ff', animation: 'phy-float-a 3.2s ease-in-out infinite' }}>F</span>
          <span style={{ position: 'absolute', top: '8px', left: '-4px', fontSize: '10px', fontStyle: 'italic', fontWeight: 700, color: '#7cc8ff', animation: 'phy-float-b 4.5s ease-in-out infinite 0.5s' }}>E</span>
          <span style={{ position: 'absolute', bottom: '6px', left: '2px', fontSize: '11px', fontStyle: 'italic', fontWeight: 700, color: '#c084fc', animation: 'phy-float-c 5s ease-in-out infinite 1s' }}>λ</span>
          <span style={{ position: 'absolute', bottom: '10px', right: '0px', fontSize: '10px', fontStyle: 'italic', fontWeight: 600, color: '#a5a0ff', animation: 'phy-float-d 3.8s ease-in-out infinite 0.8s' }}>v</span>
        </div>

        {/* ── Text ── */}
        <div>
          <div style={{
            fontSize: '2.6rem',
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #c4c0ff 0%, #6c63ff 35%, #8b5cf6 65%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            PHYSICS
          </div>

          {/* Animated sine wave */}
          <svg width="148" height="14" viewBox="0 0 148 14" style={{ display: 'block', margin: '3px 0' }}>
            <defs>
              <linearGradient id="phy-wg" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(108,99,255,0)" />
                <stop offset="25%" stopColor="rgba(108,99,255,0.7)" />
                <stop offset="75%" stopColor="rgba(192,132,252,0.7)" />
                <stop offset="100%" stopColor="rgba(192,132,252,0)" />
              </linearGradient>
            </defs>
            <path
              d="M0,7 Q9,1 18,7 Q27,13 36,7 Q45,1 54,7 Q63,13 72,7 Q81,1 90,7 Q99,13 108,7 Q117,1 126,7 Q135,13 144,7 Q146,6 148,7"
              fill="none"
              stroke="url(#phy-wg)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="7 5"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="0.9s" repeatCount="indefinite" />
            </path>
          </svg>

        </div>
      </div>
    </>
  );
}
