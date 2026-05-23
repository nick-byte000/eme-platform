const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.post('/', auth, async (req, res) => {
  try {
    const { boss_question_id, current_step } = req.body;
    const studentId = req.student.id;
    const nextStepNumber = current_step + 1;
    const nextStep = await pool.query('SELECT * FROM ladder_steps WHERE boss_question_id =  AND step_number =  AND is_active = true', [boss_question_id, nextStepNumber]);
    const currentClone = await pool.query('SELECT * FROM clone_questions WHERE original_step_id = (SELECT id FROM ladder_steps WHERE boss_question_id =  AND step_number = ) AND is_approved = true LIMIT 1', [boss_question_id, current_step]);
    const nextClone = nextStep.rows.length > 0 ? await pool.query('SELECT * FROM clone_questions WHERE original_step_id =  AND is_approved = true LIMIT 1', [nextStep.rows[0].id]) : { rows: [] };
    const studentPoints = await pool.query('SELECT total_points FROM students WHERE id = ', [studentId]);
    const progress = await pool.query('SELECT * FROM student_progress WHERE student_id =  AND boss_question_id = ', [studentId, boss_question_id]);
    res.json({ success: true, prefetched: { next_original_step: nextStep.rows[0] || null, current_step_clone: currentClone.rows[0] || null, next_step_clone: nextClone.rows[0] || null, student_points: studentPoints.rows[0]?.total_points || 0, progress: progress.rows[0] || null } });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

module.exports = router;