const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

// GET /api/enrollment/my-course — returns the student's enrolled course
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

// POST /api/enrollment/enroll — enroll in a course
router.post('/enroll', auth, async (req, res) => {
  try {
    const { course_id } = req.body;
    const course = await pool.query('SELECT * FROM courses WHERE id = $1 AND is_active = true', [course_id]);
    if (!course.rows[0]) return res.status(404).json({ success: false, error: 'Course not found' });
    await pool.query(
      'INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [req.student.id, course_id, course.rows[0].price, 'completed']
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
