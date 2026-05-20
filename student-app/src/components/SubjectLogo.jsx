'use client';

function PhysicsAtom() {
  return (
    <>
      <style>{`
        @keyframes subphy-float-a { 0%,100%{transform:translateY(0) rotate(-8deg);opacity:.55} 50%{transform:translateY(-7px) rotate(4deg);opacity:.9} }
        @keyframes subphy-float-b { 0%,100%{transform:translateY(0) rotate(6deg);opacity:.4} 50%{transform:translateY(-9px) rotate(-4deg);opacity:.75} }
        @keyframes subphy-float-c { 0%,100%{transform:translateY(0) rotate(-4deg);opacity:.5} 50%{transform:translateY(-5px) rotate(8deg);opacity:.85} }
        @keyframes subphy-float-d { 0%,100%{transform:translateY(0);opacity:.35} 50%{transform:translateY(-6px);opacity:.7} }
      `}</style>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg width="80" height="80" viewBox="-50 -50 100 100">
          <defs>
            <radialGradient id="sphy-ng" cx="38%" cy="32%">
              <stop offset="0%" stopColor="#d4d0ff" />
              <stop offset="60%" stopColor="#6c63ff" />
              <stop offset="100%" stopColor="#4438ca" />
            </radialGradient>
            <radialGradient id="sphy-eg" cx="35%" cy="30%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#a5a0ff" />
            </radialGradient>
            <filter id="sphy-glow" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <circle cx="0" cy="0" r="13" fill="rgba(108,99,255,0.15)">
            <animate attributeName="r" values="12;17;12" dur="2.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.15;0.06;0.15" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <g>
            <ellipse cx="0" cy="0" rx="42" ry="15" fill="none" stroke="rgba(108,99,255,0.38)" strokeWidth="1.2" />
            <circle r="5" fill="url(#sphy-eg)" filter="url(#sphy-glow)">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
            </circle>
          </g>
          <g transform="rotate(60)">
            <ellipse cx="0" cy="0" rx="42" ry="15" fill="none" stroke="rgba(99,180,255,0.35)" strokeWidth="1.2" />
            <circle r="5" fill="url(#sphy-eg)" filter="url(#sphy-glow)">
              <animateMotion dur="4.4s" repeatCount="indefinite" path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
            </circle>
          </g>
          <g transform="rotate(120)">
            <ellipse cx="0" cy="0" rx="42" ry="15" fill="none" stroke="rgba(180,99,255,0.35)" strokeWidth="1.2" />
            <circle r="5" fill="url(#sphy-eg)" filter="url(#sphy-glow)">
              <animateMotion dur="5.8s" repeatCount="indefinite" path="M42,0 A42,15 0 0,1 -42,0 A42,15 0 0,1 42,0" />
            </circle>
          </g>
          <circle cx="0" cy="0" r="11" fill="url(#sphy-ng)" filter="url(#sphy-glow)">
            <animate attributeName="r" values="10;12;10" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="-3.5" cy="-2" r="2.8" fill="rgba(255,255,255,0.55)" />
          <circle cx="3" cy="2" r="2.2" fill="rgba(255,255,255,0.4)" />
          <circle cx="0.5" cy="-4" r="1.8" fill="rgba(255,255,255,0.3)" />
        </svg>
        <span style={{ position: 'absolute', top: '4px', right: '-2px', fontSize: '10px', fontStyle: 'italic', fontWeight: 700, color: '#a5a0ff', animation: 'subphy-float-a 3.2s ease-in-out infinite' }}>F</span>
        <span style={{ position: 'absolute', top: '8px', left: '-4px', fontSize: '9px', fontStyle: 'italic', fontWeight: 700, color: '#7cc8ff', animation: 'subphy-float-b 4.5s ease-in-out infinite 0.5s' }}>E</span>
        <span style={{ position: 'absolute', bottom: '6px', left: '2px', fontSize: '10px', fontStyle: 'italic', fontWeight: 700, color: '#c084fc', animation: 'subphy-float-c 5s ease-in-out infinite 1s' }}>λ</span>
        <span style={{ position: 'absolute', bottom: '10px', right: '0px', fontSize: '9px', fontStyle: 'italic', fontWeight: 600, color: '#a5a0ff', animation: 'subphy-float-d 3.8s ease-in-out infinite 0.8s' }}>v</span>
      </div>
    </>
  );
}

