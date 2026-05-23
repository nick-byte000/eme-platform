'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import { saveAuth, isLoggedIn, getToken, getStudent } from '../../src/lib/auth';
import GokooLogo from '../../src/components/GokooLogo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function EnrollForm() {
  const router = useRouter();
  const params = useSearchParams();
  const courseId = params.get('course_id');

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [payStatus, setPayStatus] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [tempStudent, setTempStudent] = useState(null);
  const recaptchaRef = useRef(null);

  const isFree = course?.price === 0;
  const STEP_LABELS = isFree
    ? ['Register', 'Verify OTP', 'Set Password']
    : ['Register', 'Verify OTP', 'Payment', 'Set Password'];

  useEffect(() => {
    if (!courseId) { router.replace('/'); return; }
    loadCourse();
    // Restore temp token if page was refreshed mid-enrollment
    const savedToken = sessionStorage.getItem('enrollTempToken');
    const savedStudent = sessionStorage.getItem('enrollTempStudent');
    if (savedToken && savedStudent) {
      try {
        setTempToken(savedToken);
        setTempStudent(JSON.parse(savedStudent));
      } catch {}
    }
  }, []);

  const loadCourse = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`);
      const data = await res.json();
      if (data.success) {
        const found = (data.courses || []).find(c => String(c.id) === String(courseId));
        if (found) {
          setCourse(found);
          if (isLoggedIn()) {
            // Already has account — skip register/OTP/password steps
            if (found.price === 0) {
              // Free course: auto-enroll immediately
              const token = getToken();
              const enrollRes = await fetch(`${API_URL}/enrollment/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ course_id: courseId }),
              });
              const enrollData = await enrollRes.json();
              if (enrollData.success || enrollData.already_enrolled) {
                router.replace('/concepts');
              }
            } else {
              setStep(3); // Go straight to payment
            }
          }
        }
      }
    } catch {}
  };

  // ── Step 1: Send OTP ──
  const sendOtp = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!phone.trim() || phone.trim().length !== 10 || !/^[6-9]\d{9}$/.test(phone.trim())) { setError('Please enter a valid 10-digit Indian mobile number'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (RECAPTCHA_SITE_KEY && !captchaToken) { setError('Please complete the CAPTCHA verification'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), captchaToken }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to send OTP'); return; }
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

  // ── Step 2: Verify OTP ──
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'OTP verification failed'); return; }
      setTempToken(data.token);
      setTempStudent(data.student);
      sessionStorage.setItem('enrollTempToken', data.token);
      sessionStorage.setItem('enrollTempStudent', JSON.stringify(data.student));
      setStep(3);
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  // ── Set Password (step 3 for free, step 4 for paid) ──
  const setPasswordStep = async (e) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    const token = tempToken || getToken();
    try {
      const res = await fetch(`${API_URL}/auth/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Failed to set password'); return; }
      sessionStorage.removeItem('enrollTempToken');
      sessionStorage.removeItem('enrollTempStudent');
      if (isFree) {
        // Free course — save auth then enroll
        saveAuth(token, tempStudent);
        await enrollFree();
      } else {
        // Paid course — auth already saved after payment, just redirect
        router.replace('/concepts');
      }
    } catch { setError('Server error. Please try again.'); }
    finally { setLoading(false); }
  };

  const enrollFree = async () => {
    try {
      const token = tempToken || getToken();
      const res = await fetch(`${API_URL}/enrollment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId }),
      });
      const data = await res.json();
      if (data.success || data.already_enrolled) {
        router.replace('/concepts');
      } else {
        setError(data.error || 'Enrollment failed');
      }
    } catch { setError('Enrollment failed. Please try again.'); }
  };

  // ── Step 4: Payment ──
  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setError('');
    setPayStatus('');
    setLoading(true);
    // Use tempToken if available (new enrollment), fall back to saved token (returning user)
    const token = tempToken || getToken();
    const student = tempStudent || getStudent();
    try {
      const orderRes = await fetch(`${API_URL}/enrollment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { setError(orderData.error || 'Failed to initiate payment'); setLoading(false); return; }
      if (orderData.already_enrolled) { router.replace('/concepts'); return; }

      const ok = await loadRazorpayScript();
      if (!ok) { setError('Payment gateway failed to load. Please try again.'); setLoading(false); return; }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'GOKOO',
        description: course?.name || 'Course Enrollment',
        order_id: orderData.order.id,
        handler: async (response) => {
          setPayStatus('Verifying payment...');
          try {
            const verifyRes = await fetch(`${API_URL}/enrollment/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                course_id: courseId,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              saveAuth(token, student);
              sessionStorage.removeItem('enrollTempToken');
              sessionStorage.removeItem('enrollTempStudent');
              setPayStatus('Payment successful! Set your password to continue...');
              setTimeout(() => { setPayStatus(''); setStep(4); setLoading(false); }, 1200);
            } else {
              setError('Payment verification failed. Contact support.');
              setLoading(false);
            }
          } catch {
            setError('Verification error. Please contact support with your payment ID.');
            setLoading(false);
          }
        },
        prefill: {
          name: student?.name || name,
          contact: student?.phone ? `+91${student.phone}` : `+91${phone}`,
          email: email || '',
        },
        theme: { color: '#6c63ff' },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setLoading(false); });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#08061a 0%,#12103a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <GokooLogo size="md" dark />
        </div>

        {/* Step bar */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const done = step > s;
            const active = step === s;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: s < STEP_LABELS.length ? 1 : 'none' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: done ? '14px' : '13px', fontWeight: 700,
                    background: done ? '#22c55e' : active ? '#6c63ff' : 'rgba(255,255,255,0.07)',
                    color: done || active ? '#fff' : '#6b6b80',
                    border: active ? '2px solid #a5a0ff' : 'none',
                    boxShadow: active ? '0 0 16px rgba(108,99,255,0.4)' : 'none',
                    transition: 'all 0.3s',
                  }}>
                    {done ? '✓' : s}
                  </div>
                  <span style={{ fontSize: '10px', whiteSpace: 'nowrap', color: active ? '#a5a0ff' : done ? '#22c55e' : '#6b6b80', fontWeight: active ? 700 : 400 }}>
                    {label}
                  </span>
                </div>
                {s < STEP_LABELS.length && (
                  <div style={{ flex: 1, height: '2px', margin: '0 6px', marginBottom: '16px', background: done ? '#22c55e' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(12px)' }}>

          {/* ── Step 1: Register ── */}
          {step === 1 && (
            <form onSubmit={sendOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Create Your Account</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Fill in your details to enroll in <strong style={{ color: '#c4c0ff' }}>{course?.name || 'this course'}</strong>.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" autoFocus style={{ fontSize: '15px' }} />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: '#9090a8', fontWeight: 600, pointerEvents: 'none' }}>+91</span>
                  <input
                    type="tel" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').substring(0, 10))}
                    placeholder="10-digit mobile number" maxLength={10}
                    style={{ paddingLeft: '48px', fontSize: '15px', letterSpacing: '0.05em' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ fontSize: '15px' }} />
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
                {loading ? 'Sending OTP...' : 'Send OTP →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '13px', color: '#6b6b80' }}>
                Already have an account?{' '}
                <span onClick={() => router.push('/login')} style={{ color: '#818cf8', cursor: 'pointer', textDecoration: 'underline' }}>Login</span>
              </p>
            </form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === 2 && (
            <form onSubmit={verifyOtp}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Verify Your Number</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                OTP sent to <strong style={{ color: '#e0e0e0' }}>+91 {phone}</strong>
                <button type="button" onClick={() => { setStep(1); setOtp(''); setDevOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', textDecoration: 'underline' }}>
                  Change
                </button>
              </p>

              {smsSent ? (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.28)', borderRadius: '12px', padding: '14px 18px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.6rem' }}>📱</span>
                  <div>
                    <div style={{ fontSize: '13px', color: '#86efac', fontWeight: 700, marginBottom: '2px' }}>OTP sent to your phone!</div>
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
                {loading ? 'Verifying...' : 'Verify →'}
              </button>
            </form>
          )}

          {/* ── Step 3: Payment (paid) or Set Password (free) ── */}
          {step === 3 && !isFree && (
            <div>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Complete Your Enrollment</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                One last step — complete payment to unlock your course.
              </p>

              {course ? (
                <>
                  <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '9999px',
                        color: course.exam_type === 'JEE' ? '#6c63ff' : '#10b981',
                        background: course.exam_type === 'JEE' ? 'rgba(108,99,255,0.18)' : 'rgba(16,185,129,0.18)',
                      }}>{course.exam_type}</span>
                      <span style={{ fontSize: '12px', color: '#9090a8' }}>Class {course.class}</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0f0ff', marginBottom: '10px' }}>{course.name}</div>
                    {course.features?.length > 0 && (
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                        {course.features.slice(0, 4).map(f => (
                          <li key={f} style={{ fontSize: '12px', color: '#b0b0c8', padding: '3px 0', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '24px', fontWeight: 900, color: '#f0f0ff' }}>₹{course.price?.toLocaleString('en-IN')}</span>
                      {course.original_price > course.price && (
                        <>
                          <span style={{ fontSize: '14px', color: '#9090a8', textDecoration: 'line-through' }}>₹{course.original_price?.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700 }}>
                            {Math.round((1 - course.price / course.original_price) * 100)}% OFF
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}
                  {payStatus && (
                    <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '1rem', fontSize: '13px', color: '#86efac', textAlign: 'center' }}>
                      {payStatus}
                    </div>
                  )}

                  <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}
                    onClick={handlePay} disabled={loading}>
                    {loading ? 'Processing...' : `Pay ₹${course.price?.toLocaleString('en-IN')} Now →`}
                  </button>

                  <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#6b6b80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🔒 Secured by Razorpay · UPI · Cards · Net Banking
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', color: '#9090a8', padding: '2rem' }}>Loading course details...</div>
              )}
            </div>
          )}

          {/* ── Set Password: step 3 (free) or step 4 (paid) ── */}
          {((step === 3 && isFree) || (step === 4 && !isFree)) && (
            <form onSubmit={setPasswordStep}>
              <h2 style={{ fontSize: '19px', fontWeight: 800, marginBottom: '6px', color: '#f0f0ff' }}>Create Password</h2>
              <p style={{ fontSize: '13px', color: '#9090a8', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                Set a password to login anytime with your phone or email.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>}

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters" autoFocus
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

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#c0c0d8' }}>Confirm Password</label>
                <input
                  type={showPass ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  style={{ fontSize: '15px' }}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Setting up...' : 'Create Password & Start Learning →'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#6b6b80', marginTop: '1.5rem' }}>
          By enrolling you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

export default function EnrollPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#08061a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9090a8' }}>Loading...</div>}>
      <EnrollForm />
    </Suspense>
  );
}
