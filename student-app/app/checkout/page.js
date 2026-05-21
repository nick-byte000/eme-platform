'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getToken, getStudent, isLoggedIn } from '../../src/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function CheckoutForm() {
  const router = useRouter();
  const params = useSearchParams();
  const courseId = params.get('course_id');

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!isLoggedIn()) { router.replace(`/login?course_id=${courseId}`); return; }
    if (!courseId) { router.replace('/concepts'); return; }
    loadCourse();
  }, []);

  const loadCourse = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`);
      const data = await res.json();
      if (data.success) {
        const found = (data.courses || []).find(c => String(c.id) === String(courseId));
        if (found) setCourse(found);
        else router.replace('/concepts');
      }
    } catch {
      setError('Failed to load course details.');
    }
  };

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
    setLoading(true);
    try {
      const token = getToken();
      const student = getStudent();

      // Create order on backend
      const orderRes = await fetch(`${API_URL}/enrollment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course_id: courseId }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { setError(orderData.error || 'Failed to create order'); setLoading(false); return; }
      if (orderData.already_enrolled) { router.replace('/concepts'); return; }

      // Load Razorpay script
      const ok = await loadRazorpayScript();
      if (!ok) { setError('Failed to load payment gateway. Please try again.'); setLoading(false); return; }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'GOKOO',
        description: course.name,
        order_id: orderData.order.id,
        handler: async (response) => {
          setStatus('Verifying payment...');
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
              setStatus('Payment successful! Redirecting...');
              setTimeout(() => router.replace('/concepts'), 1500);
            } else {
              setError('Payment verification failed. Contact support.');
              setLoading(false);
            }
          } catch {
            setError('Verification error. Contact support with your payment ID.');
            setLoading(false);
          }
        },
        prefill: {
          name: student?.name || '',
          contact: student?.phone ? `+91${student.phone}` : '',
        },
        theme: { color: '#6c63ff' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setError('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setLoading(false);
    }
  };

  if (!course) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d1a', color: '#9090a8' }}>
        Loading...
      </div>
    );
  }

  const savings = course.original_price > course.price ? course.original_price - course.price : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '460px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, #c4c0ff 0%, #6c63ff 50%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>GOKOO</div>
          <div style={{ color: '#9090a8', fontSize: '12px' }}>Secure Checkout</div>
        </div>

        <div className="card" style={{ border: '1px solid rgba(108,99,255,0.2)', background: 'rgba(255,255,255,0.04)' }}>

          {/* Course summary */}
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '9999px',
                color: course.exam_type === 'JEE' ? '#6c63ff' : '#10b981',
                background: course.exam_type === 'JEE' ? 'rgba(108,99,255,0.15)' : 'rgba(16,185,129,0.15)',
              }}>{course.exam_type}</span>
              <span style={{ fontSize: '12px', color: '#9090a8' }}>Class {course.class}</span>
            </div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: '#f0f0ff', marginBottom: '6px' }}>{course.name}</div>
            {course.description && (
              <div style={{ fontSize: '13px', color: '#9090a8', lineHeight: 1.5 }}>{course.description}</div>
            )}
          </div>

          {/* Features */}
          {course.features?.length > 0 && (
            <ul style={{ margin: '0 0 1.5rem', padding: 0, listStyle: 'none' }}>
              {course.features.map(f => (
                <li key={f} style={{ fontSize: '13px', color: '#b0b0c8', padding: '4px 0', display: 'flex', gap: '8px' }}>
                  <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
          )}

          {/* Pricing */}
          <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#9090a8', fontSize: '14px' }}>Course Price</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {course.original_price > course.price && (
                  <span style={{ fontSize: '13px', color: '#9090a8', textDecoration: 'line-through' }}>
                    ₹{course.original_price?.toLocaleString('en-IN')}
                  </span>
                )}
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#f0f0ff' }}>
                  ₹{course.price?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            {savings > 0 && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: '#22c55e', textAlign: 'right' }}>
                You save ₹{savings.toLocaleString('en-IN')} ({Math.round((savings / course.original_price) * 100)}% OFF)
              </div>
            )}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem', fontSize: '13px' }}>{error}</div>
          )}
          {status && (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '10px', padding: '12px', marginBottom: '1rem', fontSize: '13px', color: '#86efac', textAlign: 'center' }}>
              {status}
            </div>
          )}

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: 700 }}
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay ₹${course.price?.toLocaleString('en-IN')} →`}
          </button>

          <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '12px', color: '#6b6b80', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span>🔒</span> Secured by Razorpay · UPI · Cards · Net Banking
          </div>
        </div>

        <button
          onClick={() => router.back()}
          style={{ display: 'block', margin: '1rem auto 0', background: 'none', border: 'none', color: '#9090a8', cursor: 'pointer', fontSize: '13px' }}
        >
          ← Go Back
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0d0d1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9090a8' }}>Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  );
}
