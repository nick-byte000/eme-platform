const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.post('/submit', auth, async (req, res) => {
  try {
    const studentId = req.student.id;
    const {
      boss_question_id, step_id,
      selected_options,
      time_taken_seconds,
      phase = 'main',
      hint_opened = false,
      theory_opened = false,
      video_watched = false,
      confidence = null,
    } = req.body;

    const stepResult = await pool.query('SELECT * FROM ladder_steps WHERE id = $1', [step_id]);
    if (stepResult.rows.length === 0)
      return res.status(404).json({ success: false, error: 'Step not found' });

    const step = stepResult.rows[0];

    const correctOptions = phase === 'main' ? step.correct_options : step.clone_correct_options;
    if (!correctOptions)
      return res.status(400).json({ success: false, error: `No ${phase === 'main' ? 'main' : 'clone'} question found` });

    const isCorrect = String(selected_options).toLowerCase().trim() === String(correctOptions).toLowerCase().trim();
    const isPersonalFoul = phase === 'main' && time_taken_seconds !== null && time_taken_seconds < 1;

    let pointsEarned = 0;
    if (isCorrect && !isPersonalFoul) {
      if (phase === 'main') pointsEarned = 10;
      else if (phase === 'clone') pointsEarned = 5;
      else if (phase === 'clone_hint') pointsEarned = 3;
    }
    if (isCorrect && phase === 'main' && !isPersonalFoul && time_taken_seconds <= 30) pointsEarned += 3;

    await pool.query(
      `INSERT INTO student_attempts
        (student_id, boss_question_id, step_id, selected_options, correct_options,
         is_correct, time_taken_seconds, attempt_number, hint_opened, theory_opened,
         video_watched, points_earned, confidence, is_personal_foul)
       VALUES ($1,$2,$3,$4,$5,$6,$7,
         (SELECT COUNT(*)+1 FROM student_attempts WHERE student_id=$1 AND step_id=$3 AND clone_id IS NULL),
         $8,$9,$10,$11,$12,$13)`,
      [studentId, boss_question_id, step_id,
       selected_options, correctOptions, isCorrect,
       time_taken_seconds, hint_opened, theory_opened, video_watched, pointsEarned,
       confidence, isPersonalFoul]
    );

    if (pointsEarned > 0) {
      await pool.query('UPDATE students SET total_points = total_points + $1 WHERE id = $2', [pointsEarned, studentId]);
    }

    // Update student_tier_progress on correct main answers
    if (isCorrect && phase === 'main' && !isPersonalFoul && step.tier) {
      const tierCol = step.tier.toLowerCase() + '_correct';
      const gateCol = step.tier.toLowerCase() + '_gates_passed';
      try {
        await pool.query(
          `INSERT INTO student_tier_progress (student_id, boss_question_id, ${tierCol}, ${step.is_mastery_gate ? gateCol : tierCol})
           VALUES ($1, $2, 1, ${step.is_mastery_gate ? '1' : '1'})
           ON CONFLICT (student_id, boss_question_id) DO UPDATE SET
             ${tierCol} = student_tier_progress.${tierCol} + 1,
             ${step.is_mastery_gate ? `${gateCol} = student_tier_progress.${gateCol} + 1,` : ''}
             updated_at = NOW()`,
          [studentId, boss_question_id]
        );
      } catch (e) { /* tier progress update is non-critical */ }
    }

    // Update student_progress
    let progress = null;
    if (isCorrect && phase === 'main' && !isPersonalFoul) {
      const bossResult = await pool.query('SELECT total_steps FROM boss_questions WHERE id = $1', [boss_question_id]);
      const totalSteps = bossResult.rows[0]?.total_steps || 8;

      const existing = await pool.query(
        'SELECT * FROM student_progress WHERE student_id = $1 AND boss_question_id = $2',
        [studentId, boss_question_id]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO student_progress
            (student_id, boss_question_id, current_step, steps_completed, total_steps, progress_percentage, total_points_earned)
           VALUES ($1,$2,$3,1,$4,$5,$6)`,
          [studentId, boss_question_id, step.step_number + 1, totalSteps,
           Math.round((1 / totalSteps) * 100), pointsEarned]
        );
      } else {
        const cur = existing.rows[0];
        const newCompleted = cur.steps_completed + 1;
        const isCompleted = newCompleted >= totalSteps;
        const bonusPoints = isCompleted ? 20 : 0;
        if (bonusPoints > 0) {
          await pool.query('UPDATE students SET total_points = total_points + $1 WHERE id = $2', [bonusPoints, studentId]);
        }
        await pool.query(
          `UPDATE student_progress
           SET current_step = $1, steps_completed = $2, progress_percentage = $3,
               is_completed = $4, total_points_earned = total_points_earned + $5, completed_at = $6
           WHERE student_id = $7 AND boss_question_id = $8`,
          [step.step_number + 1, newCompleted,
           Math.round((newCompleted / totalSteps) * 100),
           isCompleted, pointsEarned + bonusPoints,
           isCompleted ? new Date() : null,
           studentId, boss_question_id]
        );
        pointsEarned += bonusPoints;
      }

      const prog = await pool.query(
        'SELECT * FROM student_progress WHERE student_id = $1 AND boss_question_id = $2',
        [studentId, boss_question_id]
      );
      progress = prog.rows[0];
    }

    if (isCorrect && (phase === 'clone' || phase === 'clone_hint')) {
      const prog = await pool.query(
        'SELECT * FROM student_progress WHERE student_id = $1 AND boss_question_id = $2',
        [studentId, boss_question_id]
      );
      if (prog.rows.length > 0) {
        const bossResult = await pool.query('SELECT total_steps FROM boss_questions WHERE id = $1', [boss_question_id]);
        const totalSteps = bossResult.rows[0]?.total_steps || 8;
        const cur = prog.rows[0];
        const newCompleted = cur.steps_completed + 1;
        const isCompleted = newCompleted >= totalSteps;
        const bonusPoints = isCompleted ? 20 : 0;
        if (bonusPoints > 0) {
          await pool.query('UPDATE students SET total_points = total_points + $1 WHERE id = $2', [bonusPoints, studentId]);
          pointsEarned += bonusPoints;
        }
        await pool.query(
          `UPDATE student_progress
           SET current_step = $1, steps_completed = $2, progress_percentage = $3,
               is_completed = $4, total_points_earned = total_points_earned + $5, completed_at = $6
           WHERE student_id = $7 AND boss_question_id = $8`,
          [step.step_number + 1, newCompleted,
           Math.round((newCompleted / totalSteps) * 100),
           isCompleted, pointsEarned, isCompleted ? new Date() : null,
           studentId, boss_question_id]
        );
      } else {
        const bossResult = await pool.query('SELECT total_steps FROM boss_questions WHERE id = $1', [boss_question_id]);
        const totalSteps = bossResult.rows[0]?.total_steps || 8;
        await pool.query(
          `INSERT INTO student_progress
            (student_id, boss_question_id, current_step, steps_completed, total_steps, progress_percentage, total_points_earned)
           VALUES ($1,$2,$3,1,$4,$5,$6)`,
          [studentId, boss_question_id, step.step_number + 1, totalSteps,
           Math.round((1 / totalSteps) * 100), pointsEarned]
        );
      }
      const prog2 = await pool.query(
        'SELECT * FROM student_progress WHERE student_id = $1 AND boss_question_id = $2',
        [studentId, boss_question_id]
      );
      progress = prog2.rows[0];
    }

    const studentRow = await pool.query('SELECT total_points FROM students WHERE id = $1', [studentId]);
    const explanation = phase === 'main' ? step.explanation : step.clone_explanation;

    res.json({
      success: true,
      is_correct: isCorrect,
      is_personal_foul: isPersonalFoul,
      correct_options: correctOptions,
      explanation,
      insight_correct: step.insight_correct || null,
      insight_wrong: step.insight_wrong || null,
      tier: step.tier,
      is_mastery_gate: step.is_mastery_gate,
      theory_card: step.theory_card,
      theory_card_hinglish: step.theory_card_hinglish,
      hint_text: step.hint_text,
      video_url: step.video_url,
      points_earned: pointsEarned,
      student_total_points: studentRow.rows[0].total_points,
      progress,
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/history/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (parseInt(studentId) !== req.student.id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    const result = await pool.query(
      `SELECT sa.*, bq.title as boss_question_title, ls.step_number, ls.concept_tag
       FROM student_attempts sa
       JOIN boss_questions bq ON sa.boss_question_id = bq.id
       JOIN ladder_steps ls ON sa.step_id = ls.id
       WHERE sa.student_id = $1
       ORDER BY sa.created_at DESC LIMIT 50`,
      [studentId]
    );
    res.json({ success: true, attempts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Something went wrong' });
  }
});

module.exports = router;
