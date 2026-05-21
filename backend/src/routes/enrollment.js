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
    res.status(500).json({ success: false, error: err.message });
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

    const order = await razorpay.orders.create({
      amount: course.rows[0].price * 100, // paise
      currency: 'INR',
      receipt: `order_${req.student.id}_${course_id}_${Date.now()}`,
    });

    res.json({ success: true, order, course: course.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
