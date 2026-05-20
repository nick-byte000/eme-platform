'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent, saveAuth } from '../../src/lib/auth';

const THEMES = {
  Physics: {
    primary: '#818cf8', secondary: '#a78bfa', bg1: '#0a0820', bg2: '#14103a',
    glow: 'rgba(129,140,248,0.22)', border: 'rgba(129,140,248,0.28)',
    gradient: 'linear-gradient(135deg,#0a0820 0%,#14103a 40%,#0f0c2e 70%,#1a0f40 100%)',
    icon: '⚛',
    symbols: [
      { t:'F=ma',   x:'3%',  y:'8%',  s:16, d:0,    dur:7.2 },
      { t:'E=mc²',  x:'88%', y:'12%', s:14, d:1.2,  dur:9.1 },
      { t:'λ',      x:'6%',  y:'28%', s:28, d:0.5,  dur:8.3 },
      { t:'∇×B',   x:'91%', y:'22%', s:15, d:2.1,  dur:6.4 },
      { t:'ℏ',      x:'2%',  y:'50%', s:24, d:0.9,  dur:10  },
      { t:'v=λf',  x:'93%', y:'48%', s:13, d:1.6,  dur:7.8 },
      { t:'∫F·ds', x:'5%',  y:'68%', s:14, d:0.4,  dur:9.2 },
      { t:'Ω',      x:'89%', y:'70%', s:22, d:1.9,  dur:8.1 },
      { t:'⚡',     x:'4%',  y:'85%', s:20, d:0.7,  dur:6.9 },
      { t:'∇²ψ',   x:'87%', y:'88%', s:13, d:2.3,  dur:7.5 },
      { t:'p=mv',  x:'48%', y:'4%',  s:13, d:1.1,  dur:8.6 },
      { t:'e⁻',    x:'15%', y:'40%', s:18, d:0.3,  dur:11  },
      { t:'τ',      x:'80%', y:'38%', s:20, d:1.4,  dur:7   },
      { t:'α',      x:'30%', y:'92%', s:22, d:2.0,  dur:8.4 },
      { t:'γ',      x:'65%', y:'90%', s:18, d:0.6,  dur:9.7 },
    ],
  },
  Chemistry: {
    primary: '#34d399', secondary: '#6ee7b7', bg1: '#041510', bg2: '#072a1a',
    glow: 'rgba(52,211,153,0.22)', border: 'rgba(52,211,153,0.28)',
    gradient: 'linear-gradient(135deg,#041510 0%,#072a1a 40%,#051a10 70%,#0a3020 100%)',
    icon: '⬡',
    symbols: [
      { t:'H₂O',      x:'3%',  y:'8%',  s:16, d:0,    dur:7.2 },
      { t:'CH₄',      x:'88%', y:'12%', s:15, d:1.2,  dur:9.1 },
      { t:'⬡',        x:'6%',  y:'28%', s:30, d:0.5,  dur:8.3 },
      { t:'NaCl',     x:'91%', y:'22%', s:14, d:2.1,  dur:6.4 },
      { t:'pH',       x:'2%',  y:'50%', s:22, d:0.9,  dur:10  },
      { t:'ΔH=-ve',  x:'93%', y:'48%', s:12, d:1.6,  dur:7.8 },
      { t:'e⁻',       x:'5%',  y:'68%', s:20, d:0.4,  dur:9.2 },
      { t:'Ka',       x:'89%', y:'70%', s:18, d:1.9,  dur:8.1 },
      { t:'O₂',       x:'4%',  y:'85%', s:18, d:0.7,  dur:6.9 },
      { t:'Kₑq',      x:'87%', y:'88%', s:14, d:2.3,  dur:7.5 },
      { t:'CO₂',      x:'48%', y:'4%',  s:14, d:1.1,  dur:8.6 },
      { t:'mol',      x:'15%', y:'40%', s:16, d:0.3,  dur:11  },
      { t:'Cl⁻',      x:'80%', y:'38%', s:17, d:1.4,  dur:7   },
      { t:'C₆H₆',    x:'30%', y:'92%', s:14, d:2.0,  dur:8.4 },
      { t:'Na⁺',      x:'65%', y:'90%', s:17, d:0.6,  dur:9.7 },
    ],
  },
  Mathematics: {
    primary: '#60a5fa', secondary: '#93c5fd', bg1: '#030d1f', bg2: '#071830',
    glow: 'rgba(96,165,250,0.22)', border: 'rgba(96,165,250,0.28)',
    gradient: 'linear-gradient(135deg,#030d1f 0%,#071830 40%,#050f25 70%,#0a1e3a 100%)',
    icon: '∑',
    symbols: [
      { t:'π',      x:'3%',  y:'8%',  s:30, d:0,    dur:7.2 },
      { t:'∫₀^∞',  x:'88%', y:'12%', s:16, d:1.2,  dur:9.1 },
      { t:'√x',    x:'6%',  y:'28%', s:24, d:0.5,  dur:8.3 },
      { t:'∑',      x:'91%', y:'22%', s:28, d:2.1,  dur:6.4 },
      { t:'∞',      x:'2%',  y:'50%', s:28, d:0.9,  dur:10  },
      { t:'f\'(x)', x:'93%', y:'48%', s:14, d:1.6,  dur:7.8 },
      { t:'θ',      x:'5%',  y:'68%', s:26, d:0.4,  dur:9.2 },
      { t:'lim',    x:'89%', y:'70%', s:18, d:1.9,  dur:8.1 },
      { t:'Δx→0',  x:'4%',  y:'85%', s:13, d:0.7,  dur:6.9 },
      { t:'e^iπ',  x:'87%', y:'88%', s:15, d:2.3,  dur:7.5 },
      { t:'dx/dy', x:'48%', y:'4%',  s:14, d:1.1,  dur:8.6 },
      { t:'log',   x:'15%', y:'40%', s:18, d:0.3,  dur:11  },
      { t:'∂',      x:'80%', y:'38%', s:26, d:1.4,  dur:7   },
      { t:'nCr',   x:'30%', y:'92%', s:15, d:2.0,  dur:8.4 },
      { t:'⊕',      x:'65%', y:'90%', s:22, d:0.6,  dur:9.7 },
    ],
  },
  Botany: {
    primary: '#4ade80', secondary: '#86efac', bg1: '#030e06', bg2: '#061a0a',
    glow: 'rgba(74,222,128,0.22)', border: 'rgba(74,222,128,0.28)',
    gradient: 'linear-gradient(135deg,#030e06 0%,#061a0a 40%,#041208 70%,#082010 100%)',
    icon: '🌿',
    symbols: [
      { t:'CO₂',      x:'3%',  y:'8%',  s:16, d:0,    dur:7.2 },
      { t:'ATP',      x:'88%', y:'12%', s:16, d:1.2,  dur:9.1 },
      { t:'🌱',        x:'6%',  y:'28%', s:24, d:0.5,  dur:8.3 },
      { t:'NADH',     x:'91%', y:'22%', s:14, d:2.1,  dur:6.4 },
      { t:'O₂',       x:'2%',  y:'50%', s:22, d:0.9,  dur:10  },
      { t:'Chl-a',    x:'93%', y:'48%', s:13, d:1.6,  dur:7.8 },
      { t:'RuBP',     x:'5%',  y:'68%', s:14, d:0.4,  dur:9.2 },
      { t:'G3P',      x:'89%', y:'70%', s:16, d:1.9,  dur:8.1 },
      { t:'🍃',        x:'4%',  y:'85%', s:22, d:0.7,  dur:6.9 },
      { t:'ADP',      x:'87%', y:'88%', s:16, d:2.3,  dur:7.5 },
      { t:'H⁺',       x:'48%', y:'4%',  s:18, d:1.1,  dur:8.6 },
      { t:'PS-II',    x:'15%', y:'40%', s:14, d:0.3,  dur:11  },
      { t:'C₃',       x:'80%', y:'38%', s:20, d:1.4,  dur:7   },
      { t:'Xylem',    x:'30%', y:'92%', s:13, d:2.0,  dur:8.4 },
      { t:'🌸',        x:'65%', y:'90%', s:22, d:0.6,  dur:9.7 },
    ],
  },
  Zoology: {
    primary: '#fbbf24', secondary: '#fde68a', bg1: '#130e02', bg2: '#221804',
    glow: 'rgba(251,191,36,0.22)', border: 'rgba(251,191,36,0.28)',
    gradient: 'linear-gradient(135deg,#130e02 0%,#221804 40%,#180f02 70%,#2a1e06 100%)',
    icon: '🧬',
    symbols: [
      { t:'DNA',    x:'3%',  y:'8%',  s:16, d:0,    dur:7.2 },
      { t:'RNA',    x:'88%', y:'12%', s:16, d:1.2,  dur:9.1 },
      { t:'🧬',      x:'6%',  y:'28%', s:26, d:0.5,  dur:8.3 },
      { t:'mRNA',   x:'91%', y:'22%', s:14, d:2.1,  dur:6.4 },
      { t:'ATP',    x:'2%',  y:'50%', s:20, d:0.9,  dur:10  },
      { t:'tRNA',   x:'93%', y:'48%', s:14, d:1.6,  dur:7.8 },
      { t:'G·C',    x:'5%',  y:'68%', s:17, d:0.4,  dur:9.2 },
      { t:'A·T',    x:'89%', y:'70%', s:17, d:1.9,  dur:8.1 },
      { t:'🦠',      x:'4%',  y:'85%', s:22, d:0.7,  dur:6.9 },
      { t:'Codon',  x:'87%', y:'88%', s:13, d:2.3,  dur:7.5 },
      { t:'AUG',    x:'48%', y:'4%',  s:16, d:1.1,  dur:8.6 },
      { t:'rRNA',   x:'15%', y:'40%', s:15, d:0.3,  dur:11  },
      { t:'Cell',   x:'80%', y:'38%', s:16, d:1.4,  dur:7   },
      { t:'UAA',    x:'30%', y:'92%', s:15, d:2.0,  dur:8.4 },
      { t:'💉',      x:'65%', y:'90%', s:20, d:0.6,  dur:9.7 },
    ],
  },
};

