const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await pool.query('SELECT total_points, current_level FROM students WHERE id = $1', [studentId]);
    const progress = await pool.query('SELECT sp.*, bq.title FROM student_progress sp JOIN boss_questions bq ON sp.boss_question_id = bq.id WHERE sp.student_id = $1', [studentId]);
    const strongConcept = await pool.query('SELECT ls.concept_tag, COUNT(*) as correct FROM student_attempts sa JOIN ladder_steps ls ON sa.step_id = ls.id WHERE sa.student_id = $1 AND sa.is_correct = true AND sa.attempt_number = 1 GROUP BY ls.concept_tag ORDER BY correct DESC LIMIT 1', [studentId]);
    const weakConcept = await pool.query('SELECT ls.concept_tag, COUNT(*) as failures FROM student_attempts sa JOIN ladder_steps ls ON sa.step_id = ls.id WHERE sa.student_id = $1 AND sa.is_correct = false GROUP BY ls.concept_tag ORDER BY failures DESC LIMIT 1', [studentId]);
    res.json({ success: true, overall: { ...student.rows[0], strongest_concept: strongConcept.rows[0]?.concept_tag || null, weakest_concept: weakConcept.rows[0]?.concept_tag || null }, by_boss_question: progress.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/home-data', auth, async (req, res) => {
  try {
    const studentId = req.student.id;

    const recentActivity = await pool.query(
      `SELECT DISTINCT c.id, c.concept_name, c.chapter_name, MAX(sa.created_at) as last_activity
       FROM student_attempts sa
       JOIN ladder_steps ls ON sa.step_id = ls.id
       JOIN boss_questions bq ON ls.boss_question_id = bq.id
       JOIN concepts c ON bq.concept_id = c.id
       WHERE sa.student_id = $1
       GROUP BY c.id, c.concept_name, c.chapter_name
       ORDER BY last_activity DESC LIMIT 8`,
      [studentId]
    );

    const needsReview = await pool.query(
      `SELECT c.id, c.concept_name, c.chapter_name, COUNT(sa.id) as error_count
       FROM student_attempts sa
       JOIN ladder_steps ls ON sa.step_id = ls.id
       JOIN boss_questions bq ON ls.boss_question_id = bq.id
       JOIN concepts c ON bq.concept_id = c.id
       WHERE sa.student_id = $1 AND sa.is_correct = false
       GROUP BY c.id, c.concept_name, c.chapter_name
       ORDER BY error_count DESC LIMIT 6`,
      [studentId]
    );

    const inProgress = await pool.query(
      `SELECT sp.boss_question_id, sp.progress_percentage, sp.steps_completed, sp.total_steps,
              bq.title, bq.concept_id, c.concept_name, c.chapter_name
       FROM student_progress sp
       JOIN boss_questions bq ON sp.boss_question_id = bq.id
       JOIN concepts c ON bq.concept_id = c.id
       WHERE sp.student_id = $1 AND sp.is_completed = false AND sp.steps_completed > 0
       ORDER BY sp.steps_completed DESC LIMIT 4`,
      [studentId]
    );

    res.json({
      success: true,
      recent_activity: recentActivity.rows,
      needs_review: needsReview.rows,
      in_progress: inProgress.rows,
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/readiness/:bossQuestionId', auth, async (req, res) => {
  try {
    const { bossQuestionId } = req.params;
    const studentId = req.student.id;
    const attempts = await pool.query('SELECT sa.*, ls.step_number FROM student_attempts sa JOIN ladder_steps ls ON sa.step_id = ls.id WHERE sa.student_id = $1 AND sa.boss_question_id = $2 AND sa.is_correct = true AND ls.is_boss_step = false', [studentId, bossQuestionId]);
    let score = 0;
    let firstAttempt = 0, neededHint = 0, neededClone = 0, neededVideo = 0;
    attempts.rows.forEach(a => {
      if (a.attempt_number === 1 && !a.hint_opened && !a.theory_opened && !a.video_watched) { firstAttempt++; score += 100; }
      else if (a.hint_opened || a.theory_opened) { neededHint++; score += 80; }
      else if (a.clone_id) { neededClone++; score += 40; }
      else if (a.video_watched) { neededVideo++; score += 60; }
    });
    const total = attempts.rows.length || 1;
    const readinessScore = Math.round(score / total);
    const recommendation = readinessScore >= 80 ? 'You are ready for the boss question!' : readinessScore >= 60 ? 'Almost ready — review your weak concepts.' : 'Review more steps before attempting the boss question.';
    res.json({ success: true, readiness_score: readinessScore, breakdown: { steps_first_attempt: firstAttempt, steps_needed_hint: neededHint, steps_needed_clone: neededClone, steps_needed_video: neededVideo }, recommendation, can_attempt: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

module.exports = router;