function ChemistryMolecule() {
  return (
    <>
      <style>{`
        @keyframes chem-bond { 0%,100%{stroke-dashoffset:0} 50%{stroke-dashoffset:6} }
        @keyframes chem-pulse { 0%,100%{r:9;opacity:.9} 50%{r:10.5;opacity:1} }
        @keyframes chem-pulse2 { 0%,100%{r:7;opacity:.8} 50%{r:8.5;opacity:1} }
      `}</style>
      <svg width="80" height="80" viewBox="-40 -40 80 80">
        <defs>
          <radialGradient id="chem-g1" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="100%" stopColor="#10b981" />
          </radialGradient>
          <radialGradient id="chem-g2" cx="35%" cy="30%">
            <stop offset="0%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#059669" />
          </radialGradient>
          <filter id="chem-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Bonds */}
        <line x1="0" y1="0" x2="-22" y2="-20" stroke="rgba(16,185,129,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="7" dur="1.2s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="0" x2="24" y2="-16" stroke="rgba(16,185,129,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="7" dur="1.6s" repeatCount="indefinite" />
        </line>
        <line x1="0" y1="0" x2="0" y2="24" stroke="rgba(16,185,129,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3">
          <animate attributeName="stroke-dashoffset" from="0" to="7" dur="2s" repeatCount="indefinite" />
        </line>
        {/* Atoms */}
        <circle cx="0" cy="0" r="9" fill="url(#chem-g1)" filter="url(#chem-glow)">
          <animate attributeName="r" values="9;10.5;9" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="700" fill="white">C</text>
        <circle cx="-22" cy="-20" r="7" fill="url(#chem-g2)" filter="url(#chem-glow)">
          <animate attributeName="r" values="7;8.5;7" dur="2.4s" repeatCount="indefinite" />
        </circle>
        <text x="-22" y="-16" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">H</text>
        <circle cx="24" cy="-16" r="7" fill="url(#chem-g2)" filter="url(#chem-glow)">
          <animate attributeName="r" values="7;8;7" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <text x="24" y="-12" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">O</text>
        <circle cx="0" cy="24" r="6" fill="url(#chem-g2)" filter="url(#chem-glow)">
          <animate attributeName="r" values="6;7.5;6" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <text x="0" y="28" textAnchor="middle" fontSize="8" fontWeight="700" fill="white">N</text>
      </svg>
    </>
  );
}

function MathematicsSymbol() {
  return (
    <>
      <style>{`
        @keyframes math-float1 { 0%,100%{transform:translateY(0) rotate(-5deg);opacity:.6} 50%{transform:translateY(-8px) rotate(5deg);opacity:1} }
        @keyframes math-float2 { 0%,100%{transform:translateY(0) rotate(4deg);opacity:.5} 50%{transform:translateY(-10px) rotate(-4deg);opacity:.9} }
        @keyframes math-float3 { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-6px);opacity:.8} }
        @keyframes math-float4 { 0%,100%{transform:translateY(0) rotate(-3deg);opacity:.5} 50%{transform:translateY(-9px) rotate(6deg);opacity:.85} }
      `}</style>
      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="50" height="60" viewBox="0 0 50 60">
          <defs>
            <linearGradient id="math-g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="math-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Integral symbol */}
          <path d="M28,4 Q35,4 33,12 L22,48 Q20,56 27,56" fill="none" stroke="url(#math-g)" strokeWidth="3.5" strokeLinecap="round" filter="url(#math-glow)">
            <animate attributeName="stroke-dasharray" values="0,200;200,0;200,0" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>
        <span style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '14px', fontWeight: 900, color: '#93c5fd', animation: 'math-float1 3.5s ease-in-out infinite' }}>π</span>
        <span style={{ position: 'absolute', top: '10px', left: '4px', fontSize: '12px', fontWeight: 900, color: '#60a5fa', animation: 'math-float2 4.2s ease-in-out infinite 0.5s' }}>√</span>
        <span style={{ position: 'absolute', bottom: '8px', right: '4px', fontSize: '13px', fontWeight: 900, color: '#3b82f6', animation: 'math-float3 5s ease-in-out infinite 1s' }}>dx</span>
        <span style={{ position: 'absolute', bottom: '4px', left: '2px', fontSize: '11px', fontWeight: 900, color: '#93c5fd', animation: 'math-float4 3.8s ease-in-out infinite 0.8s' }}>∞</span>
      </div>
    </>
  );
}

