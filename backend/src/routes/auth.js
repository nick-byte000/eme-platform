const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const pool = require('../config/database');
const { sendOtp: sendSms } = require('../utils/sms');
require('dotenv').config();

// Max 5 OTP requests per phone per 10 minutes
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.body.phone || req.ip,
  message: { success: false, error: 'Too many OTP requests. Please wait 10 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Max 10 login attempts per IP per 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many login attempts. Please wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// pendingOtps previously used an in-memory Map; now stored in DB (pending_otps table)

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

async function enrollTestStudentInAllCourses(studentId) {
  try {
    const courses = await pool.query('SELECT id FROM courses WHERE is_active = true');
    for (const course of courses.rows) {
      await pool.query(
        `INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status, enrolled_at)
         VALUES ($1, $2, 0, 'completed', NOW())
         ON CONFLICT (student_id, course_id) DO NOTHING`,
        [studentId, course.id]
      );
    }
  } catch (err) {
    console.error('[TEST] Auto-enroll failed:', err.message);
  }
}

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone, name, captchaToken } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone is required' });
    if (phone !== '0000000000' && !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number' });
    }

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
      await enrollTestStudentInAllCourses(s.id);
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
      await pool.query(
        `INSERT INTO pending_otps (phone, otp, name, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (phone) DO UPDATE SET otp = $2, expires_at = $4`,
        [phone, otp, name.trim(), expiresAt]
      );
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
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
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
      const pendingRes = await pool.query('SELECT * FROM pending_otps WHERE phone = $1', [phone]);
      const pending = pendingRes.rows[0];
      if (!pending) return res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
      if (pending.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });
      if (new Date(pending.expires_at) < new Date()) {
        await pool.query('DELETE FROM pending_otps WHERE phone = $1', [phone]);
        return res.status(400).json({ success: false, error: 'OTP has expired' });
      }
      const result = await pool.query(
        'INSERT INTO students (name, phone, email, parent_mobile) VALUES ($1, $2, $3, $4) RETURNING *',
        [pending.name, phone, email ? email.trim() : null, parent_mobile ? parent_mobile.trim() : null]
      );
      student = result.rows[0];
      await pool.query('DELETE FROM pending_otps WHERE phone = $1', [phone]);
    }

    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true,
      token,
      student: { id: student.id, name: student.name, phone: student.phone, total_points: student.total_points, current_level: student.current_level }
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/set-password  — sets password after OTP verification
router.post('/set-password', async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token || !password) return res.status(400).json({ success: false, error: 'Missing fields' });
    if (password.length < 6) return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE students SET password_hash = $1 WHERE id = $2', [hash, decoded.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// POST /api/auth/login  — password-based login (phone or email)
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { identifier, password, captchaToken } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, error: 'Phone/email and password are required' });

    const captchaOk = await verifyCaptcha(captchaToken);
    if (!captchaOk) return res.status(400).json({ success: false, error: 'CAPTCHA verification failed. Please try again.' });

    // Test number auto-login
    if (process.env.TEST_LOGIN_ENABLED === 'true' && identifier.trim() === '0000000000') {
      let result = await pool.query('SELECT * FROM students WHERE phone = $1', ['0000000000']);
      if (result.rows.length === 0) {
        result = await pool.query('INSERT INTO students (name, phone) VALUES ($1, $2) RETURNING *', ['Test', '0000000000']);
      }
      const s = result.rows[0];
      await enrollTestStudentInAllCourses(s.id);
      const token = jwt.sign({ id: s.id, name: s.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.json({ success: true, token, student: { id: s.id, name: s.name, phone: s.phone, total_points: s.total_points, current_level: s.current_level } });
    }

    const result = await pool.query(
      'SELECT * FROM students WHERE phone = $1 OR email = $1',
      [identifier.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'No account found. Please enroll in a course first.' });
    }
    const student = result.rows[0];
    if (!student.password_hash) {
      return res.status(401).json({ success: false, error: 'No password set. Please re-enroll to set your password.' });
    }
    const valid = await bcrypt.compare(password, student.password_hash);
    if (!valid) return res.status(401).json({ success: false, error: 'Incorrect password.' });

    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, token, student: { id: student.id, name: student.name, phone: student.phone, total_points: student.total_points, current_level: student.current_level } });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
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
    await enrollTestStudentInAllCourses(student.id);
    const token = jwt.sign({ id: student.id, name: student.name }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({
      success: true,
      token,
      student: { id: student.id, name: student.name, phone: student.phone, total_points: student.total_points, current_level: student.current_level }
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/admin/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }
    if (username !== process.env.ADMIN_USERNAME) {
      return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    }
    // Support both bcrypt hash (ADMIN_PASSWORD_HASH) and plain fallback (ADMIN_PASSWORD)
    let valid = false;
    if (process.env.ADMIN_PASSWORD_HASH) {
      valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    } else {
      valid = (password === process.env.ADMIN_PASSWORD);
    }
    if (!valid) return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
    const token = jwt.sign({ username, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

// POST /api/auth/forgot-password — sends OTP to registered phone
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, error: 'Phone number is required' });
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number' });
    }

    const result = await pool.query('SELECT id FROM students WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      // Don't reveal whether account exists — generic message
      return res.json({ success: true, sms_sent: false, message: 'If this number is registered, an OTP will be sent.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await pool.query('UPDATE students SET otp = $1, otp_expires_at = $2 WHERE phone = $3', [otp, expiresAt, phone]);

    const smsResult = await sendSms(phone, otp);
    res.json({
      success: true,
      sms_sent: smsResult.sent,
      dev_otp: smsResult.sent ? undefined : otp,
      message: 'OTP sent successfully',
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/reset-password — verify OTP then set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Phone, OTP and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const result = await pool.query('SELECT * FROM students WHERE phone = $1', [phone]);
    if (result.rows.length === 0) return res.status(400).json({ success: false, error: 'Invalid OTP' });

    const s = result.rows[0];
    if (!s.otp || s.otp !== otp) return res.status(400).json({ success: false, error: 'Invalid OTP' });
    if (!s.otp_expires_at || new Date(s.otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE students SET password_hash = $1, otp = NULL, otp_expires_at = NULL WHERE id = $2',
      [hash, s.id]
    );

    res.json({ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
