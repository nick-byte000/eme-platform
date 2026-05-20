const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendOtp: sendSms } = require('../utils/sms');
require('dotenv').config();

// In-memory OTP store for users who don't exist yet
const pendingOtps = new Map();

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Name is required' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const existing = await pool.query('SELECT id FROM students WHERE phone = $1', [phone]);
    const isNewUser = existing.rows.length === 0;

    if (!isNewUser) {
      await pool.query(
        'UPDATE students SET otp = $1, otp_expires_at = $2 WHERE phone = $3',
        [otp, expiresAt, phone]
      );
    } else {
      // Store name alongside OTP for account creation at verify step
      pendingOtps.set(phone, { otp, expires: expiresAt, name: name.trim() });
    }

    // Send OTP via SMS
    const smsResult = await sendSms(phone, otp);
    const smsSent = smsResult.sent;

    // Return dev_otp only when SMS is not configured (dev/testing mode)
    res.json({
      success: true,
      is_new_user: isNewUser,
      sms_sent: smsSent,
      dev_otp: smsSent ? undefined : otp,   // hide once real SMS works
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name, parent_mobile, course_id } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, error: 'Phone and OTP are required' });

    let student = null;
    const existing = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);

    if (existing.rows.length > 0) {
      // Existing student — verify from DB
      const s = existing.rows[0];
      if (!s.otp || s.otp !== otp) {
        return res.status(400).json({ success: false, error: 'Invalid OTP' });
      }
      if (!s.otp_expires_at || new Date(s.otp_expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: 'OTP has expired' });
      }
      // Clear OTP
      await pool.query('UPDATE students SET otp = NULL, otp_expires_at = NULL WHERE id = $1', [s.id]);
      student = s;
    } else {
      // New user — verify from memory
      const pending = pendingOtps.get(phone);
      if (!pending) return res.status(400).json({ success: false, error: 'No OTP found for this phone. Please request a new one.' });
      if (pending.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });
      if (new Date(pending.expires) < new Date()) {
        pendingOtps.delete(phone);
        return res.status(400).json({ success: false, error: 'OTP has expired' });
      }
      if (!parent_mobile) {
        return res.status(400).json({ success: false, error: 'Parent mobile is required for new users' });
      }
      // Name was stored at send-otp time; body name overrides if provided
      const studentName = (name || pending.name || '').trim();
      if (!studentName) {
        return res.status(400).json({ success: false, error: 'Name is required' });
      }
      const result = await pool.query(
        'INSERT INTO students (name, phone, parent_mobile) VALUES ($1, $2, $3) RETURNING *',
        [studentName, phone, parent_mobile.trim()]
      );
      student = result.rows[0];
      pendingOtps.delete(phone);
    }

    // Optionally enroll in course
    if (course_id) {
      const course = await pool.query('SELECT * FROM courses WHERE id = $1 AND is_active = true', [course_id]);
      if (course.rows[0]) {
        await pool.query(
          'INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
          [student.id, course_id, course.rows[0].price, 'completed']
        );
      }
    }

    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true,
      token,
      student: { id: student.id, name: student.name, phone: student.phone, total_points: student.total_points, current_level: student.current_level }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Keep old routes as-is
router.post('/register', async (req, res) => {
  try {
    const { name, phone, class: studentClass, batch, target_exam, preferred_language } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }
    const existing = await pool.query('SELECT id FROM students WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Phone number already registered' });
    }
    const result = await pool.query(
      'INSERT INTO students (name, phone, class, batch, target_exam, preferred_language) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, phone, total_points, current_level',
      [name, phone, studentClass, batch, target_exam, preferred_language || 'english']
    );
    const student = result.rows[0];
    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, student, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, error: 'Name and phone are required' });
    }
    const result = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found. Please register first.' });
    }
    const student = result.rows[0];
    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, student: { id: student.id, name: student.name, phone: student.phone, total_points: student.total_points, current_level: student.current_level }, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ username, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
