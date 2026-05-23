const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const studentId = req.student.id;
    const { subject } = req.query;

    // Get student's enrolled course
    const enrollmentRes = await pool.query(
      'SELECT course_id FROM student_courses WHERE student_id = $1 LIMIT 1',
      [studentId]
    );
    const enrolledCourseId = enrollmentRes.rows[0]?.course_id || null;

    let query = 'SELECT * FROM concepts WHERE is_active = true';
    const params = [];

    if (subject) {
      params.push(subject);
      query += ` AND subject = $${params.length}`;
    }

    query += ' ORDER BY id';

    const concepts = await pool.query(query, params);
    const unlocked = await pool.query('SELECT concept_id FROM unlocked_chapters WHERE student_id = $1', [studentId]);
    const unlockedIds = unlocked.rows.map(r => r.concept_id);

    let rows = concepts.rows;

    // If student is enrolled in a course, filter concepts by course_ids
    if (enrolledCourseId) {
      rows = rows.filter(c =>
        !c.course_ids || c.course_ids.length === 0 || c.course_ids.includes(enrolledCourseId)
      );
    }

    const result = rows.map(c => ({
      ...c,
      is_unlocked: c.unlock_points === 0 || unlockedIds.includes(c.id)
    }));
    res.json({ success: true, concepts: result });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student.id;
    const concept = await pool.query('SELECT * FROM concepts WHERE id = $1', [id]);
    if (concept.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Concept not found' });
    }
    const bossQuestions = await pool.query('SELECT * FROM boss_questions WHERE concept_id = $1 AND is_active = true ORDER BY id', [id]);
    const progressResult = await pool.query('SELECT * FROM student_progress WHERE student_id = $1', [studentId]);
    const progressMap = {};
    progressResult.rows.forEach(p => { progressMap[p.boss_question_id] = p; });
    const bossWithProgress = bossQuestions.rows.map(bq => ({
      ...bq,
      student_progress: progressMap[bq.id] || { current_step: 1, steps_completed: 0, progress_percentage: 0, is_completed: false }
    }));
    const practiceResult = await pool.query(
      'SELECT id,question_text,option_a,option_b,option_c,option_d,correct_option,hint_text,order_index FROM practice_questions WHERE concept_id=$1 AND is_active=true ORDER BY order_index,id LIMIT 10',
      [id]
    );
    const practiceResultRow = await pool.query(
      'SELECT score,total FROM practice_results WHERE student_id=$1 AND concept_id=$2',
      [studentId, id]
    );
    res.json({
      success: true,
      concept: concept.rows[0],
      boss_questions: bossWithProgress,
      practice_questions: practiceResult.rows,
      practice_result: practiceResultRow.rows[0] || null,
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/unlock', auth, async (req, res) => {
  try {
    const { concept_id } = req.body;
    const studentId = req.student.id;
    const concept = await pool.query('SELECT * FROM concepts WHERE id = $1', [concept_id]);
    if (concept.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Concept not found' });
    }
    const student = await pool.query('SELECT total_points FROM students WHERE id = $1', [studentId]);
    const points = student.rows[0].total_points;
    const unlockPoints = concept.rows[0].unlock_points;
    if (points < unlockPoints) {
      return res.status(400).json({ success: false, error: 'Not enough points' });
    }
    await pool.query('INSERT INTO unlocked_chapters (student_id, concept_id, points_spent) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [studentId, concept_id, unlockPoints]);
    await pool.query('UPDATE students SET total_points = total_points - $1 WHERE id = $2', [unlockPoints, studentId]);
    res.json({ success: true, points_spent: unlockPoints, remaining_points: points - unlockPoints });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

module.exports = router;
