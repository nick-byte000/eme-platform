const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const pool = require('../config/database');
const { sendOtp: sendSms } = require('../utils/sms');
require('dotenv').config();

const pendingOtps = new Map();

async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip in dev when key not set
  if (!token) return false;
  try {
    const { data } = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`
    );
    return data.success === true;
  } catch {
    return false;
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, name, captchaToken } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });

    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, error: 'CAPTCHA verification failed. Please try again.' });

    // Test number auto-login (no OTP needed)
    if (process.env.TEST_LOGIN_ENABLED === 'true' && phone === '0000000000') {
      let result = await pool.query('SELECT * FROM students WHERE phone = $1', ['0000000000']);
      if (result.rows.length === 0) {
        result = await pool.query(
          'INSERT INTO students (name, phone) VALUES ($1, $2) RETURNING *',
          ['Test', '0000000000']
        );
      }
      const s = result.rows[0];
      const token = jwt.sign({ id: s.id, name: s.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({
        success: true, is_new_user: false, sms_sent: false,
        auto_token: token,
        auto_student: { id: s.id, name: s.name, phone: s.phone, total_points: s.total_points, current_level: s.current_level },
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const existing = await pool.query('SELECT id FROM students WHERE phone = $1', [phone]);
    const isNewUser = existing.rows.length === 0;

    if (isNewUser && (!name || !name.trim())) {
      return res.status(400).json({ success: false, error: 'Name is required for new students' });
    }

    if (!isNewUser) {
      await pool.query(
        'UPDATE students SET otp = $1, otp_expires_at = $2 WHERE phone = $3',
        [otp, expiresAt, phone]
      );
    } else {
      pendingOtps.set(phone, { otp, expires: expiresAt, name: name.trim() });
    }

    const smsResult = await sendSms(phone, otp);
    const smsSent = smsResult.sent;

    res.json({
      success: true,
      is_new_user: isNewUser,
      sms_sent: smsSent,
      dev_otp: smsSent ? undefined : otp,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, email, parent_mobile } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, error: 'Phone and OTP are required' });

    let student = null;
    const existing = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);

    if (existing.rows.length > 0) {
      const s = existing.rows[0];
      if (!s.otp || s.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });
      if (!s.otp_expires_at || new Date(s.otp_expires_at) < new Date()) {
        return res.status(400).json({ success: false, error: 'OTP has expired' });
      }
      await pool.query('UPDATE students SET otp = NULL, otp_expires_at = NULL WHERE id = $1', [s.id]);
      // Update email if provided and not already set
      if (email && !s.email) {
        await pool.query('UPDATE students SET email = $1 WHERE id = $2', [email.trim(), s.id]);
      }
      student = { ...s, email: email || s.email };
    } else {
      const pending = pendingOtps.get(phone);
      if (!pending) return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
      if (pending.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });
      if (new Date(pending.expires) < new Date()) {
        pendingOtps.delete(phone);
        return res.status(400).json({ success: false, error: 'OTP has expired' });
      }
      const studentName = pending.name;
      const result = await pool.query(
        'INSERT INTO students (name, phone, email, parent_mobile) VALUES ($1, $2, $3, $4) RETURNING *',
        [studentName, phone, email ? email.trim() : null, parent_mobile ? parent_mobile.trim() : null]
      );
      student = result.rows[0];
      pendingOtps.delete(phone);
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

// POST /api/auth/test-login  (only works when TEST_LOGIN_ENABLED=true)
router.post('/test-login', async (req, res) => {
  try {
    if (process.env.TEST_LOGIN_ENABLED !== 'true') {
      return res.status(403).json({ success: false, error: 'Test login is disabled' });
    }
    const { secret } = req.body;
    if (secret !== process.env.TEST_LOGIN_SECRET) {
      return res.status(401).json({ success: false, error: 'Invalid test secret' });
    }

    // Find or create test student
    let result = await pool.query('SELECT * FROM students WHERE phone = $1', ['0000000000']);
    if (result.rows.length === 0) {
      result = await pool.query(
        'INSERT INTO students (name, phone) VALUES ($1, $2) RETURNING *',
        ['Test Student', '0000000000']
      );
    }
    const student = result.rows[0];
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
