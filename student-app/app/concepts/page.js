'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent, saveAuth } from '../../src/lib/auth';

const SUBJECT_CONFIG = {
  Physics: {
    gradient: 'linear-gradient(135deg, #4776e6 0%, #6c5ce7 100%)',
    primary: '#6c5ce7', secondary: '#4776e6',
    bg: '#f4f3ff', chipBg: '#ede9ff', chipBorder: '#c4b9ff',
    symbolColor: 'rgba(108,92,231,0.10)',
    subtitle: 'Explore the laws of nature.',
    icon: '⚛',
    categories: ['Mechanics','Thermodynamics','Electromagnetism','Quantum Physics','Relativity'],
    symbols: [
      { t:'E = mc²', x:'8%',  y:'18%', s:15 },
      { t:'F = ma',  x:'78%', y:'14%', s:15 },
      { t:'p = mv',  x:'5%',  y:'55%', s:14 },
      { t:'∇·B = 0', x:'80%', y:'58%', s:14 },
      { t:'λ',       x:'20%', y:'80%', s:28 },
      { t:'ℏ',       x:'72%', y:'80%', s:26 },
      { t:'∫F·ds',   x:'45%', y:'88%', s:13 },
    ],
  },
  Chemistry: {
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    primary: '#059669', secondary: '#10b981',
    bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7',
    symbolColor: 'rgba(5,150,105,0.10)',
    subtitle: 'Decode the building blocks of matter.',
    icon: '⬡',
    categories: ['Organic','Inorganic','Physical','Electrochemistry','Thermochemistry'],
    symbols: [
      { t:'H₂O',   x:'8%',  y:'18%', s:16 },
      { t:'CH₄',   x:'78%', y:'14%', s:15 },
      { t:'pH',    x:'5%',  y:'55%', s:22 },
      { t:'ΔH',    x:'80%', y:'58%', s:18 },
      { t:'⬡',     x:'20%', y:'80%', s:30 },
      { t:'CO₂',   x:'72%', y:'80%', s:16 },
      { t:'e⁻',    x:'45%', y:'88%', s:18 },
    ],
  },
  Mathematics: {
    gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    primary: '#2563eb', secondary: '#3b82f6',
    bg: '#eff6ff', chipBg: '#dbeafe', chipBorder: '#93c5fd',
    symbolColor: 'rgba(37,99,235,0.10)',
    subtitle: 'Master the language of the universe.',
    icon: '∑',
    categories: ['Algebra','Calculus','Trigonometry','Coordinate Geometry','Statistics'],
    symbols: [
      { t:'π',     x:'8%',  y:'18%', s:28 },
      { t:'∑',     x:'78%', y:'14%', s:26 },
      { t:'∞',     x:'5%',  y:'55%', s:28 },
      { t:'∫₀^∞', x:'80%', y:'58%', s:15 },
      { t:'√x',   x:'20%', y:'80%', s:22 },
      { t:'θ',    x:'72%', y:'80%', s:26 },
      { t:'lim',  x:'45%', y:'88%', s:16 },
    ],
  },
  Botany: {
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    primary: '#16a34a', secondary: '#22c55e',
    bg: '#f0fdf4', chipBg: '#bbf7d0', chipBorder: '#86efac',
    symbolColor: 'rgba(22,163,74,0.10)',
    subtitle: 'Understand the science of plant life.',
    icon: '🌿',
    categories: ['Morphology','Anatomy','Physiology','Ecology','Reproduction'],
    symbols: [
      { t:'ATP',  x:'8%',  y:'18%', s:16 },
      { t:'CO₂',  x:'78%', y:'14%', s:16 },
      { t:'O₂',   x:'5%',  y:'55%', s:20 },
      { t:'RuBP', x:'80%', y:'58%', s:14 },
      { t:'🌱',   x:'20%', y:'80%', s:26 },
      { t:'🍃',   x:'72%', y:'80%', s:24 },
      { t:'NADH', x:'45%', y:'88%', s:13 },
    ],
  },
  Zoology: {
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    primary: '#d97706', secondary: '#f59e0b',
    bg: '#fffbeb', chipBg: '#fef3c7', chipBorder: '#fde68a',
    symbolColor: 'rgba(217,119,6,0.10)',
    subtitle: 'Discover the diversity of animal life.',
    icon: '🧬',
    categories: ['Cell Biology','Genetics','Evolution','Ecology','Human Physiology'],
    symbols: [
      { t:'DNA',  x:'8%',  y:'18%', s:16 },
      { t:'RNA',  x:'78%', y:'14%', s:16 },
      { t:'ATP',  x:'5%',  y:'55%', s:18 },
      { t:'G·C',  x:'80%', y:'58%', s:16 },
      { t:'🧬',   x:'20%', y:'80%', s:26 },
      { t:'🦠',   x:'72%', y:'80%', s:24 },
      { t:'AUG',  x:'45%', y:'88%', s:15 },
    ],
  },
};