const DEFAULT_THEME = THEMES.Physics;

function FloatingSymbols({ symbols, color, glow }) {
  return (
    <>
      {symbols.map((sym, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: sym.y, left: sym.x,
            fontSize: `${sym.s}px`,
            fontWeight: 800,
            color,
            opacity: 0.18,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            animation: `floatSym${i % 3} ${sym.dur}s ease-in-out ${sym.d}s infinite`,
            textShadow: `0 0 14px ${glow}, 0 0 28px ${glow}`,
            userSelect: 'none',
            zIndex: 0,
          }}
        >
          {sym.t}
        </div>
      ))}
    </>
  );
}

export default function ConceptsPage() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrollmentLoaded, setEnrollmentLoaded] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [slideDir, setSlideDir] = useState(null); // 'left' | 'right' | null
  const [animKey, setAnimKey] = useState(0);
  const [concepts, setConcepts] = useState([]);
  const [homeData, setHomeData] = useState({ recent_activity: [], needs_review: [], in_progress: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [unlocking, setUnlocking] = useState(null);
  const inputRef = useRef(null);
  const busy = useRef(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    setStudent(getStudent());
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [enrollRes, homeRes] = await Promise.all([
      apiCall('/enrollment/my-course'),
      apiCall('/progress/home-data'),
    ]);
    if (enrollRes.success) {
      setEnrollment(enrollRes.enrollment);
      if (enrollRes.enrollment) {
        const subs = enrollRes.enrollment.subjects || [];
        setSubjects(subs);
        if (subs.length > 0) loadConceptsForSubject(subs[0]);
        else { const d = await apiCall('/concepts'); if (d.success) setConcepts(d.concepts || []); }
      } else {
        const d = await apiCall('/concepts');
        if (d.success) setConcepts(d.concepts || []);
      }
    } else {
      const d = await apiCall('/concepts');
      if (d.success) setConcepts(d.concepts || []);
    }
    if (homeRes.success) setHomeData(homeRes);
    setEnrollmentLoaded(true);
    setLoading(false);
  };

  const loadConceptsForSubject = async (subject) => {
    const data = await apiCall(`/concepts?subject=${encodeURIComponent(subject)}`);
    if (data.success) setConcepts(data.concepts || []);
  };

  const changeSubject = (dir) => {
    if (busy.current || subjects.length <= 1) return;
    busy.current = true;
    const nextIdx = dir === 'right'
      ? (subjectIdx + 1) % subjects.length
      : (subjectIdx - 1 + subjects.length) % subjects.length;
    setSlideDir(dir);
    setAnimKey(k => k + 1);
    setSubjectIdx(nextIdx);
    loadConceptsForSubject(subjects[nextIdx]);
    setTimeout(() => {
      busy.current = false;
      setSlideDir(null);
    }, 600);
  };

  const unlock = async (concept) => {
    if (!window.confirm(`Spend ${concept.unlock_points} points to unlock "${concept.concept_name}"?`)) return;
    setUnlocking(concept.id);
    const data = await apiCall('/concepts/unlock', 'POST', { concept_id: concept.id });
    setUnlocking(null);
    if (data.success) {
      const updated = { ...student, total_points: data.remaining_points };
      saveAuth(localStorage.getItem('studentToken'), updated);
      setStudent(updated);
      loadConceptsForSubject(subjects[subjectIdx]);
    } else alert(data.message || 'Could not unlock');
  };

  const activeSubject = subjects[subjectIdx] || null;
  const theme = (activeSubject && THEMES[activeSubject]) ? THEMES[activeSubject] : DEFAULT_THEME;

  const searchResults = query.trim()
    ? concepts.filter(c =>
        c.concept_name.toLowerCase().includes(query.toLowerCase()) ||
        c.chapter_name.toLowerCase().includes(query.toLowerCase()) ||
        c.topic_name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const needsReviewIds = new Set(homeData.needs_review.map(r => r.id));
  const inProgressIds = new Set(homeData.in_progress.map(r => r.concept_id));
  const needsReviewConcepts = concepts.filter(c => needsReviewIds.has(c.id));
  const inProgressConcepts = concepts.filter(c => inProgressIds.has(c.id) && !needsReviewIds.has(c.id));
  const otherConcepts = concepts.filter(c => !needsReviewIds.has(c.id) && !inProgressIds.has(c.id));

  const ConceptCard = ({ c, errorCount }) => (
    <div className="card" style={{
      position: 'relative',
      opacity: c.is_unlocked ? 1 : 0.75,
      border: errorCount ? '1px solid rgba(244,63,94,0.4)' : `1px solid ${theme.border}`,
      background: `rgba(255,255,255,0.04)`,
      transition: 'all 0.25s',
      backdropFilter: 'blur(10px)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${theme.glow}`; e.currentTarget.style.border = `1px solid ${theme.primary}55`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.border = errorCount ? '1px solid rgba(244,63,94,0.4)' : `1px solid ${theme.border}`; }}
    >
      {errorCount > 0 && (
        <div style={{ position: 'absolute', top: '-1px', right: '-1px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '0 10px 0 8px' }}>
          {errorCount} error{errorCount > 1 ? 's' : ''}
        </div>
      )}
      <div style={{ fontSize: '10px', color: theme.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', opacity: 0.85 }}>
        {c.subject}
      </div>
      <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: '#f0f0ff' }}>{c.concept_name}</div>
      <div style={{ fontSize: '12px', color: '#7070a0', marginBottom: '14px' }}>{c.chapter_name} · {c.topic_name}</div>
      {c.is_unlocked ? (
        <Link href={`/concepts/${c.id}`}>
          <button style={{
            width: '100%', padding: '9px', fontWeight: 700, fontSize: '13px',
            background: `linear-gradient(135deg, ${theme.primary}cc, ${theme.secondary}cc)`,
            border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}>
            {errorCount > 0 ? '↺ Review' : 'View Questions →'}
          </button>
        </Link>
      ) : (
        <button className="btn-ghost" style={{ width: '100%', padding: '9px', fontSize: '12px' }}
          onClick={() => unlock(c)} disabled={unlocking === c.id || (student?.total_points ?? 0) < c.unlock_points}>
          {unlocking === c.id ? 'Unlocking...' : `🔒 Unlock · ${c.unlock_points} pts`}
        </button>
      )}
    </div>
  );

  const slideAnim = slideDir === 'right' ? 'slidePageRight' : slideDir === 'left' ? 'slidePageLeft' : 'none';

  return (
    <>
      <style>{`
        /* Three float variants so symbols move differently */
        @keyframes floatSym0 {
          0%,100% { transform: translateY(0) rotate(-4deg) scale(1); opacity: 0.18; }
          40% { transform: translateY(-18px) rotate(4deg) scale(1.08); opacity: 0.35; }
          70% { transform: translateY(-9px) rotate(-2deg) scale(1.03); opacity: 0.25; }
        }
        @keyframes floatSym1 {
          0%,100% { transform: translateY(0) rotate(5deg) scale(1); opacity: 0.15; }
          35% { transform: translateY(-22px) rotate(-5deg) scale(1.1); opacity: 0.32; }
          65% { transform: translateY(-6px) rotate(3deg) scale(1.04); opacity: 0.22; }
        }
        @keyframes floatSym2 {
          0%,100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.20; }
          50% { transform: translateY(-14px) rotate(6deg) scale(1.06); opacity: 0.38; }
        }

        @keyframes pulseGlow {
          0%,100% { opacity: 0.35; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.65; transform: translateX(-50%) scale(1.1); }
        }

        /* Full page slide when switching subjects */
        @keyframes slidePageRight {
          0%   { transform: translateX(100vw); opacity: 0; }
          100% { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slidePageLeft {
          0%   { transform: translateX(-100vw); opacity: 0; }
          100% { transform: translateX(0);      opacity: 1; }
        }

        /* Arrow wave: bobs toward center */
        @keyframes waveLeft {
          0%,100% { transform: translateY(-50%) translateX(0); }
          30%     { transform: translateY(-50%) translateX(6px); }
          60%     { transform: translateY(-50%) translateX(2px); }
        }
        @keyframes waveRight {
          0%,100% { transform: translateY(-50%) translateX(0); }
          30%     { transform: translateY(-50%) translateX(-6px); }
          60%     { transform: translateY(-50%) translateX(-2px); }
        }

        .arrow-left  { animation: waveLeft  2.2s ease-in-out infinite; }
        .arrow-right { animation: waveRight 2.2s ease-in-out infinite; }
        .arrow-left:hover  { animation: none !important; transform: translateY(-50%) scale(1.18) !important; }
        .arrow-right:hover { animation: none !important; transform: translateY(-50%) scale(1.18) !important; }

        @keyframes fadeSubject {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        .subject-content { animation: fadeSubject 0.4s ease forwards; }

        @keyframes bgPulse {
          0%,100% { background-position: 0% 50%; }
          50%     { background-position: 100% 50%; }
        }
      `}</style>

      <Navbar />

      {/* Fixed side arrows — only show when enrolled with multiple subjects */}
      {enrollmentLoaded && subjects.length > 1 && (
        <>
          {/* LEFT arrow */}
          <button
            className="arrow-left"
            onClick={() => changeSubject('left')}
            style={{
              position: 'fixed', top: '50%', left: '14px', zIndex: 100,
              width: '52px', height: '52px', borderRadius: '50%',
              background: `${theme.primary}20`,
              border: `2px solid ${theme.primary}70`,
              color: theme.primary, fontSize: '24px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
              backdropFilter: 'blur(8px)',
              transition: 'background 0.4s, border 0.4s, box-shadow 0.4s, color 0.4s',
            }}
          >‹</button>

          {/* RIGHT arrow */}
          <button
            className="arrow-right"
            onClick={() => changeSubject('right')}
            style={{
              position: 'fixed', top: '50%', right: '14px', zIndex: 100,
              width: '52px', height: '52px', borderRadius: '50%',
              background: `${theme.primary}20`,
              border: `2px solid ${theme.primary}70`,
              color: theme.primary, fontSize: '24px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 20px ${theme.glow}, 0 0 40px ${theme.glow}`,
              backdropFilter: 'blur(8px)',
              transition: 'background 0.4s, border 0.4s, box-shadow 0.4s, color 0.4s',
            }}
          >›</button>
        </>
      )}

      {/* Full-page themed wrapper — background transitions with theme */}
      <div style={{
        minHeight: '100vh',
        background: theme.gradient,
        transition: 'background 0.6s ease',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Floating background symbols — re-keyed on subject change */}
        <div
          key={`sym-${activeSubject}`}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
        >
          {activeSubject && (
            <FloatingSymbols
              symbols={theme.symbols}
              color={theme.primary}
              glow={theme.glow}
            />
          )}
        </div>

        {/* Radial glow blob */}
        <div style={{
          position: 'absolute', top: '-12%', left: '50%',
          width: '800px', height: '600px', borderRadius: '50%',
          background: `radial-gradient(ellipse, ${theme.glow} 0%, transparent 68%)`,
          pointerEvents: 'none',
          transition: 'background 0.6s ease',
          animation: 'pulseGlow 4.5s ease-in-out infinite',
          zIndex: 0,
        }} />

        {/* Sliding page content */}
        <div
          key={animKey}
          style={{
            position: 'relative', zIndex: 2,
            animation: slideDir ? `${slideAnim} 0.55s cubic-bezier(0.22,1,0.36,1) forwards` : 'none',
          }}
        >
          {/* ── Hero ── */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: '3.5rem', paddingBottom: '2.5rem',
          }}>

            {/* Subject name + dots (no arrows here — they're fixed on screen) */}
            {enrollmentLoaded && subjects.length > 0 && (
              <div
                key={`name-${activeSubject}`}
                className="subject-content"
                style={{ textAlign: 'center', marginBottom: '1.2rem' }}
              >
                <div style={{
                  fontSize: 'clamp(2.4rem, 7vw, 3.8rem)',
                  fontWeight: 900, letterSpacing: '0.07em',
                  color: theme.primary,
                  textShadow: `0 0 40px ${theme.glow}, 0 0 80px ${theme.glow}`,
                  lineHeight: 1.05, marginBottom: '14px',
                }}>
                  {activeSubject?.toUpperCase()}
                </div>

                {/* Dot indicators */}
                {subjects.length > 1 && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {subjects.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (i === subjectIdx) return;
                          const dir = i > subjectIdx ? 'right' : 'left';
                          if (busy.current) return;
                          busy.current = true;
                          setSlideDir(dir);
                          setAnimKey(k => k + 1);
                          setSubjectIdx(i);
                          loadConceptsForSubject(subjects[i]);
                          setTimeout(() => { busy.current = false; setSlideDir(null); }, 600);
                        }}
                        style={{
                          width: i === subjectIdx ? '32px' : '9px', height: '9px', borderRadius: '4.5px',
                          background: i === subjectIdx ? theme.primary : 'rgba(255,255,255,0.2)',
                          border: 'none', cursor: 'pointer', transition: 'all 0.35s ease', padding: 0,
                          boxShadow: i === subjectIdx ? `0 0 8px ${theme.primary}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subject icon + glow bar */}
            {activeSubject && (
              <div key={`icon-${activeSubject}`} className="subject-content" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                <div style={{
                  fontSize: '64px', marginBottom: '10px',
                  filter: `drop-shadow(0 0 18px ${theme.primary}) drop-shadow(0 0 36px ${theme.glow})`,
                  lineHeight: 1,
                }}>
                  {theme.icon}
                </div>
                <div style={{
                  width: '100px', height: '3px', borderRadius: '99px', margin: '0 auto',
                  background: `linear-gradient(90deg, transparent, ${theme.primary}, ${theme.secondary}, transparent)`,
                  boxShadow: `0 0 12px ${theme.primary}`,
                }} />
              </div>
            )}

            {/* Greeting */}
            {student && (
              <div style={{ fontSize: '14px', color: `${theme.primary}aa`, marginBottom: '1.25rem', fontWeight: 500 }}>
                Hello, <span style={{ color: theme.primary, fontWeight: 700 }}>{student.name || student.phone}</span>
                {student.total_points > 0 && (
                  <span style={{ marginLeft: '10px', color: '#facc15', fontWeight: 600 }}>· {student.total_points} pts</span>
                )}
              </div>
            )}

            {/* Search bar */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '560px', padding: '0 1rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: focused ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
                border: focused ? `1.5px solid ${theme.primary}` : `1px solid ${theme.border}`,
                borderRadius: focused && query ? '16px 16px 0 0' : '9999px',
                padding: '13px 20px',
                transition: 'all 0.25s',
                boxShadow: focused ? `0 0 0 4px ${theme.glow}` : 'none',
                backdropFilter: 'blur(12px)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder={`Search ${activeSubject || 'topics'}...`}
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px', color: '#fff', caretColor: theme.primary }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '18px', lineHeight: 1 }}>×</button>
                )}
              </div>

              {focused && query && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', left: '1rem', right: '1rem', top: '100%', zIndex: 50,
                  background: theme.bg2, border: `1px solid ${theme.border}`,
                  borderTop: 'none', borderRadius: '0 0 16px 16px',
                  overflow: 'hidden', boxShadow: `0 14px 36px rgba(0,0,0,0.7)`,
                }}>
                  {searchResults.slice(0, 6).map(c => (
                    <Link key={c.id} href={c.is_unlocked ? `/concepts/${c.id}` : '#'} onClick={() => setQuery('')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', cursor: 'pointer', borderBottom: `1px solid ${theme.border}`, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = `${theme.primary}18`}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <div>
                          <div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: 500 }}>{c.concept_name}</div>
                          <div style={{ fontSize: '11px', color: '#7070a0' }}>{c.chapter_name}</div>
                        </div>
                        {needsReviewIds.has(c.id) && <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>REVIEW</div>}
                        {!c.is_unlocked && <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#facc15' }}>🔒</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {focused && query && searchResults.length === 0 && (
                <div style={{
                  position: 'absolute', left: '1rem', right: '1rem', top: '100%', zIndex: 50,
                  background: theme.bg2, border: `1px solid ${theme.border}`,
                  borderTop: 'none', borderRadius: '0 0 16px 16px',
                  padding: '14px 18px', color: '#7070a0', fontSize: '14px',
                }}>
                  No topics found for "{query}"
                </div>
              )}
            </div>

            {/* Recent activity chips */}
            {!query && homeData.recent_activity.length > 0 && (
              <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center', maxWidth: '600px', padding: '0 1rem' }}>
                {homeData.recent_activity.map(r => {
                  const hasErrors = needsReviewIds.has(r.id);
                  return (
                    <button key={r.id} onClick={() => setQuery(r.concept_name)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: hasErrors ? 'rgba(244,63,94,0.12)' : `${theme.primary}14`,
                      border: hasErrors ? '1px solid rgba(244,63,94,0.35)' : `1px solid ${theme.border}`,
                      borderRadius: '9999px', padding: '5px 12px',
                      fontSize: '12px', color: hasErrors ? '#fca5a5' : theme.primary,
                      cursor: 'pointer', transition: 'all 0.15s',
                      backdropFilter: 'blur(6px)',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = hasErrors ? 'rgba(244,63,94,0.2)' : `${theme.primary}28`}
                      onMouseLeave={e => e.currentTarget.style.background = hasErrors ? 'rgba(244,63,94,0.12)' : `${theme.primary}14`}
                    >
                      <span style={{ fontSize: '10px' }}>{hasErrors ? '⚠' : '↺'}</span>
                      {r.concept_name}
                    </button>
                  );
                })}
              </div>
            )}

            {enrollmentLoaded && !enrollment && !loading && (
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <p style={{ color: '#7070a0', marginBottom: '1rem', fontSize: '14px' }}>Enroll in a course to unlock subject-specific content</p>
                <Link href="/">
                  <button className="btn-primary" style={{ padding: '11px 28px', fontSize: '14px' }}>Browse Courses</button>
                </Link>
              </div>
            )}
          </div>

          {/* ── Content area ── */}
          <div className="container" style={{ paddingTop: 0 }}>
            {loading && <div style={{ textAlign: 'center', color: '#7070a0', padding: '3rem' }}>Loading...</div>}

            {!loading && query && (
              <>
                <div style={{ fontSize: '13px', color: theme.primary, marginBottom: '1.25rem', opacity: 0.7 }}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
                </div>
                {searchResults.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', color: '#7070a0', padding: '2rem' }}>No topics match</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px,1fr))', gap: '1rem' }}>
                    {searchResults.map(c => {
                      const rev = homeData.needs_review.find(r => r.id === c.id);
                      return <ConceptCard key={c.id} c={c} errorCount={rev ? parseInt(rev.error_count) : 0} />;
                    })}
                  </div>
                )}
              </>
            )}

            {!loading && !query && (
              <div key={`content-${activeSubject}`} className="subject-content">

                {needsReviewConcepts.length > 0 && (
                  <section style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '15px' }}>⚠</span>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#fca5a5' }}>Needs Review</h2>
                      <span style={{ fontSize: '12px', color: '#7070a0' }}>Topics with errors</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                      {needsReviewConcepts.map(c => {
                        const rev = homeData.needs_review.find(r => r.id === c.id);
                        return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />;
                      })}
                    </div>
                  </section>
                )}

                {homeData.in_progress.length > 0 && (
                  <section style={{ marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0e0' }}>Continue Learning</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {homeData.in_progress.map(ip => (
                        <Link key={ip.boss_question_id} href={`/ladder/${ip.boss_question_id}`} style={{ textDecoration: 'none' }}>
                          <div className="card" style={{ minWidth: '220px', cursor: 'pointer', border: `1px solid ${theme.border}`, backdropFilter: 'blur(8px)' }}>
                            <div style={{ fontSize: '11px', color: theme.primary, fontWeight: 600, marginBottom: '4px' }}>{ip.concept_name}</div>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#f0f0ff' }}>{ip.title}</div>
                            <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '999px', height: '5px', overflow: 'hidden', marginBottom: '4px' }}>
                              <div style={{ height: '100%', borderRadius: '999px', background: `linear-gradient(90deg,${theme.primary},${theme.secondary})`, width: `${ip.progress_percentage}%`, transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ fontSize: '11px', color: '#7070a0' }}>{ip.steps_completed}/{ip.total_steps} steps · {ip.progress_percentage}%</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                <section style={{ paddingBottom: '5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0e0' }}>
                      {activeSubject ? `${activeSubject} Topics` : 'All Topics'}
                    </h2>
                    <span style={{ fontSize: '12px', color: theme.primary, fontWeight: 600, background: `${theme.primary}18`, padding: '2px 10px', borderRadius: '9999px' }}>
                      {concepts.length}
                    </span>
                  </div>
                  {concepts.length === 0 ? (
                    <div style={{
                      textAlign: 'center', padding: '3.5rem', borderRadius: '20px',
                      background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                      backdropFilter: 'blur(10px)',
                    }}>
                      <div style={{ fontSize: '4rem', marginBottom: '1rem', filter: `drop-shadow(0 0 16px ${theme.primary})` }}>{theme.icon}</div>
                      <div style={{ color: '#e0e0e0', fontWeight: 600, marginBottom: '6px', fontSize: '16px' }}>No {activeSubject} topics yet</div>
                      <div style={{ color: '#7070a0', fontSize: '13px' }}>Topics for this subject are coming soon.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                      {[...needsReviewConcepts, ...inProgressConcepts, ...otherConcepts].map(c => {
                        const rev = homeData.needs_review.find(r => r.id === c.id);
                        return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />;
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