function BotanyLeaf() {
  return (
    <>
      <style>{`
        @keyframes leaf-sway { 0%,100%{transform:rotate(-5deg);transform-origin:bottom center} 50%{transform:rotate(5deg);transform-origin:bottom center} }
        @keyframes leaf-pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
      <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="64" height="72" viewBox="-32 -36 64 72">
          <defs>
            <radialGradient id="bot-g" cx="40%" cy="30%">
              <stop offset="0%" stopColor="#86efac" />
              <stop offset="100%" stopColor="#16a34a" />
            </radialGradient>
            <filter id="bot-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <g style={{ animation: 'leaf-sway 3s ease-in-out infinite' }}>
            {/* Leaf */}
            <path d="M0,30 Q-24,-10 0,-34 Q24,-10 0,30Z" fill="url(#bot-g)" filter="url(#bot-glow)" opacity="0.9" />
            {/* Veins */}
            <line x1="0" y1="28" x2="0" y2="-32" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
            <line x1="0" y1="10" x2="-14" y2="-4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="10" x2="14" y2="-4" stroke="rgba(255,255,255,0.3)" strokeWidth="0.9">
              <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2.5s" repeatCount="indefinite" begin="0.5s" />
            </line>
            <line x1="0" y1="-6" x2="-12" y2="-18" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8">
              <animate attributeName="opacity" values="0.25;0.5;0.25" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="0" y1="-6" x2="12" y2="-18" stroke="rgba(255,255,255,0.25)" strokeWidth="0.8">
              <animate attributeName="opacity" values="0.25;0.5;0.25" dur="3s" repeatCount="indefinite" begin="0.8s" />
            </line>
          </g>
          {/* Stem */}
          <path d="M0,30 Q4,36 2,36" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </>
  );
}

function ZoologyDna() {
  return (
    <>
      <style>{`
        @keyframes dna-scroll { from{stroke-dashoffset:0} to{stroke-dashoffset:-40} }
        @keyframes dna-glow { 0%,100%{opacity:.6} 50%{opacity:1} }
      `}</style>
      <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="44" height="72" viewBox="0 0 44 72">
          <defs>
            <linearGradient id="zoo-g1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fcd34d" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="zoo-g2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
          {/* Left strand */}
          <path d="M6,4 Q20,12 6,24 Q20,36 6,48 Q20,60 6,72" fill="none" stroke="url(#zoo-g1)" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="8 4;4 8;8 4" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Right strand */}
          <path d="M38,4 Q24,12 38,24 Q24,36 38,48 Q24,60 38,72" fill="none" stroke="url(#zoo-g2)" strokeWidth="2.5" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="4 8;8 4;4 8" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Base pairs */}
          {[14, 28, 42, 56].map((y, i) => (
            <line key={i} x1="8" y1={y} x2="36" y2={y} stroke="rgba(245,158,11,0.55)" strokeWidth="1.8" strokeLinecap="round">
              <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" begin={`${i * 0.2}s`} />
            </line>
          ))}
          {/* Nodes */}
          {[14, 28, 42, 56].map((y, i) => (
            <g key={`n${i}`}>
              <circle cx="8" cy={y} r="3" fill="#f59e0b" style={{ animation: 'dna-glow 1.5s ease-in-out infinite' }} />
              <circle cx="36" cy={y} r="3" fill="#fbbf24" style={{ animation: `dna-glow ${1.5 + i * 0.2}s ease-in-out infinite` }} />
            </g>
          ))}
        </svg>
      </div>
    </>
  );
}

export default function SubjectLogo({ subject }) {
  switch (subject) {
    case 'Physics':     return <PhysicsAtom />;
    case 'Chemistry':   return <ChemistryMolecule />;
    case 'Mathematics': return <MathematicsSymbol />;
    case 'Botany':      return <BotanyLeaf />;
    case 'Zoology':     return <ZoologyDna />;
    default:            return <PhysicsAtom />;
  }
}
