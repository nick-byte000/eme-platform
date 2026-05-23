const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// GET /api/enrollment/my-course
router.get('/my-course', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT sc.*, c.name, c.class, c.exam_type, c.subjects, c.price FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = $1 LIMIT 1',
      [req.student.id]
    );
    res.json({ success: true, enrollment: result.rows[0] || null });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// POST /api/enrollment/create-order — creates Razorpay order
router.post('/create-order', auth, async (req, res) => {
  try {
    const { course_id } = req.body;
    const course = await pool.query('SELECT * FROM courses WHERE id = $1 AND is_active = true', [course_id]);
    if (!course.rows[0]) return res.status(404).json({ success: false, error: 'Course not found' });

    // Check already enrolled
    const existing = await pool.query(
      'SELECT 1 FROM student_courses WHERE student_id = $1 AND course_id = $2 AND payment_status = $3',
      [req.student.id, course_id, 'completed']
    );
    if (existing.rows.length > 0) return res.json({ success: true, already_enrolled: true });

    // For free courses — enroll immediately without payment
    if (course.rows[0].price === 0) {
      await pool.query(
        `INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status, enrolled_at)
         VALUES ($1, $2, 0, 'completed', NOW())
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [req.student.id, course_id]
      );
      return res.json({ success: true, already_enrolled: false, free: true });
    }

    const order = await razorpay.orders.create({
      amount: course.rows[0].price * 100, // paise
      currency: 'INR',
      receipt: `order_${req.student.id}_${course_id}_${Date.now()}`,
    });

    // Pre-insert pending row so webhook can find it by order_id
    await pool.query(
      `INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status, razorpay_order_id)
       VALUES ($1, $2, $3, 'pending', $4)
       ON CONFLICT (student_id, course_id) DO UPDATE
       SET payment_status = 'pending', razorpay_order_id = $4`,
      [req.student.id, course_id, course.rows[0].price, order.id]
    );

    res.json({ success: true, order, course: course.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// POST /api/enrollment/verify-payment — verifies signature and enrolls student
router.post('/verify-payment', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, course_id } = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment verification failed' });
    }

    const course = await pool.query('SELECT price FROM courses WHERE id = $1', [course_id]);

    await pool.query(
      `INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status, razorpay_order_id, razorpay_payment_id)
       VALUES ($1, $2, $3, 'completed', $4, $5)
       ON CONFLICT (student_id, course_id) DO UPDATE
       SET payment_status = 'completed', razorpay_order_id = $4, razorpay_payment_id = $5, enrolled_at = NOW()`,
      [req.student.id, course_id, course.rows[0]?.price || 0, razorpay_order_id, razorpay_payment_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// POST /api/enrollment/webhook — Razorpay server-to-server payment confirmation
// Must be registered in Razorpay Dashboard → Webhooks → URL: https://your-api/api/enrollment/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(200).json({ received: true }); // skip if not configured

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      // Find pending enrollment by razorpay_order_id and mark completed
      await pool.query(
        `UPDATE student_courses
         SET payment_status = 'completed', razorpay_payment_id = $1, enrolled_at = NOW()
         WHERE razorpay_order_id = $2 AND payment_status != 'completed'`,
        [payment.id, orderId]
      );
      console.log(`[Webhook] Payment captured for order ${orderId}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook] Error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
