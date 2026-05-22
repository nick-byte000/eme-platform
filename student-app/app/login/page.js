'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import { saveAuth, isLoggedIn } from '../../src/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';
const TEST_LOGIN_SECRET = process.env.NEXT_PUBLIC_TEST_LOGIN_SECRET || '';

function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const recaptchaRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn()) router.replace('/concepts');
  }, []);

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim().length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError('Please complete the CAPTCHA verification'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: '_login_', captchaToken }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.error?.includes('Name is required')) {
          setError('No account found with this number. Please enroll first.');
        } else {
          setError(data.error || 'Failed to send OTP');
        }
        return;
      }
      if (data.is_new_user) {
        setError('No account found. Please enroll first.');
        recaptchaRef.current?.reset();
        setCaptchaToken('');
        return;
      }
      setSmsSent(!!data.sms_sent);
      setDevOtp(data.dev_otp || '');
      setStep(2);
    } catch { setError('Server error. Please try again.'); }
    finally {
      setLoading(false);
      recaptchaRef.current?.reset();
      setCaptchaToken('');
    }
  };

  const testLogin = async () => {
    if (!TEST_LOGIN_SECRET) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/test-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: TEST_LOGIN_SECRET }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Test login failed'); return; }
      saveAuth(data.token, data.student);
      router.replace('/concepts');
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'OTP verification failed'); return; }
      saveAuth(data.token, data.student);
      router.replace('/concepts');
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg,#08061a 0%,#12103a 100%)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #c4c0ff 0%, #6c63ff 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '4px',
          }}>GOKOO</div>
          <div style={{ color: '#9090a8', fontSize: '13px' }}>Goal of Infinity Knowledge</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
          {['Mobile', 'Verify OTP'].map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 2 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '14px' : '13px', fontWeight: 700,
                    background: done ? '#22c55e' : active ? '#6c63ff' : 'rgba(255,255,255,0.08)',
                    color: done || active ? '#fff' : '#6b6b80',
                    border: active ? '2px solid #a5a0ff' : 'none',
                    boxShadow: active ? '0 0 16px rgba(108,99,255,0.4)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '10px', color: active ? '#a5a0ff' : done ? '#22c55e' : '#6b6b80', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {s < 2 && (
                  <div style={{ flex: 1, height: '2px', margin: '0 6px', marginBottom: '16px', background: done ? '#22c55e' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

          {/* ── Step 1: Mobile ── */}
          {step === 1 && (
            <form onSubmit={sendOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Welcome back 👋</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Enter your registered mobile number to receive a verification code.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9090a8', fontWeight: 600, pointerEvents: 'none' }}>+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="10-digit mobile number" maxLength={10} autoFocus
                    style={{ paddingLeft: '48px', fontSize: '15px', letterSpacing: '0.05em' }}
                  />
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

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, marginTop: '4px' }} disabled={loading || (RECAPTCHA_SITE_KEY && !captchaToken)}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#6b6b80' }}>
                New student?{' '}
                <span onClick={() => router.push('/')} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Browse Courses</span>
              </p>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={verifyOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Enter OTP</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                OTP sent to <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong>
                <button type="button" onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); setCaptchaToken(''); recaptchaRef.current?.reset(); }}
                  style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', textDecoration: 'underline' }}>
                  Change
                </button>
              </p>

              {smsSent ? (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📱</span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#86efac', fontWeight: 700, marginBottom: '2px' }}>OTP sent!</div>
                    <div style={{ fontSize: '12px', color: '#9090a8' }}>Check SMS on <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong></div>
                  </div>
                </div>
              ) : devOtp ? (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Dev Mode — OTP</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '0.2em', color: '#fbbf24', fontFamily: 'monospace' }}>{devOtp}</div>
                </div>
              ) : null}

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>6-Digit OTP</label>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="• • • • • •" autoFocus maxLength={6}
                  style={{ letterSpacing: '0.3em', fontSize: '24px', fontFamily: 'monospace', textAlign: 'center', padding: '14px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Verifying...' : 'Login →'}
              </button>
            </form>
          )}
        </div>

        {TEST_LOGIN_SECRET && (
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '11px', color: '#6b6b80', whiteSpace: 'nowrap' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <button onClick={testLogin} disabled={loading} style={{
              width: '100%', padding: '11px', fontSize: '13px', fontWeight: 600,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px', color: '#9090a8', cursor: 'pointer', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = '#c0c0d8'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#9090a8'; }}
            >
              🧪 Test Login (Dev Only)
            </button>
          </div>
        )}

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
