'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../src/components/Navbar';
import { apiCall } from '../../src/lib/api';
import { isLoggedIn, getStudent, saveAuth } from '../../src/lib/auth';

/* ── SVG Icons ── */
const Icons = {
  // Physics
  Mechanics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,19 12,5 19,19"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
  Thermodynamics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
  Electromagnetism: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4v10a6 6 0 0 0 12 0V4"/><line x1="3" y1="4" x2="9" y2="4"/><line x1="15" y1="4" x2="21" y2="4"/></svg>,
  'Quantum Physics': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12 Q4.5 6 7 12 Q9.5 18 12 12 Q14.5 6 17 12 Q19.5 18 22 12"/><circle cx="12" cy="12" r="1.5" fill={c}/></svg>,
  Relativity: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>,
  // Chemistry
  'Inorganic Chemistry': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="2" fill={c}/><ellipse cx="12" cy="12" rx="10" ry="3.5"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(120 12 12)"/></svg>,
  'Organic Chemistry': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,3 21,8 21,16 12,21 3,16 3,8"/><circle cx="12" cy="12" r="4"/></svg>,
  'Physical Chemistry': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6"/><path d="M9 3v5L4.5 17A2 2 0 0 0 6.4 20h11.2a2 2 0 0 0 1.9-3L15 8V3"/><line x1="7" y1="14" x2="17" y2="14" strokeDasharray="2 2" strokeWidth="1.2"/></svg>,
  Biochemistry: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M7 3c5 3 5 6.5 0 9.5S2 18.5 7 21"/><path d="M17 3c-5 3-5 6.5 0 9.5s5 6 0 9"/><line x1="8.5" y1="7" x2="15.5" y2="7"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="17" x2="15.5" y2="17"/></svg>,
  'Analytical Chemistry': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><line x1="6.4" y1="7.4" x2="10" y2="10"/><line x1="17.6" y1="7.4" x2="14" y2="10"/><line x1="6.4" y1="16.6" x2="10" y2="14"/><line x1="17.6" y1="16.6" x2="14" y2="14"/></svg>,
  // Mathematics
  Algebra: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/><path d="M8 5l-4 7 4 7"/></svg>,
  Calculus: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M8 3C6 3 4 5 4 12s2 9 4 9"/><path d="M16 3c2 0 4 2 4 9s-2 9-4 9"/><line x1="4" y1="12" x2="20" y2="12"/></svg>,
  Trigonometry: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><polygon points="12,4 22,20 2,20"/><line x1="12" y1="20" x2="12" y2="12"/></svg>,
  'Coordinate Geometry': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/><circle cx="16" cy="8" r="2.5"/><path d="M4 17 Q8 10 12 12 Q16 14 20 7"/></svg>,
  Statistics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>,
  // Botany
  Morphology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22V12"/><path d="M12 12C12 6 6 4 3 6c3 1 6 4 9 6"/><path d="M12 12c0-6 6-8 9-6-3 1-6 4-9 6"/></svg>,
  Anatomy: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="7" r="4"/><path d="M8 14l-3 8"/><path d="M16 14l3 8"/><line x1="8" y1="16" x2="16" y2="16"/></svg>,
  Physiology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M3 12 Q5 8 8 12 Q11 16 12 12 Q13 8 16 12 Q19 16 21 12"/></svg>,
  Ecology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 0 18"/><path d="M12 3a15 15 0 0 0 0 18"/></svg>,
  Reproduction: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="12" r="5"/><circle cx="16" cy="12" r="3"/><line x1="19" y1="9" x2="21" y2="7"/><line x1="19" y1="15" x2="21" y2="17"/></svg>,
  // Zoology
  'Cell Biology': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="4" ry="2.5"/></svg>,
  Genetics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M7 3c5 3 5 6.5 0 9.5S2 18.5 7 21"/><path d="M17 3c-5 3-5 6.5 0 9.5s5 6 0 9"/></svg>,
  Evolution: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M3 20 Q8 12 14 10 Q18 8 21 4"/><path d="M18 4l3 0 0 3"/><path d="M8 20 Q12 16 14 10"/></svg>,
  'Human Physiology': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="5" r="2"/><path d="M12 7v5l-3 5"/><path d="M12 12l3 5"/><line x1="9" y1="10" x2="15" y2="10"/></svg>,
};

