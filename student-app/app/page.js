'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '../src/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function LandingPage() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace('/concepts');
      return;
    }
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`);
      const data = await res.json();
      if (data.success) setCourses(data.courses || []);
    } catch (e) {
      console.error('Failed to load courses', e);
    } finally {
      setLoading(false);
    }
  };

  const SUBJECT_COLORS = {
    Physics: '#6c63ff',
    Chemistry: '#10b981',
    Mathematics: '#3b82f6',
    Botany: '#22c55e',
    Zoology: '#f59e0b',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a' }}>
      {/* Hero */}
      <div style={{
        textAlign: 'center',
        padding: '5rem 2rem 3rem',
        background: 'linear-gradient(180deg, rgba(108,99,255,0.1) 0%, transparent 100%)',
      }}>
        <div style={{
          display: 'inline-block',
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#6c63ff',
          background: 'rgba(108,99,255,0.12)',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: '9999px',
          padding: '4px 14px',
          marginBottom: '1.5rem',
        }}>
          AI-Powered Learning
        </div>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #c4c0ff 0%, #6c63ff 40%, #8b5cf6 70%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          GOKOO
        </h1>
        <p style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#e0e0e0',
          marginBottom: '0.75rem',
          letterSpacing: '-0.01em',
        }}>
          Goal of Knowledge
        </p>
        <p style={{ fontSize: '16px', color: '#9090a8', maxWidth: '560px', margin: '0 auto 2.5rem' }}>
          Adaptive ladder-based questions that build your understanding step by step.
          Master every concept for JEE and NEET.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="btn-primary"
          style={{ padding: '14px 36px', fontSize: '16px', fontWeight: 700 }}
        >
          Start Learning Free
        </button>
      </div>

      {/* Course Cards */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center', color: '#e0e0e0' }}>
          Choose Your Course
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#9090a8', padding: '3rem' }}>Loading courses...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {courses.map(course => (
              <div
                key={course.id}
                className="card"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  border: '1px solid rgba(108,99,255,0.15)',
                  transition: 'border 0.2s, transform 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.border = '1px solid rgba(108,99,255,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(108,99,255,0.15)'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: course.exam_type === 'JEE' ? '#6c63ff' : '#10b981',
                      background: course.exam_type === 'JEE' ? 'rgba(108,99,255,0.15)' : 'rgba(16,185,129,0.15)',
                      padding: '2px 10px', borderRadius: '9999px',
                    }}>
                      {course.exam_type}
                    </span>
                    <span style={{ fontSize: '12px', color: '#9090a8' }}>Class {course.class}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#e0e0e0', lineHeight: 1.3 }}>{course.name}</h3>
                </div>

                {/* Subjects */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(course.subjects || []).map(s => (
                    <span key={s} style={{
                      fontSize: '11px', fontWeight: 600,
                      color: SUBJECT_COLORS[s] || '#9090a8',
                      background: `${SUBJECT_COLORS[s] || '#9090a8'}18`,
                      border: `1px solid ${SUBJECT_COLORS[s] || '#9090a8'}30`,
                      padding: '2px 8px', borderRadius: '9999px',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>

                {/* Features */}
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', flex: 1 }}>
                  {(course.features || []).map(f => (
                    <li key={f} style={{ fontSize: '13px', color: '#b0b0c8', padding: '3px 0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0, marginTop: '1px' }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Pricing */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#e0e0e0' }}>₹{course.price?.toLocaleString('en-IN')}</span>
                  {course.original_price > 0 && (
                    <span style={{ fontSize: '14px', color: '#9090a8', textDecoration: 'line-through' }}>₹{course.original_price?.toLocaleString('en-IN')}</span>
                  )}
                  {course.original_price > course.price && (
                    <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>
                      {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                    </span>
                  )}
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '14px', fontWeight: 700 }}
                  onClick={() => router.push(`/login?course_id=${course.id}`)}
                >
                  Get Started
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
