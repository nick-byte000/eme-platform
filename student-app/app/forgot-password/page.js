'use client';
import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import GokooLogo from '../../src/components/GokooLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: enter phone, 2: enter OTP + new password
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to send OTP'); return; }
      setSmsSent(!!data.sms_sent);
      setDevOtp(data.dev_otp || '');
      setStep(2);
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    if (!newPassword || newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Reset failed'); return; }
      setDone(true);
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'linear-gradient(135deg,#08061a 0%,#12103a 100%)' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
          <GokooLogo size="lg" dark />
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

          {done ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#f0f0ff', marginBottom: '8px' }}>Password Reset!</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem' }}>Your password has been updated. You can now login.</p>
              <button className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }}
                onClick={() => router.push('/login')}>
                Go to Login →
              </button>
            </div>
          ) : step === 1 ? (
            <form onSubmit={sendOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Forgot Password</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Enter your registered mobile number to receive an OTP.
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
              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>
              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#6b6b80' }}>
                Remember password?{' '}
                <span onClick={() => router.push('/login')} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Login</span>
              </p>
            </form>
          ) : (
            <form onSubmit={resetPassword}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Reset Password</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                OTP sent to <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong>
                <button type="button" onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', textDecoration: 'underline' }}>
                  Change
                </button>
              </p>

              {smsSent ? (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>📱</span>
                  <div style={{ fontSize: '12px', color: '#86efac' }}>Check SMS on <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong></div>
                </div>
              ) : devOtp ? (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Dev Mode — OTP</div>
                  <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.2em', color: '#fbbf24', fontFamily: 'monospace' }}>{devOtp}</div>
                </div>
              ) : null}

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>6-Digit OTP</label>
                <input
                  type="text" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  placeholder="• • • • • •" autoFocus maxLength={6}
                  style={{ letterSpacing: '0.3em', fontSize: '22px', fontFamily: 'monospace', textAlign: 'center', padding: '12px' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    style={{ fontSize: '15px', paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '16px', padding: 0,
                  }}>{showPass ? '🙈' : '👁'}</button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  style={{ fontSize: '15px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08061a', color: '#9090a8' }}>Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
