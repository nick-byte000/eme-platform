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
  Algebra: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="20" x2="3" y2="4"/><polyline points="3,4 2,6 4,6 3,4"/><line x1="3" y1="20" x2="21" y2="20"/><polyline points="21,20 19,19 19,21 21,20"/><path d="M5 16 Q9 8 13 12 Q17 16 21 8"/></svg>,
  Geometry: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12,3 22,20 2,20"/><line x1="12" y1="20" x2="12" y2="11"/><line x1="12" y1="17" x2="14" y2="17"/><line x1="12" y1="17" x2="12" y2="15"/></svg>,
  Calculus: (c) => <svg width="28" height="28" viewBox="0 0 26 26" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M5 4C3 4 2 6 2 13s1 9 3 9"/><path d="M21 4c2 0 3 2 3 9s-1 9-3 9"/><text x="7" y="17" fontSize="9" fontFamily="serif" fill={c} stroke="none">∫x dx</text></svg>,
  Statistics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="14" width="4" height="7" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>,
  'Discrete Math': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="12" r="7"/><circle cx="15" cy="12" r="7"/></svg>,
  'Number Theory': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round"><text x="3" y="18" fontSize="18" fontFamily="serif" fill={c} stroke="none" fontWeight="400">π</text></svg>,
  // Biology / Botany / Zoology
  Botany: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22V12"/><path d="M12 12C12 6 6 4 3 6c3 1 6 4 9 6"/><path d="M12 12c0-6 6-8 9-6-3 1-6 4-9 6"/></svg>,
  Genetics: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M7 3c5 3 5 6.5 0 9.5S2 18.5 7 21"/><path d="M17 3c-5 3-5 6.5 0 9.5s5 6 0 9"/><line x1="8.5" y1="7" x2="15.5" y2="7"/><line x1="8.5" y1="12" x2="15.5" y2="12"/><line x1="8.5" y1="17" x2="15.5" y2="17"/></svg>,
  'Cell Biology': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="3"/><circle cx="8" cy="8" r="1.2" fill={c}/><circle cx="16" cy="9" r="1" fill={c}/><circle cx="7" cy="15" r="1" fill={c}/></svg>,
  'Human Biology': (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="5" r="2.5"/><path d="M12 7.5v6"/><path d="M9 10h6"/><path d="M12 13.5l-2.5 5"/><path d="M12 13.5l2.5 5"/></svg>,
  Evolution: (c) => <svg width="28" height="28" viewBox="0 0 26 20" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round"><circle cx="3" cy="14" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="21" cy="6" r="2"/><line x1="5" y1="14" x2="7" y2="12"/><line x1="11" y1="12" x2="13" y2="9"/><line x1="17" y1="9" x2="19" y2="6"/><polyline points="19,3 23,6 19,9"/></svg>,
  Microbiology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M6 3h12v2l2 2v10l-2 2H6l-2-2V7l2-2V3z"/><circle cx="12" cy="12" r="3"/><line x1="10" y1="21" x2="10" y2="23"/><line x1="14" y1="21" x2="14" y2="23"/><line x1="8" y1="22" x2="16" y2="22"/></svg>,
  Ecology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M12 22V12"/><path d="M12 12C10 8 6 7 3 9c2 1 6 3 9 3"/><path d="M12 12c2-4 6-5 9-3-2 1-6 3-9 3"/><path d="M12 16c-2-2-5-2-7-1 1 1 4 2 7 1"/></svg>,
  Morphology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="4" ry="2.5"/></svg>,
  Anatomy: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="7" r="4"/><path d="M8 14l-3 8"/><path d="M16 14l3 8"/><line x1="8" y1="16" x2="16" y2="16"/></svg>,
  Physiology: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><path d="M3 12 Q5 8 8 12 Q11 16 12 12 Q13 8 16 12 Q19 16 21 12"/></svg>,
  Reproduction: (c) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="12" r="5"/><circle cx="16" cy="12" r="3"/><line x1="19" y1="9" x2="21" y2="7"/><line x1="19" y1="15" x2="21" y2="17"/></svg>,
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

const MathematicsBg = ({ color }) => (
  <>
    {/* Full-width coordinate axes */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.09, pointerEvents: 'none' }} preserveAspectRatio="xMidYMid slice" viewBox="0 0 1400 800">
      {/* Y axis */}
      <line x1="700" y1="60" x2="700" y2="680" stroke={color} strokeWidth="1.5"/>
      <polygon points="700,48 694,66 706,66" fill={color}/>
      <text x="712" y="78" fill={color} fontSize="22" fontStyle="italic" fontFamily="serif">y</text>
      {/* X axis */}
      <line x1="80" y1="400" x2="1320" y2="400" stroke={color} strokeWidth="1.5"/>
      <polygon points="1332,400 1314,394 1314,406" fill={color}/>
      <text x="1300" y="428" fill={color} fontSize="22" fontStyle="italic" fontFamily="serif">x</text>
      {/* Sine wave 1 */}
      <path d="M100 400 Q200 260,350 400 Q500 540,650 400 Q800 260,950 400 Q1100 540,1200 400 Q1280 310,1350 370" fill="none" stroke={color} strokeWidth="2"/>
      {/* Cosine wave (offset) */}
      <path d="M100 310 Q200 200,350 310 Q500 420,650 310 Q800 200,950 310 Q1100 420,1200 310" fill="none" stroke={color} strokeWidth="1.2" strokeDasharray="6 4"/>
    </svg>

    {/* Left top: circle with inscribed right triangle */}
    <svg style={{ position: 'absolute', left: '3%', top: '10%', width: '180px', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 200 200" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="100" cy="100" r="88"/>
      <polygon points="18,175 188,175 188,22"/>
      <rect x="172" y="159" width="16" height="16"/>
    </svg>

    {/* Left bottom: 3D polyhedron */}
    <svg style={{ position: 'absolute', left: '1%', bottom: '8%', width: '145px', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 160 180" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="80,10 155,55 155,125 80,170 5,125 5,55"/>
      <line x1="80" y1="10" x2="80" y2="90"/>
      <line x1="155" y1="55" x2="80" y2="90"/>
      <line x1="155" y1="125" x2="80" y2="90"/>
      <line x1="80" y1="170" x2="80" y2="90"/>
      <line x1="5" y1="125" x2="80" y2="90"/>
      <line x1="5" y1="55" x2="80" y2="90"/>
    </svg>

    {/* Right top: 3D wireframe cube */}
    <svg style={{ position: 'absolute', right: '3%', top: '8%', width: '165px', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 180 170" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Front face */}
      <rect x="40" y="70" width="90" height="85" rx="2"/>
      {/* Top face */}
      <polygon points="40,70 85,30 175,30 130,70"/>
      {/* Right face */}
      <polygon points="130,70 175,30 175,115 130,155"/>
    </svg>

    {/* Right middle: 3D surface/wave plot */}
    <svg style={{ position: 'absolute', right: '2%', top: '48%', width: '190px', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 220 130" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M10 90 Q55 45,110 65 Q160 85,210 50"/>
      <path d="M10 105 Q55 60,110 80 Q160 100,210 65"/>
      <path d="M10 118 Q55 75,110 95 Q160 115,210 80"/>
      <path d="M35 118 Q45 70,60 40"/>
      <path d="M75 118 Q85 72,100 42"/>
      <path d="M115 118 Q125 80,140 55"/>
      <path d="M155 118 Q165 88,180 62"/>
    </svg>

    {/* Right bottom: infinity symbol */}
    <svg style={{ position: 'absolute', right: '3%', bottom: '6%', width: '170px', opacity: 0.14, pointerEvents: 'none' }} viewBox="0 0 220 110" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round">
      <path d="M110 55 C110 28,70 10,45 30 C20 50,20 75,45 85 C70 95,110 77,110 55 C110 28,150 10,175 30 C200 50,200 75,175 85 C150 95,110 77,110 55Z"/>
    </svg>
  </>
);

const BiologyBg = ({ color }) => (
  <>
    {/* Left: DNA double helix */}
    <svg style={{ position: 'absolute', left: '1%', top: '5%', height: '55%', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 120 500" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      {/* Left strand */}
      <path d="M30 0 Q70 40, 30 80 Q-10 120, 30 160 Q70 200, 30 240 Q-10 280, 30 320 Q70 360, 30 400 Q-10 440, 30 480"/>
      {/* Right strand */}
      <path d="M90 0 Q50 40, 90 80 Q130 120, 90 160 Q50 200, 90 240 Q130 280, 90 320 Q50 360, 90 400 Q130 440, 90 480"/>
      {/* Rungs */}
      {[30,70,110,150,190,230,270,310,350,390,430,470].map((y,i) => (
        <line key={i} x1={i%2===0?35:85} y1={y} x2={i%2===0?85:35} y2={y}/>
      ))}
    </svg>

    {/* Left bottom: animal cell cross-section */}
    <svg style={{ position: 'absolute', left: '-4%', bottom: '-2%', width: '280px', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 300 300" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      {/* Cell membrane (outer) */}
      <ellipse cx="150" cy="160" rx="135" ry="120"/>
      {/* Nucleus */}
      <ellipse cx="140" cy="155" rx="50" ry="42"/>
      <ellipse cx="140" cy="155" rx="30" ry="24"/>
      {/* Mitochondria */}
      <ellipse cx="220" cy="110" rx="20" ry="10" transform="rotate(-30 220 110)"/>
      <path d="M204 104 Q212 110 204 116" strokeWidth="1.2"/>
      <ellipse cx="80" cy="200" rx="18" ry="9" transform="rotate(20 80 200)"/>
      {/* ER/vesicles */}
      <circle cx="220" cy="185" r="12"/>
      <circle cx="200" cy="210" r="8"/>
      <circle cx="175" cy="225" r="6"/>
      <circle cx="85" cy="120" r="10"/>
      <circle cx="100" cy="100" r="7"/>
      {/* Cell projections */}
      <path d="M80 60 Q60 40 50 20"/>
      <path d="M120 48 Q115 28 120 10"/>
      <path d="M50 180 Q30 185 15 175"/>
    </svg>

    {/* Right top: neuron */}
    <svg style={{ position: 'absolute', right: '1%', top: '5%', width: '220px', opacity: 0.12, pointerEvents: 'none' }} viewBox="0 0 240 200" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      {/* Cell body */}
      <circle cx="120" cy="100" r="22"/>
      {/* Dendrites */}
      <path d="M100 88 Q75 65 50 45"/>
      <path d="M100 88 Q80 70 65 45"/>
      <path d="M108 82 Q95 55 90 30"/>
      <path d="M120 78 Q120 50 125 25"/>
      <path d="M132 82 Q148 58 165 38"/>
      {/* Axon */}
      <path d="M140 112 Q175 130 210 125"/>
      <path d="M210 125 Q225 122 230 118"/>
      <path d="M210 125 Q222 132 228 140"/>
      {/* Small dots on branches */}
      <circle cx="50" cy="45" r="3" fill={color}/>
      <circle cx="65" cy="45" r="2.5" fill={color}/>
      <circle cx="90" cy="30" r="2.5" fill={color}/>
      <circle cx="125" cy="25" r="2.5" fill={color}/>
      <circle cx="165" cy="38" r="3" fill={color}/>
    </svg>

    {/* Right middle: plant leaves */}
    <svg style={{ position: 'absolute', right: '0%', top: '35%', width: '170px', opacity: 0.15, pointerEvents: 'none' }} viewBox="0 0 180 220" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      {/* Main branch */}
      <path d="M90 220 Q85 160 80 100 Q78 60 90 20"/>
      {/* Large leaf right */}
      <path d="M82 80 Q130 50 150 30 Q160 20 155 15 Q110 25 90 20 Q70 30 82 80Z"/>
      <path d="M82 80 Q120 45 155 15"/>
      {/* Large leaf left */}
      <path d="M80 120 Q30 90 15 65 Q10 55 15 50 Q55 70 80 120Z"/>
      <path d="M80 120 Q45 85 15 50"/>
      {/* Small leaf right */}
      <path d="M83 150 Q115 135 130 120 Q138 112 134 108 Q105 120 83 150Z"/>
      <path d="M83 150 Q112 130 134 108"/>
    </svg>

    {/* Right bottom: microscope */}
    <svg style={{ position: 'absolute', right: '2%', bottom: '3%', width: '160px', opacity: 0.13, pointerEvents: 'none' }} viewBox="0 0 180 240" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {/* Eyepiece */}
      <rect x="80" y="10" width="20" height="35" rx="4"/>
      {/* Arm */}
      <path d="M90 45 Q85 60 75 80 Q70 100 72 140"/>
      {/* Objective */}
      <rect x="62" y="140" width="20" height="30" rx="3"/>
      <rect x="65" y="170" width="14" height="15" rx="2"/>
      {/* Stage */}
      <rect x="40" y="185" width="80" height="10" rx="2"/>
      <line x1="60" y1="185" x2="60" y2="195"/>
      <line x1="100" y1="185" x2="100" y2="195"/>
      {/* Base */}
      <path d="M30 220 Q80 210 150 220"/>
      <line x1="30" y1="220" x2="150" y2="220"/>
      {/* Coarse focus knob */}
      <circle cx="115" cy="130" r="14"/>
      <circle cx="115" cy="130" r="8"/>
    </svg>

    {/* Floating hex cells + dots */}
    <svg style={{ position: 'absolute', right: '20%', top: '12%', width: '80px', opacity: 0.10, pointerEvents: 'none' }} viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1.5">
      <polygon points="50,5 90,27 90,73 50,95 10,73 10,27"/>
      <polygon points="50,22 72,34 72,66 50,78 28,66 28,34"/>
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
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)',
    primary: '#2563eb', secondary: '#1e3a8a',
    bg: '#f0f4ff', chipBg: '#dbeafe', chipBorder: '#93c5fd',
    symbolColor: 'rgba(37,99,235,0.11)',
    subtitle: 'Think. Solve. Discover.',
    icon: '∑',
    categories: ['Algebra','Geometry','Calculus','Statistics','Discrete Math','Number Theory'],
    symbols: [
      { t:'a²+b²=c²',         x:'15%', y:'18%', s:14 },
      { t:'eⁱᵖ + 1 = 0',      x:'72%', y:'15%', s:14 },
      { t:'x = −b±√(b²−4ac)', x:'5%',  y:'52%', s:11 },
      { t:'2a',                x:'8%',  y:'58%', s:11 },
      { t:'∑ 1/n² = π²/6',    x:'73%', y:'48%', s:12 },
    ],
    BgDecor: MathematicsBg,
  },
  Biology: {
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #16a34a 80%, #22c55e 100%)',
    primary: '#16a34a', secondary: '#14532d',
    bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac',
    symbolColor: 'rgba(22,163,74,0.10)',
    subtitle: 'Explore life. Understand living systems.',
    icon: '🌿',
    categories: ['Botany','Genetics','Cell Biology','Human Biology','Evolution','Microbiology','Ecology'],
    symbols: [
      { t:'ATP',      x:'70%', y:'14%', s:14 },
      { t:'DNA',      x:'15%', y:'16%', s:15 },
      { t:'mRNA',     x:'72%', y:'55%', s:14 },
      { t:'C₆H₁₂O₆', x:'6%',  y:'52%', s:13 },
      { t:'6CO₂+6H₂O', x:'30%', y:'88%', s:12 },
    ],
    BgDecor: BiologyBg,
  },
  Botany: {
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #16a34a 80%, #22c55e 100%)',
    primary: '#16a34a', secondary: '#14532d',
    bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac',
    symbolColor: 'rgba(22,163,74,0.10)',
    subtitle: 'Explore life. Understand living systems.',
    icon: '🌿',
    categories: ['Botany','Genetics','Cell Biology','Human Biology','Evolution','Microbiology','Ecology'],
    symbols: [
      { t:'ATP',      x:'70%', y:'14%', s:14 },
      { t:'CO₂',      x:'15%', y:'16%', s:15 },
      { t:'RuBP',     x:'72%', y:'55%', s:13 },
      { t:'C₆H₁₂O₆', x:'6%',  y:'52%', s:13 },
      { t:'6CO₂+6H₂O', x:'30%', y:'88%', s:12 },
    ],
    BgDecor: BiologyBg,
  },
  Zoology: {
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #16a34a 80%, #22c55e 100%)',
    primary: '#16a34a', secondary: '#14532d',
    bg: '#f0fdf4', chipBg: '#dcfce7', chipBorder: '#86efac',
    symbolColor: 'rgba(22,163,74,0.10)',
    subtitle: 'Explore life. Understand living systems.',
    icon: '🧬',
    categories: ['Botany','Genetics','Cell Biology','Human Biology','Evolution','Microbiology','Ecology'],
    symbols: [
      { t:'DNA',  x:'70%', y:'14%', s:15 },
      { t:'RNA',  x:'15%', y:'16%', s:15 },
      { t:'ATP',  x:'5%',  y:'52%', s:16 },
      { t:'mRNA', x:'72%', y:'55%', s:14 },
      { t:'AUG',  x:'30%', y:'88%', s:14 },
    ],
    BgDecor: BiologyBg,
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
              {['Biology','Botany','Zoology'].includes(activeSubject) ? (
                <h1 style={{
                  fontSize: 'clamp(3rem, 9vw, 5.8rem)', fontWeight: 900,
                  letterSpacing: '0.06em', lineHeight: 1, zIndex: 2, position: 'relative',
                  userSelect: 'none', textAlign: 'center', display: 'flex', alignItems: 'flex-start',
                }}>
                  {(activeSubject || 'BIOLOGY').toUpperCase().split('').map((ch, i) => (
                    <span key={i} style={{
                      background: cfg.gradient,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      position: 'relative', display: 'inline-block',
                    }}>
                      {ch}
                      {ch === 'I' && (
                        <span style={{
                          position: 'absolute', top: '-0.35em', left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '0.32em', WebkitTextFillColor: cfg.primary,
                          color: cfg.primary, lineHeight: 1,
                        }}>🌿</span>
                      )}
                    </span>
                  ))}
                </h1>
              ) : (
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
              )}
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

            {/* Scroll button */}
            <button className="scroll-btn" onClick={scrollToContent} style={{
              display: 'flex', alignItems: 'center', gap: '6px', flexDirection: 'column',
              background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
              fontSize: '13px', fontWeight: 500, color: cfg.primary, transition: 'all 0.2s',
            }}>
              {['Biology','Botany','Zoology'].includes(activeSubject) && (
                <svg width="22" height="28" viewBox="0 0 22 32" fill="none" stroke={cfg.primary} strokeWidth="1.8" strokeLinecap="round">
                  <rect x="1" y="1" width="20" height="30" rx="10"/>
                  <circle cx="11" cy="9" r="3"/>
                  <line x1="11" y1="12" x2="11" y2="18"/>
                </svg>
              )}
              Scroll to explore
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={cfg.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
