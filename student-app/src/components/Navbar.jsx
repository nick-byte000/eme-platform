'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getStudent, clearAuth } from '../lib/auth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [student, setStudent] = useState(null);

  useEffect(() => {
    setStudent(getStudent());
  }, [pathname]);

  const logout = () => {
    clearAuth();
    router.push('/login');
  };

  if (!student) return null;

  const links = [
    { href: '/concepts', label: 'Concepts' },
    { href: '/progress', label: 'Progress' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ];

  return (
    <nav className="navbar">
      <Link href="/concepts" className="navbar-brand">EME</Link>
      <div className="navbar-links">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={pathname.startsWith(l.href) ? 'active' : ''}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span className="points-badge">{student.total_points ?? 0} pts</span>
        <span style={{ color: '#9090a8', fontSize: '13px' }}>{student.name}</span>
        <button
          onClick={logout}
          style={{
            padding: '5px 12px',
            fontSize: '12px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#9090a8',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