const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

export default function ConceptsPage() {
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrollmentLoaded, setEnrollmentLoaded] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [concepts, setConcepts] = useState([]);
  const [homeData, setHomeData] = useState({ recent_activity: [], needs_review: [], in_progress: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [unlocking, setUnlocking] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const inputRef = useRef(null);
  const busy = useRef(false);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!isLoggedIn()) { router.push('/login'); return; }
    setStudent(getStudent());
    loadAll();
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
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
    setSubjectIdx(nextIdx);
    loadConceptsForSubject(subjects[nextIdx]);
    setTimeout(() => { busy.current = false; }, 400);
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

  const scrollToContent = () => contentRef.current?.scrollIntoView({ behavior: 'smooth' });

  const activeSubject = subjects[subjectIdx] || null;
  const cfg = (activeSubject && SUBJECT_CONFIG[activeSubject]) ? SUBJECT_CONFIG[activeSubject] : DEFAULT_CFG;

  const searchResults = query.trim()
    ? concepts.filter(c =>
        c.concept_name.toLowerCase().includes(query.toLowerCase()) ||
        c.chapter_name.toLowerCase().includes(query.toLowerCase()) ||
        c.topic_name?.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const needsReviewIds = new Set(homeData.needs_review.map(r => r.id));
  const inProgressIds = new Set(homeData.in_progress.map(r => r.concept_id));

  const ConceptCard = ({ c, errorCount }) => (
    <div style={{
      background: '#fff',
      border: errorCount ? '1px solid #fca5a5' : `1px solid ${cfg.chipBorder}`,
      borderRadius: '16px',
      padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'all 0.2s',
      cursor: 'default',
      position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${cfg.primary}20`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
    >
      {errorCount > 0 && (
        <div style={{ position: 'absolute', top: '-1px', right: '-1px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '0 14px 0 8px' }}>
          {errorCount} error{errorCount > 1 ? 's' : ''}
        </div>
      )}
      <div style={{ fontSize: '10px', color: cfg.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{c.subject}</div>
      <div style={{ fontWeight: 700, fontSize: '15px', color: '#1a1035', lineHeight: 1.3 }}>{c.concept_name}</div>
      <div style={{ fontSize: '12px', color: '#8888aa' }}>{c.chapter_name} · {c.topic_name}</div>
      {c.is_unlocked ? (
        <Link href={`/concepts/${c.id}`}>
          <button style={{
            width: '100%', padding: '9px', fontWeight: 700, fontSize: '13px',
            background: cfg.gradient, border: 'none', borderRadius: '10px',
            color: '#fff', cursor: 'pointer', transition: 'opacity 0.15s',
          }}>
            {errorCount > 0 ? '↺ Review' : 'View Questions →'}
          </button>
        </Link>
      ) : (
        <button style={{
          width: '100%', padding: '9px', fontSize: '12px', fontWeight: 600,
          background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`,
          borderRadius: '10px', color: cfg.primary, cursor: 'pointer',
        }}
          onClick={() => unlock(c)} disabled={unlocking === c.id || (student?.total_points ?? 0) < c.unlock_points}>
          {unlocking === c.id ? 'Unlocking...' : `🔒 Unlock · ${c.unlock_points} pts`}
        </button>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes orbitA {
          from { transform: rotate(0deg) translateX(170px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(170px) rotate(-360deg); }
        }
        @keyframes orbitB {
          from { transform: rotate(180deg) translateX(110px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(110px) rotate(-540deg); }
        }
        @keyframes floatEq {
          0%,100% { transform: translateY(0); opacity: 0.12; }
          50%      { transform: translateY(-14px); opacity: 0.22; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
          50%      { transform: scale(1.3); }
        }
        .concept-page { animation: fadeIn 0.5s ease; }
        .scroll-btn:hover { background: #1a1035 !important; color: #fff !important; }
      `}</style>

      {/* Navbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s',
      }}>
        <Navbar />
      </div>

      {/* Subject switcher arrows */}
      {enrollmentLoaded && subjects.length > 1 && (
        <>
          <button onClick={() => changeSubject('left')} style={{
            position: 'fixed', top: '50%', left: '14px', zIndex: 99,
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#fff', border: `2px solid ${cfg.chipBorder}`,
            color: cfg.primary, fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.2s',
          }}>‹</button>
          <button onClick={() => changeSubject('right')} style={{
            position: 'fixed', top: '50%', right: '14px', zIndex: 99,
            width: '44px', height: '44px', borderRadius: '50%',
            background: '#fff', border: `2px solid ${cfg.chipBorder}`,
            color: cfg.primary, fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.2s',
          }}>›</button>
        </>
      )}

      <div style={{ background: cfg.bg, minHeight: '100vh', transition: 'background 0.5s' }}>

        {/* ── HERO ── */}
        <div className="concept-page" key={activeSubject} style={{
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', paddingTop: '80px', paddingBottom: '60px',
        }}>

          {/* Floating equations */}
          {cfg.symbols.map((sym, i) => (
            <div key={i} style={{
              position: 'absolute', top: sym.y, left: sym.x,
              fontSize: `${sym.s}px`, fontWeight: 800,
              color: cfg.symbolColor, fontFamily: 'Georgia, serif',
              pointerEvents: 'none', userSelect: 'none',
              animation: `floatEq ${5 + i * 0.8}s ease-in-out ${i * 0.4}s infinite`,
            }}>
              {sym.t}
            </div>
          ))}

          {/* Subject icon nav pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#fff', border: `1px solid ${cfg.chipBorder}`,
            borderRadius: '9999px', padding: '6px 16px 6px 10px',
            marginBottom: '2.5rem',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            fontSize: '13px', fontWeight: 600, color: cfg.primary,
          }}>
            <span style={{ fontSize: '18px' }}>{cfg.icon}</span>
            {activeSubject || 'Physics'}
          </div>

          {/* Orbital + Title */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', height: '180px', width: '520px', maxWidth: '90vw' }}>

            {/* Orbital ring A */}
            <div style={{
              position: 'absolute', width: '340px', height: '120px',
              border: `1.5px solid ${cfg.primary}30`,
              borderRadius: '50%', transform: 'rotate(-20deg)',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '10px', height: '10px', borderRadius: '50%',
                background: cfg.primary, marginLeft: '-5px', marginTop: '-5px',
                animation: 'orbitA 4s linear infinite',
                boxShadow: `0 0 8px ${cfg.primary}`,
              }} />
            </div>

            {/* Orbital ring B */}
            <div style={{
              position: 'absolute', width: '220px', height: '80px',
              border: `1.5px solid ${cfg.secondary}40`,
              borderRadius: '50%', transform: 'rotate(50deg)',
            }}>
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                width: '7px', height: '7px', borderRadius: '50%',
                background: cfg.secondary, marginLeft: '-3.5px', marginTop: '-3.5px',
                animation: 'orbitB 2.8s linear infinite',
                boxShadow: `0 0 6px ${cfg.secondary}`,
              }} />
            </div>

            {/* Subject title */}
            <h1 style={{
              fontSize: 'clamp(3rem, 9vw, 5.5rem)',
              fontWeight: 900, letterSpacing: '0.06em',
              background: cfg.gradient,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              lineHeight: 1, zIndex: 2, position: 'relative',
              userSelect: 'none',
            }}>
              {(activeSubject || 'PHYSICS').toUpperCase()}
            </h1>
          </div>

          {/* Subtitle */}
          <p style={{ fontSize: '16px', color: '#6b6b8a', marginBottom: '2.5rem', fontWeight: 400, letterSpacing: '0.01em' }}>
            {cfg.subtitle}
          </p>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '580px', padding: '0 1.5rem', marginBottom: '2rem' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: '#fff',
              border: focused ? `2px solid ${cfg.primary}` : '2px solid rgba(0,0,0,0.08)',
              borderRadius: focused && query ? '24px 24px 0 0' : '9999px',
              padding: '14px 20px',
              boxShadow: focused ? `0 0 0 4px ${cfg.primary}18` : '0 4px 20px rgba(0,0,0,0.10)',
              transition: 'all 0.25s',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder={`Search anything in ${activeSubject || 'Physics'}...`}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1035' }}
              />
              {query ? (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </div>

            {/* Search dropdown */}
            {focused && query && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', left: '1.5rem', right: '1.5rem', top: '100%', zIndex: 50,
                background: '#fff', border: `2px solid ${cfg.primary}`,
                borderTop: 'none', borderRadius: '0 0 20px 20px',
                overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              }}>
                {searchResults.slice(0, 6).map(c => (
                  <Link key={c.id} href={c.is_unlocked ? `/concepts/${c.id}` : '#'} onClick={() => setQuery('')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', cursor: 'pointer', borderBottom: `1px solid ${cfg.chipBg}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = cfg.chipBg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: '14px', color: '#1a1035', fontWeight: 500 }}>{c.concept_name}</div>
                        <div style={{ fontSize: '11px', color: '#8888aa' }}>{c.chapter_name}</div>
                      </div>
                      {needsReviewIds.has(c.id) && <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>REVIEW</div>}
                      {!c.is_unlocked && <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#f59e0b' }}>🔒</div>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {focused && query && searchResults.length === 0 && (
              <div style={{
                position: 'absolute', left: '1.5rem', right: '1.5rem', top: '100%', zIndex: 50,
                background: '#fff', border: `2px solid ${cfg.primary}`,
                borderTop: 'none', borderRadius: '0 0 20px 20px',
                padding: '14px 18px', color: '#8888aa', fontSize: '14px',
              }}>
                No topics found for "{query}"
              </div>
            )}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', maxWidth: '600px', padding: '0 1.5rem', marginBottom: '3rem' }}>
            {cfg.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setQuery(cat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: '#fff', border: `1.5px solid ${cfg.chipBorder}`,
                  borderRadius: '9999px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 600, color: cfg.primary,
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = cfg.chipBg; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'none'; }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Subject dots */}
          {subjects.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '2.5rem' }}>
              {subjects.map((_, i) => (
                <button key={i} onClick={() => {
                  if (i === subjectIdx || busy.current) return;
                  busy.current = true;
                  setSubjectIdx(i);
                  loadConceptsForSubject(subjects[i]);
                  setTimeout(() => { busy.current = false; }, 400);
                }} style={{
                  width: i === subjectIdx ? '28px' : '8px', height: '8px', borderRadius: '4px',
                  background: i === subjectIdx ? cfg.primary : `${cfg.primary}40`,
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
                }} />
              ))}
            </div>
          )}

          {/* Scroll to discover */}
          <button
            className="scroll-btn"
            onClick={scrollToContent}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#fff', border: '1.5px solid rgba(0,0,0,0.12)',
              borderRadius: '9999px', padding: '10px 22px',
              fontSize: '13px', fontWeight: 600, color: '#4a4a6a',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            Scroll to discover
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* ── CONTENT ── */}
        <div ref={contentRef} style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

          {loading && <div style={{ textAlign: 'center', color: '#8888aa', padding: '4rem', fontSize: '15px' }}>Loading...</div>}

          {!loading && enrollmentLoaded && !enrollment && (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{cfg.icon}</div>
              <p style={{ color: '#6b6b8a', marginBottom: '1.5rem', fontSize: '15px' }}>Enroll in a course to unlock subject-specific content</p>
              <Link href="/"><button style={{ background: cfg.gradient, border: 'none', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Browse Courses</button></Link>
            </div>
          )}

          {/* Search results */}
          {!loading && query && (
            <>
              <div style={{ fontSize: '13px', color: cfg.primary, marginBottom: '1.25rem', fontWeight: 600 }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
              </div>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8888aa', padding: '2rem', background: '#fff', borderRadius: '16px' }}>No topics match</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                  {searchResults.map(c => {
                    const rev = homeData.needs_review.find(r => r.id === c.id);
                    return <ConceptCard key={c.id} c={c} errorCount={rev ? parseInt(rev.error_count) : 0} />;
                  })}
                </div>
              )}
            </>
          )}

          {/* Normal concept view */}
          {!loading && !query && (
            <>
              {/* In progress */}
              {homeData.in_progress.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1035', marginBottom: '1rem' }}>Continue Learning</h2>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {homeData.in_progress.map(ip => (
                      <Link key={ip.boss_question_id} href={`/ladder/${ip.boss_question_id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ minWidth: '220px', background: '#fff', borderRadius: '16px', padding: '16px', cursor: 'pointer', border: `1px solid ${cfg.chipBorder}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.primary}20`; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}>
                          <div style={{ fontSize: '11px', color: cfg.primary, fontWeight: 600, marginBottom: '4px' }}>{ip.concept_name}</div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: '#1a1035' }}>{ip.title}</div>
                          <div style={{ background: cfg.chipBg, borderRadius: '999px', height: '5px', overflow: 'hidden', marginBottom: '4px' }}>
                            <div style={{ height: '100%', borderRadius: '999px', background: cfg.gradient, width: `${ip.progress_percentage}%`, transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#8888aa' }}>{ip.steps_completed}/{ip.total_steps} steps · {ip.progress_percentage}%</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Needs review */}
              {homeData.needs_review.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1035', marginBottom: '1rem' }}>⚠ Needs Review</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                    {concepts.filter(c => needsReviewIds.has(c.id)).map(c => {
                      const rev = homeData.needs_review.find(r => r.id === c.id);
                      return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />;
                    })}
                  </div>
                </section>
              )}

              {/* All topics */}
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1035' }}>
                    {activeSubject ? `${activeSubject} Topics` : 'All Topics'}
                  </h2>
                  <span style={{ fontSize: '12px', color: cfg.primary, fontWeight: 700, background: cfg.chipBg, padding: '2px 10px', borderRadius: '9999px' }}>
                    {concepts.length}
                  </span>
                </div>

                {concepts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{cfg.icon}</div>
                    <div style={{ color: '#1a1035', fontWeight: 600, marginBottom: '6px', fontSize: '16px' }}>No {activeSubject} topics yet</div>
                    <div style={{ color: '#8888aa', fontSize: '13px' }}>Topics for this subject are coming soon.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                    {concepts.map(c => {
                      const rev = homeData.needs_review.find(r => r.id === c.id);
                      return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />;
                    })}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
