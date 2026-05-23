'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStudent, clearAuth } from '../lib/auth';
import GokooLogo from './GokooLogo';

const SUBJECT_CONFIG = {
  Physics:     { primary: '#6c5ce7', chipBg: '#ede9ff', chipBorder: '#c4b9ff', gradient: 'linear-gradient(135deg, #4776e6, #6c5ce7)' },
  Chemistry:   { primary: '#059669', chipBg: '#d1fae5', chipBorder: '#6ee7b7', gradient: 'linear-gradient(135deg, #0d9488, #059669)' },
  Mathematics: { primary: '#2563eb', chipBg: '#dbeafe', chipBorder: '#93c5fd', gradient: 'linear-gradient(135deg, #1e3a8a, #2563eb)' },
  Biology:     { primary: '#16a34a', chipBg: '#dcfce7', chipBorder: '#86efac', gradient: 'linear-gradient(135deg, #14532d, #16a34a)' },
  Botany:      { primary: '#16a34a', chipBg: '#dcfce7', chipBorder: '#86efac', gradient: 'linear-gradient(135deg, #14532d, #16a34a)' },
  Zoology:     { primary: '#16a34a', chipBg: '#dcfce7', chipBorder: '#86efac', gradient: 'linear-gradient(135deg, #14532d, #16a34a)' },
};
const DEFAULT_CFG = SUBJECT_CONFIG.Physics;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState(null);
  const [cfg, setCfg] = useState(DEFAULT_CFG);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    setStudent(getStudent());
    if (typeof window !== 'undefined') {
      const subject = localStorage.getItem('activeSubject');
      if (subject && SUBJECT_CONFIG[subject]) setCfg(SUBJECT_CONFIG[subject]);
    }
  }, [pathname]);

  const logout = () => { clearAuth(); router.push('/login'); };

  if (!student) return null;

  const links = [
    { href: '/concepts', label: 'Concepts' },
    { href: '/progress', label: 'Progress' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="gokoo-navbar" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 1.75rem', height: '58px',
      background: 'rgba(255,255,255,0.97)',
      borderBottom: `2px solid ${cfg.chipBorder}`,
      position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(16px)',
      boxShadow: `0 2px 16px ${cfg.primary}12`,
    }}>

      {/* Brand */}
      <Link href="/concepts" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <GokooLogo size="sm" />
      </Link>

      {/* Nav links — moves to second row on mobile via CSS */}
      <div className="gokoo-nav-links" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {links.map(l => {
          const isActive = pathname === l.href || (l.href !== '/concepts' && pathname.startsWith(l.href)) || (l.href === '/concepts' && (pathname === '/concepts' || pathname.startsWith('/concepts/')));
          return (
            <Link key={l.href} href={l.href}
              onMouseEnter={() => setHovered(l.href)}
              onMouseLeave={() => setHovered(null)}
              style={{
                color: isActive ? cfg.primary : hovered === l.href ? cfg.primary : '#6b7280',
                textDecoration: 'none', padding: '6px 13px', borderRadius: '8px',
                fontSize: '13px', fontWeight: isActive ? 700 : 500,
                background: isActive ? cfg.chipBg : hovered === l.href ? `${cfg.chipBg}88` : 'transparent',
                border: isActive ? `1.5px solid ${cfg.chipBorder}` : '1.5px solid transparent',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}>
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Right: points + name + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{
          background: cfg.chipBg, color: cfg.primary,
          border: `1.5px solid ${cfg.chipBorder}`,
          padding: '4px 10px', borderRadius: '20px',
          fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {student.total_points ?? 0} pts
        </span>
        <span className="gokoo-nav-name" style={{ color: '#374151', fontSize: '13px', fontWeight: 500, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {student.name}
        </span>
        <button onClick={logout} style={{
          padding: '5px 10px', fontSize: '12px', fontWeight: 500,
          background: 'transparent',
          border: `1.5px solid ${cfg.chipBorder}`,
          color: '#6b7280', borderRadius: '8px', cursor: 'pointer',
          transition: 'all 0.15s', whiteSpace: 'nowrap',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = cfg.chipBg; e.currentTarget.style.color = cfg.primary; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
