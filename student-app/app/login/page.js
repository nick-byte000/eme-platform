'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiCall } from '../../src/lib/api';
import { saveAuth, isLoggedIn } from '../../src/lib/auth';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const courseIdFromUrl = params.get('course_id');

  // step 1 = name + phone, 2 = otp, 3 = parent mobile (new user only)
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [parentMobile, setParentMobile] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState(courseIdFromUrl || '');
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    if (isLoggedIn()) { router.replace('/concepts'); return; }
    fetch(`${API_URL}/courses`)
      .then(r => r.json())
      .then(d => { if (d.success) setCourses(d.courses || []); })
      .catch(() => {});
  }, []);

  // ── Step 1: send OTP ──────────────────────────────────────
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!phone.trim() || phone.trim().length < 10) { setError('Please enter a valid 10-digit mobile number'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await apiCall('/auth/send-otp', 'POST', { name: name.trim(), phone: phone.trim() });
      if (!data.success) { setError(data.error || 'Failed to send OTP'); return; }
      setIsNewUser(data.is_new_user);
      setSmsSent(!!data.sms_sent);
      setDevOtp(data.dev_otp || '');
      setStep(2);
    } catch {
      setError('Server error. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ────────────────────────────────────
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    if (isNewUser) { setError(''); setStep(3); return; }
    await doVerify();
  };

  // ── Step 3: parent mobile (new user) ─────────────────────
  const submitDetails = async (e) => {
    e.preventDefault();
    if (!parentMobile.trim() || parentMobile.trim().length < 10) { setError("Please enter parent's valid 10-digit number"); return; }
    await doVerify();
  };

  const doVerify = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = {
        phone: phone.trim(),
        otp: otp.trim(),
        ...(isNewUser && { parent_mobile: parentMobile.trim() }),
        ...(selectedCourseId && { course_id: parseInt(selectedCourseId) }),
      };
      const data = await apiCall('/auth/verify-otp', 'POST', payload);
      if (!data.success) { setError(data.error || 'OTP verification failed'); return; }
      saveAuth(data.token, data.student);
      router.push('/concepts');
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Details', 'Verify OTP', 'Parent Info'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg,#08061a 0%,#12103a 100%)' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '2.8rem', fontWeight: 900,
            background: 'linear-gradient(135deg, #c4c0ff 0%, #6c63ff 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '4px', letterSpacing: '-0.02em',
          }}>GOKOO</div>
          <div style={{ color: '#9090a8', fontSize: '13px' }}>Goal of Knowledge</div>
        </div>

        {/* Step bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', gap: 0 }}>
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < 3 ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '14px' : '13px', fontWeight: 700,
                    background: done ? '#22c55e' : active ? '#6c63ff' : 'rgba(255,255,255,0.08)',
                    color: done || active ? '#fff' : '#6b6b80',
                    border: active ? '2px solid #a5a0ff' : 'none',
                    transition: 'all 0.3s',
                    boxShadow: active ? '0 0 16px rgba(108,99,255,0.4)' : 'none',
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '10px', color: active ? '#a5a0ff' : done ? '#22c55e' : '#6b6b80', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
                {s < 3 && (
                  <div style={{ flex: 1, height: '2px', margin: '0 6px', marginBottom: '16px', background: done ? '#22c55e' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

          {/* ── Step 1: Name + Phone ── */}
          {step === 1 && (
            <form onSubmit={sendOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Welcome back 👋</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Enter your registered name and mobile number to receive a verification code.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your full name"
                  autoFocus
                  style={{ fontSize: '15px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9090a8', fontWeight: 600, pointerEvents: 'none' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    style={{ paddingLeft: '48px', fontSize: '15px', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700, marginTop: '4px' }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={verifyOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Enter OTP</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                OTP sent to <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong>
                <button type="button" onClick={() => { setStep(1); setDevOtp(''); setOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', textDecoration: 'underline' }}>
                  Change
                </button>
              </p>

              {smsSent ? (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📱</span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#86efac', fontWeight: 700, marginBottom: '2px' }}>OTP sent to your phone!</div>
                    <div style={{ fontSize: '12px', color: '#9090a8' }}>Check messages on <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong></div>
                  </div>
                </div>
              ) : devOtp ? (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Dev Mode — SMS not configured</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '0.2em', color: '#fbbf24', fontFamily: 'monospace' }}>{devOtp}</div>
                </div>
              ) : null}

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>6-Digit OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="• • • • • •"
                  autoFocus
                  maxLength={6}
                  style={{ letterSpacing: '0.3em', fontSize: '24px', fontFamily: 'monospace', textAlign: 'center', padding: '14px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Verifying...' : isNewUser ? 'Continue →' : 'Verify & Login'}
              </button>
            </form>
          )}

          {/* ── Step 3: Parent mobile (new user) ── */}
          {step === 3 && (
            <form onSubmit={submitDetails}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Almost there! 🎉</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                One last detail to complete your account setup.
              </p>

              {/* Confirmed details summary */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Name</div>
                  <div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: 600 }}>{name}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ fontSize: '10px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '3px' }}>Mobile</div>
                  <div style={{ fontSize: '14px', color: '#e0e0e0', fontWeight: 600 }}>+91 {phone}</div>
                </div>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Parent's Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9090a8', fontWeight: 600, pointerEvents: 'none' }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    value={parentMobile}
                    onChange={e => setParentMobile(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="Parent's 10-digit number"
                    maxLength={10}
                    autoFocus
                    style={{ paddingLeft: '48px', fontSize: '15px', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>

              {/* Course selection only if not from a course page */}
              {!courseIdFromUrl && courses.length > 0 && (
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>
                    Course <span style={{ color: '#9090a8', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
                    <option value="">Select a course...</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} — ₹{c.price?.toLocaleString('en-IN')}</option>
                    ))}
                  </select>
                </div>
              )}

              {courseIdFromUrl && (
                <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#86efac' }}>
                  ✓ You'll be enrolled in: <strong>{courses.find(c => String(c.id) === String(courseIdFromUrl))?.name || 'Selected course'}</strong>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account & Start Learning 🚀'}
              </button>

              <button type="button" onClick={() => { setStep(2); setError(''); }}
                style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '13px' }}>
                ← Back
              </button>
            </form>
          )}
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
