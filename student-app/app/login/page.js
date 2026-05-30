'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import { saveAuth, isLoggedIn } from '../../src/lib/auth';
import GokooLogo from '../../src/components/GokooLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/concepts');
  }, []);

  const login = async (e) => {
    e.preventDefault();
    const label = tab === 'phone' ? 'mobile number' : 'email address';
    if (!identifier.trim()) { setError(`Please enter your ${label}`); return; }
    if (!password.trim()) { setError('Please enter your password'); return; }
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError('Please complete the CAPTCHA verification'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password, captchaToken }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Login failed');
        recaptchaRef.current?.reset();
        setCaptchaToken('');
        return;
      }
      saveAuth(data.token, data.student);
      router.replace('/concepts');
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const switchTab = (t) => {
    setTab(t);
    setIdentifier('');
    setError('');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg,#08061a 0%,#12103a 100%)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <GokooLogo size="lg" dark />
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

          <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Welcome back 👋</h2>
          <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Login to continue your learning journey.
          </p>

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px', marginBottom: '1.5rem' }}>
            {[{ key: 'phone', label: '📱 Phone' }, { key: 'email', label: '✉ Email' }].map(t => (
              <button key={t.key} type="button" onClick={() => switchTab(t.key)} style={{
                flex: 1, padding: '8px', fontSize: '13px', fontWeight: tab === t.key ? 700 : 500,
                border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.key ? '#6c63ff' : 'transparent',
                color: tab === t.key ? '#fff' : '#9090a8',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={login}>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>
                {tab === 'phone' ? 'Mobile Number' : 'Email Address'}
              </label>
              {tab === 'phone' ? (
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9090a8', fontWeight: 600, pointerEvents: 'none' }}>+91</span>
                  <input
                    type="tel" value={identifier}
                    onChange={e => setIdentifier(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="10-digit mobile number" maxLength={10} autoFocus
                    style={{ paddingLeft: '48px', fontSize: '15px', letterSpacing: '0.05em' }}
                  />
                </div>
              ) : (
                <input
                  type="email" value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="your@email.com" autoFocus
                  style={{ fontSize: '15px' }}
                />
              )}
            </div>

            <div className="form-group">
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{ fontSize: '15px', paddingRight: '48px' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '16px', padding: 0,
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {RECAPTCHA_SITE_KEY && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={token => setCaptchaToken(token || '')}
                  onExpired={() => setCaptchaToken('')}
                  theme="dark"
                />
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, marginTop: '4px' }}
              disabled={loading || (RECAPTCHA_SITE_KEY && !captchaToken)}>
              {loading ? 'Logging in...' : 'Login →'}
            </button>

            <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '13px', color: '#6b6b80' }}>
              <span onClick={() => router.push('/forgot-password')} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Forgot password?</span>
            </p>
            <p style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '13px', color: '#6b6b80' }}>
              New student?{' '}
              <span onClick={() => { window.location.href = 'https://gokoo.in'; }} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Browse Courses</span>
            </p>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b6b80', marginTop: '1.5rem' }}>
          By continuing you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08061a', color: '#9090a8' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