const getIcon = (name, color) => {
  const fn = Icons[name];
  return fn ? fn(color) : <span style={{ fontSize: '20px' }}>◆</span>;
};

/* ── Background decorations ── */
const ChemistryBg = ({ color }) => (
  <>
    {/* Left: beakers + test tubes */}
    <svg style={{ position: 'absolute', left: 0, bottom: 0, height: '75%', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 300 500" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Erlenmeyer flask */}
      <path d="M110 60 L110 180 L50 380 Q40 410 65 410 L195 410 Q220 410 210 380 L150 180 L150 60"/>
      <line x1="100" y1="60" x2="160" y2="60"/>
      <path d="M70 330 Q130 320 185 330" strokeDasharray="4 4"/>
      <ellipse cx="130" cy="395" rx="55" ry="8" fill={color} opacity="0.3"/>
      {/* Liquid in flask */}
      <path d="M68 340 Q130 328 186 340 L190 380 Q130 375 70 380 Z" fill={color} opacity="0.15" stroke="none"/>
      {/* Test tube rack */}
      <rect x="30" y="200" width="18" height="90" rx="9"/>
      <rect x="55" y="185" width="18" height="105" rx="9"/>
      <rect x="15" y="215" width="18" height="80" rx="9"/>
      <rect x="10" y="288" width="78" height="8" rx="3"/>
      {/* Bubbles */}
      <circle cx="130" cy="300" r="5"/>
      <circle cx="145" cy="275" r="3.5"/>
      <circle cx="120" cy="255" r="4.5"/>
      <circle cx="138" cy="235" r="2.5"/>
    </svg>
    {/* Right: round-bottom flask */}
    <svg style={{ position: 'absolute', right: 0, bottom: 0, height: '65%', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 280 500" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      {/* Round-bottom flask */}
      <path d="M130 80 L130 200 Q60 240 60 320 A80 80 0 0 0 220 320 Q220 240 150 200 L150 80"/>
      <line x1="118" y1="80" x2="162" y2="80"/>
      {/* Liquid */}
      <path d="M66 340 Q140 330 214 340 A70 70 0 0 1 66 340 Z" fill={color} opacity="0.2" stroke="none"/>
      <path d="M64 330 Q140 318 216 330" strokeDasharray="4 3"/>
      {/* Molecular structure floating */}
      <circle cx="240" cy="160" r="8"/>
      <circle cx="265" cy="130" r="6"/>
      <circle cx="260" cy="190" r="6"/>
      <line x1="248" y1="155" x2="260" y2="135"/>
      <line x1="248" y1="165" x2="255" y2="185"/>
    </svg>
  </>
);

const PhysicsBg = ({ color }) => (
  <>
    {/* Left: orbital rings */}
    <svg style={{ position: 'absolute', left: '-60px', top: '10%', width: '280px', opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 280 280" fill="none" stroke={color} strokeWidth="2">
      <ellipse cx="140" cy="140" rx="130" ry="50" transform="rotate(-30 140 140)"/>
      <ellipse cx="140" cy="140" rx="130" ry="50" transform="rotate(30 140 140)"/>
      <ellipse cx="140" cy="140" rx="130" ry="50" transform="rotate(90 140 140)"/>
      <circle cx="140" cy="140" r="14" fill={color}/>
    </svg>
    {/* Right: wave lines */}
    <svg style={{ position: 'absolute', right: '0', top: '20%', width: '200px', opacity: 0.08, pointerEvents: 'none' }} viewBox="0 0 200 200" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <path d="M10 50 Q30 30 50 50 Q70 70 90 50 Q110 30 130 50 Q150 70 170 50 Q190 30 210 50"/>
      <path d="M10 90 Q30 70 50 90 Q70 110 90 90 Q110 70 130 90 Q150 110 170 90"/>
      <path d="M10 130 Q30 110 50 130 Q70 150 90 130 Q110 110 130 130"/>
    </svg>
  </>
);

/* ── Subject Config ── */
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
      { t:'E = mc²', x:'8%',  y:'22%', s:15 },
      { t:'F = ma',  x:'76%', y:'16%', s:15 },
      { t:'p = mv',  x:'5%',  y:'55%', s:14 },
      { t:'∇·B = 0', x:'78%', y:'58%', s:14 },
      { t:'λ',       x:'18%', y:'78%', s:30 },
      { t:'ℏ',       x:'74%', y:'78%', s:28 },
    ],
    BgDecor: PhysicsBg,
  },
  Chemistry: {
    gradient: 'linear-gradient(135deg, #0d9488 0%, #059669 100%)',
    primary: '#059669', secondary: '#0d9488',
    bg: '#f0fdf4', chipBg: '#d1fae5', chipBorder: '#6ee7b7',
    symbolColor: 'rgba(5,150,105,0.12)',
    subtitle: 'Discover. Understand. Transform.',
    icon: '⬡',
    categories: ['Inorganic Chemistry','Organic Chemistry','Physical Chemistry','Biochemistry','Analytical Chemistry'],
    symbols: [
      { t:'H₂O',         x:'8%',  y:'20%', s:18 },
      { t:'OH',          x:'14%', y:'42%', s:16 },
      { t:'NH₂',         x:'10%', y:'60%', s:15 },
      { t:'Eₐ = −d[]/dt', x:'72%', y:'18%', s:13 },
      { t:'CH₃',         x:'76%', y:'52%', s:15 },
      { t:'⬡',           x:'80%', y:'68%', s:26 },
    ],
    BgDecor: ChemistryBg,
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
      { t:'π',     x:'8%',  y:'20%', s:30 },
      { t:'∑',     x:'76%', y:'16%', s:28 },
      { t:'∞',     x:'5%',  y:'55%', s:30 },
      { t:'∫₀^∞', x:'78%', y:'55%', s:15 },
      { t:'√x',   x:'18%', y:'78%', s:24 },
      { t:'θ',    x:'74%', y:'78%', s:28 },
    ],
    BgDecor: null,
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
      { t:'ATP',  x:'8%',  y:'20%', s:16 },
      { t:'CO₂',  x:'76%', y:'16%', s:16 },
      { t:'O₂',   x:'5%',  y:'55%', s:20 },
      { t:'RuBP', x:'78%', y:'55%', s:14 },
      { t:'🌱',   x:'18%', y:'78%', s:28 },
      { t:'🍃',   x:'74%', y:'78%', s:26 },
    ],
    BgDecor: null,
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
      { t:'DNA',  x:'8%',  y:'20%', s:16 },
      { t:'RNA',  x:'76%', y:'16%', s:16 },
      { t:'ATP',  x:'5%',  y:'55%', s:18 },
      { t:'G·C',  x:'78%', y:'55%', s:16 },
      { t:'🧬',   x:'18%', y:'78%', s:28 },
      { t:'🦠',   x:'74%', y:'78%', s:26 },
    ],
    BgDecor: null,
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
  const BgDecor = cfg.BgDecor;

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
      background: '#fff', border: errorCount ? '1px solid #fca5a5' : `1px solid ${cfg.chipBorder}`,
      borderRadius: '16px', padding: '18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      transition: 'all 0.2s', cursor: 'default', position: 'relative',
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
          <button style={{ width: '100%', padding: '9px', fontWeight: 700, fontSize: '13px', background: cfg.gradient, border: 'none', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}>
            {errorCount > 0 ? '↺ Review' : 'View Questions →'}
          </button>
        </Link>
      ) : (
        <button style={{ width: '100%', padding: '9px', fontSize: '12px', fontWeight: 600, background: cfg.chipBg, border: `1px solid ${cfg.chipBorder}`, borderRadius: '10px', color: cfg.primary, cursor: 'pointer' }}
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
          from { transform: rotate(0deg) translateX(165px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(165px) rotate(-360deg); }
        }
        @keyframes orbitB {
          from { transform: rotate(180deg) translateX(105px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(105px) rotate(-540deg); }
        }
        @keyframes floatEq {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chipHover {
          to { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        }
        .hero-content { animation: fadeUp 0.55s ease forwards; }
        .cat-chip:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .scroll-btn:hover { background: #1a1035 !important; color: #fff !important; }
      `}</style>

      {/* Transparent top navbar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.07)' : 'none',
        transition: 'all 0.3s',
      }}>
        <Navbar />
      </div>

      {/* Subject arrows */}
      {enrollmentLoaded && subjects.length > 1 && (
        <>
          <button onClick={() => changeSubject('left')} style={{
            position: 'fixed', top: '50%', left: '14px', zIndex: 99, width: '44px', height: '44px',
            borderRadius: '50%', background: '#fff', border: `2px solid ${cfg.chipBorder}`,
            color: cfg.primary, fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.2s',
          }}>‹</button>
          <button onClick={() => changeSubject('right')} style={{
            position: 'fixed', top: '50%', right: '14px', zIndex: 99, width: '44px', height: '44px',
            borderRadius: '50%', background: '#fff', border: `2px solid ${cfg.chipBorder}`,
            color: cfg.primary, fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', transition: 'all 0.2s',
          }}>›</button>
        </>
      )}

      <div style={{ background: cfg.bg, minHeight: '100vh', transition: 'background 0.5s' }}>

        {/* ── HERO ── */}
        <div key={activeSubject} style={{
          minHeight: '100vh', position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', paddingTop: '90px', paddingBottom: '60px',
        }}>

          {/* Background lab/subject decorations */}
          {BgDecor && <BgDecor color={cfg.primary} />}

          {/* Floating equations */}
          {cfg.symbols.map((sym, i) => (
            <div key={i} style={{
              position: 'absolute', top: sym.y, left: sym.x,
              fontSize: `${sym.s}px`, fontWeight: 700,
              color: cfg.symbolColor, fontFamily: 'Georgia, serif',
              pointerEvents: 'none', userSelect: 'none',
              animation: `floatEq ${5 + i}s ease-in-out ${i * 0.5}s infinite`,
            }}>
              {sym.t}
            </div>
          ))}

          <div className="hero-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>

            {/* Orbital title area */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', width: 'min(600px, 90vw)', marginBottom: '0.5rem' }}>
              {/* Orbital rings (Physics only) */}
              {activeSubject === 'Physics' || !activeSubject ? (
                <>
                  <div style={{ position: 'absolute', width: '360px', height: '130px', border: `1.5px solid ${cfg.primary}28`, borderRadius: '50%', transform: 'rotate(-20deg)', maxWidth: '90vw' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', borderRadius: '50%', background: cfg.primary, marginLeft: '-5px', marginTop: '-5px', animation: 'orbitA 4s linear infinite', boxShadow: `0 0 8px ${cfg.primary}` }} />
                  </div>
                  <div style={{ position: 'absolute', width: '230px', height: '85px', border: `1.5px solid ${cfg.secondary}38`, borderRadius: '50%', transform: 'rotate(50deg)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', width: '7px', height: '7px', borderRadius: '50%', background: cfg.secondary, marginLeft: '-3.5px', marginTop: '-3.5px', animation: 'orbitB 2.8s linear infinite', boxShadow: `0 0 6px ${cfg.secondary}` }} />
                  </div>
                </>
              ) : null}

              {/* Subject title */}
              <h1 style={{
                fontSize: 'clamp(3rem, 9vw, 5.8rem)', fontWeight: 900,
                letterSpacing: '0.06em',
                background: cfg.gradient,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                lineHeight: 1, zIndex: 2, position: 'relative', userSelect: 'none',
                textAlign: 'center',
              }}>
                {(activeSubject || 'PHYSICS').toUpperCase()}
              </h1>
            </div>

            {/* Subtitle */}
            <p style={{ fontSize: '16px', color: '#5a5a7a', marginBottom: '0.5rem', fontWeight: 400, letterSpacing: '0.01em', textAlign: 'center' }}>
              {cfg.subtitle}
            </p>

            {/* Underline accent */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2.5rem' }}>
              <div style={{ width: '32px', height: '3px', borderRadius: '2px', background: cfg.gradient }} />
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.primary }} />
            </div>

            {/* Search bar */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '600px', padding: '0 1.5rem', marginBottom: '2.5rem' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#fff',
                border: focused ? `2px solid ${cfg.primary}` : '2px solid rgba(0,0,0,0.07)',
                borderRadius: focused && query ? '26px 26px 0 0' : '9999px',
                padding: '15px 22px',
                boxShadow: focused ? `0 0 0 4px ${cfg.primary}18, 0 6px 24px rgba(0,0,0,0.10)` : '0 4px 20px rgba(0,0,0,0.09)',
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
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '15px', color: '#1a1035', caretColor: cfg.primary }}
                />
                {query ? (
                  <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}>×</button>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/>
                  </svg>
                )}
              </div>

              {focused && query && searchResults.length > 0 && (
                <div style={{ position: 'absolute', left: '1.5rem', right: '1.5rem', top: '100%', zIndex: 50, background: '#fff', border: `2px solid ${cfg.primary}`, borderTop: 'none', borderRadius: '0 0 22px 22px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}>
                  {searchResults.slice(0, 6).map(c => (
                    <Link key={c.id} href={c.is_unlocked ? `/concepts/${c.id}` : '#'} onClick={() => setQuery('')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 18px', cursor: 'pointer', borderBottom: `1px solid ${cfg.chipBg}`, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = cfg.chipBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <div>
                          <div style={{ fontSize: '14px', color: '#1a1035', fontWeight: 500 }}>{c.concept_name}</div>
                          <div style={{ fontSize: '11px', color: '#8888aa' }}>{c.chapter_name}</div>
                        </div>
                        {needsReviewIds.has(c.id) && <div style={{ marginLeft: 'auto', fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>REVIEW</div>}
                        {!c.is_unlocked && <div style={{ marginLeft: 'auto', fontSize: '11px' }}>🔒</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {focused && query && searchResults.length === 0 && (
                <div style={{ position: 'absolute', left: '1.5rem', right: '1.5rem', top: '100%', zIndex: 50, background: '#fff', border: `2px solid ${cfg.primary}`, borderTop: 'none', borderRadius: '0 0 22px 22px', padding: '14px 18px', color: '#8888aa', fontSize: '14px' }}>
                  No topics found for "{query}"
                </div>
              )}
            </div>

            {/* Category chips — circular icons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', maxWidth: '640px', padding: '0 1.5rem', marginBottom: '3rem' }}>
              {cfg.categories.map((cat) => (
                <button key={cat} className="cat-chip" onClick={() => setQuery(cat)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: '#fff', border: `1.5px solid ${cfg.chipBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = cfg.chipBg; e.currentTarget.style.borderColor = cfg.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = cfg.chipBorder; }}
                  >
                    {getIcon(cat, cfg.primary)}
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#3a3a5a', textAlign: 'center', lineHeight: 1.3, maxWidth: '80px' }}>
                    {cat}
                  </span>
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

            {/* Scroll to explore */}
            <button className="scroll-btn" onClick={scrollToContent} style={{
              display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'column',
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
              fontSize: '13px', fontWeight: 500, color: cfg.primary, transition: 'all 0.2s',
            }}>
              Scroll to {activeSubject === 'Chemistry' ? 'explore' : 'discover'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
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

          {!loading && query && (
            <>
              <div style={{ fontSize: '13px', color: cfg.primary, marginBottom: '1.25rem', fontWeight: 600 }}>
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{query}"
              </div>
              {searchResults.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#8888aa', padding: '2rem', background: '#fff', borderRadius: '16px' }}>No topics match</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                  {searchResults.map(c => { const rev = homeData.needs_review.find(r => r.id === c.id); return <ConceptCard key={c.id} c={c} errorCount={rev ? parseInt(rev.error_count) : 0} />; })}
                </div>
              )}
            </>
          )}

          {!loading && !query && (
            <>
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

              {homeData.needs_review.length > 0 && (
                <section style={{ marginBottom: '2.5rem' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1035', marginBottom: '1rem' }}>⚠ Needs Review</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                    {concepts.filter(c => needsReviewIds.has(c.id)).map(c => { const rev = homeData.needs_review.find(r => r.id === c.id); return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />; })}
                  </div>
                </section>
              )}

              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1035' }}>{activeSubject ? `${activeSubject} Topics` : 'All Topics'}</h2>
                  <span style={{ fontSize: '12px', color: cfg.primary, fontWeight: 700, background: cfg.chipBg, padding: '2px 10px', borderRadius: '9999px' }}>{concepts.length}</span>
                </div>
                {concepts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{cfg.icon}</div>
                    <div style={{ color: '#1a1035', fontWeight: 600, marginBottom: '6px', fontSize: '16px' }}>No {activeSubject} topics yet</div>
                    <div style={{ color: '#8888aa', fontSize: '13px' }}>Topics for this subject are coming soon.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: '1rem' }}>
                    {concepts.map(c => { const rev = homeData.needs_review.find(r => r.id === c.id); return <ConceptCard key={c.id} c={c} errorCount={parseInt(rev?.error_count || 0)} />; })}
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
