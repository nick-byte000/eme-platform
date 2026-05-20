const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student.id;
    const bossResult = await pool.query('SELECT * FROM boss_questions WHERE id = $1 AND is_active = true', [id]);
    if (bossResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Boss question not found' });
    }
    const boss = bossResult.rows[0];
    const stepsResult = await pool.query('SELECT * FROM ladder_steps WHERE boss_question_id = $1 AND is_active = true ORDER BY step_number', [id]);
    const progressResult = await pool.query('SELECT * FROM student_progress WHERE student_id = $1 AND boss_question_id = $2', [studentId, id]);
    const progress = progressResult.rows[0] || { current_step: 1, steps_completed: 0, progress_percentage: 0, is_completed: false };
    const steps = stepsResult.rows.map(step => {
      const stepProgress = progress.steps_completed >= step.step_number ? 'completed' : step.step_number === progress.current_step ? 'current' : 'locked';
      return { ...step, student_status: stepProgress };
    });
    res.json({ success: true, boss_question: boss, steps, student_progress: progress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;