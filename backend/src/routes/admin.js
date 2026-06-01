const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middleware/adminAuth');

router.post('/concepts', adminAuth, async (req, res) => {
  try {
    const { subject, chapter_name, topic_name, subtopic_name, concept_name, prerequisite_concept_id, unlock_points, language, course_ids } = req.body;
    const result = await pool.query(
      'INSERT INTO concepts (subject, chapter_name, topic_name, subtopic_name, concept_name, prerequisite_concept_id, unlock_points, language, course_ids) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [subject, chapter_name, topic_name, subtopic_name, concept_name, prerequisite_concept_id, unlock_points || 0, language || 'english', course_ids || []]
    );
    res.json({ success: true, concept: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/concepts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, chapter_name, topic_name, subtopic_name, concept_name, unlock_points, language, course_ids } = req.body;
    const result = await pool.query(
      'UPDATE concepts SET subject=$1, chapter_name=$2, topic_name=$3, subtopic_name=$4, concept_name=$5, unlock_points=$6, language=$7, course_ids=$8 WHERE id=$9 RETURNING *',
      [subject, chapter_name, topic_name, subtopic_name, concept_name, unlock_points || 0, language || 'english', course_ids || [], id]
    );
    res.json({ success: true, concept: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/concepts/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE concepts SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/boss-questions', adminAuth, async (req, res) => {
  try {
    const { concept_id, subject, chapter_name, topic_name, subtopic_name, concept_name, title, question_text, question_image_url, difficulty, total_steps, target_exam, language, source, level, question_type_category } = req.body;
    const result = await pool.query(
      'INSERT INTO boss_questions (concept_id, subject, chapter_name, topic_name, subtopic_name, concept_name, title, question_text, question_image_url, difficulty, total_steps, target_exam, language, source, level, question_type_category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *',
      [concept_id, subject, chapter_name, topic_name, subtopic_name, concept_name, title, question_text, question_image_url, difficulty || 'medium', total_steps, target_exam || 'all', language || 'english', source, level || 'beginner', question_type_category || 'single_correct']
    );
    res.json({ success: true, boss_question: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/ladder-steps', adminAuth, async (req, res) => {
  try {
    const {
      boss_question_id, step_number, concept_tag, question_type, question_text,
      question_image_url, option_a, option_a_image_url, option_b, option_b_image_url,
      option_c, option_c_image_url, option_d, option_d_image_url, correct_options,
      marks, hint_text, explanation, theory_card, theory_card_hinglish, video_url, difficulty, target_exam,
      source, language, is_boss_step,
      clone_question_text, clone_option_a, clone_option_b, clone_option_c, clone_option_d,
      clone_correct_options, clone_explanation
    } = req.body;
    const result = await pool.query(
      `INSERT INTO ladder_steps
        (boss_question_id, step_number, concept_tag, question_type, question_text,
         question_image_url, option_a, option_a_image_url, option_b, option_b_image_url,
         option_c, option_c_image_url, option_d, option_d_image_url, correct_options,
         marks, hint_text, explanation, theory_card, theory_card_hinglish, video_url, difficulty, target_exam,
         source, language, is_boss_step,
         clone_question_text, clone_option_a, clone_option_b, clone_option_c, clone_option_d,
         clone_correct_options, clone_explanation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
               $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33) RETURNING *`,
      [boss_question_id, step_number, concept_tag, question_type || 'mcq', question_text,
       question_image_url, option_a, option_a_image_url, option_b, option_b_image_url,
       option_c, option_c_image_url, option_d, option_d_image_url, correct_options,
       marks || 4, hint_text, explanation, theory_card, theory_card_hinglish || null, video_url,
       difficulty || 'medium', target_exam || 'all', source, language || 'english', is_boss_step || false,
       clone_question_text, clone_option_a, clone_option_b, clone_option_c, clone_option_d,
       clone_correct_options, clone_explanation]
    );
    res.json({ success: true, step: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/ladder-steps/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => k + '=$' + (i+1)).join(', ');
    await pool.query('UPDATE ladder_steps SET ' + setClause + ', version = version + 1 WHERE id = $' + (keys.length+1), [...values, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/ladder-steps/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE ladder_steps SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/clones/pending', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT cq.*, ls.concept_tag, ls.question_text as original_question FROM clone_questions cq JOIN ladder_steps ls ON cq.original_step_id = ls.id WHERE cq.is_approved = false ORDER BY cq.created_at DESC');
    res.json({ success: true, clones: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/clones/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE clone_questions SET is_approved = true, is_prefetch_ready = true WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/clones/:id/reject', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM clone_questions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/analytics/heatmap/:bossQuestionId', adminAuth, async (req, res) => {
  try {
    const { bossQuestionId } = req.params;
    const result = await pool.query(
      'SELECT ls.step_number, ls.concept_tag, COUNT(sa.id) as total_attempts, ROUND(AVG(CASE WHEN sa.is_correct AND sa.attempt_number = 1 THEN 100 ELSE 0 END)) as first_attempt_pass_rate, ROUND(AVG(sa.time_taken_seconds)) as average_time_seconds, ROUND(AVG(CASE WHEN sa.hint_opened THEN 100 ELSE 0 END)) as hint_usage_rate, ROUND(AVG(CASE WHEN sa.video_watched THEN 100 ELSE 0 END)) as video_usage_rate, ROUND(AVG(CASE WHEN sa.clone_id IS NOT NULL THEN 100 ELSE 0 END)) as clone_trigger_rate FROM ladder_steps ls LEFT JOIN student_attempts sa ON ls.id = sa.step_id WHERE ls.boss_question_id = $1 GROUP BY ls.step_number, ls.concept_tag ORDER BY ls.step_number',
      [bossQuestionId]
    );
    res.json({ success: true, heatmap: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/question-sets', adminAuth, async (req, res) => {
  try {
    const { concept_id } = req.query;
    const bossResult = concept_id
      ? await pool.query('SELECT * FROM boss_questions WHERE concept_id = $1 AND is_active = true ORDER BY id DESC', [concept_id])
      : await pool.query('SELECT bq.*, c.concept_name, c.subject, c.chapter_name FROM boss_questions bq LEFT JOIN concepts c ON bq.concept_id = c.id WHERE bq.is_active = true ORDER BY bq.id DESC');
    const sets = await Promise.all(bossResult.rows.map(async bq => {
      const stepsResult = await pool.query(
        'SELECT * FROM ladder_steps WHERE boss_question_id = $1 AND is_active = true ORDER BY step_number',
        [bq.id]
      );
      return { ...bq, steps: stepsResult.rows };
    }));
    res.json({ success: true, sets });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/boss-questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, question_text, question_image_url } = req.body;
    await pool.query('UPDATE boss_questions SET title=$1, question_text=$2, question_image_url=$3 WHERE id=$4', [title, question_text, question_image_url || null, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/boss-questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE ladder_steps SET is_active = false WHERE boss_question_id = $1', [id]);
    await pool.query('UPDATE boss_questions SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

router.get('/concepts-list', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM concepts WHERE is_active = true ORDER BY id DESC');
    res.json({ success: true, concepts: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/students', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT s.*, COUNT(sp.id) as ladders_completed FROM students s LEFT JOIN student_progress sp ON s.id = sp.student_id AND sp.is_completed = true GROUP BY s.id ORDER BY s.total_points DESC');
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/students/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM student_attempts WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM student_progress WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM student_courses WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM practice_results WHERE student_id = $1', [id]);
    await pool.query('DELETE FROM students WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/students/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    const progress = await pool.query('SELECT sp.*, bq.title FROM student_progress sp JOIN boss_questions bq ON sp.boss_question_id = bq.id WHERE sp.student_id = $1', [id]);
    const attempts = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct FROM student_attempts WHERE student_id = $1', [id]);
    res.json({ success: true, student: student.rows[0], progress: progress.rows, attempts: attempts.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Cloudinary signed upload ──────────────────────────────────

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.post('/cloudinary-signature', adminAuth, (req, res) => {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'eme-questions';
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );
    res.json({
      success: true,
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder,
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Physics Library CRUD ──────────────────────────────────────

router.get('/library', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM physics_library WHERE is_active = true ORDER BY sort_order, chapter_name');
    res.json({ success: true, chapters: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/library', adminAuth, async (req, res) => {
  try {
    const { chapter_name, subject, topics, subtopics, sort_order } = req.body;
    const result = await pool.query(
      'INSERT INTO physics_library (chapter_name, subject, topics, subtopics, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [chapter_name, subject || 'Physics', topics || [], subtopics || [], sort_order || 0]
    );
    res.json({ success: true, chapter: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/library/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { chapter_name, subject, topics, subtopics, sort_order } = req.body;
    const result = await pool.query(
      'UPDATE physics_library SET chapter_name=$1, subject=$2, topics=$3, subtopics=$4, sort_order=$5 WHERE id=$6 RETURNING *',
      [chapter_name, subject || 'Physics', topics || [], subtopics || [], sort_order || 0, id]
    );
    res.json({ success: true, chapter: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/library/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE physics_library SET is_active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

const fs = require('fs');
const path = require('path');

router.get('/videos', adminAuth, (req, res) => {
  const videosDir = path.join(__dirname, '../../videos');
  try {
    const files = fs.readdirSync(videosDir).filter(f => /\.(mp4|webm|mov|mkv)$/i.test(f));
    const videos = files.map(f => ({
      filename: f,
      url: `/videos/${f}`,
    }));
    res.json({ success: true, videos });
  } catch {
    res.json({ success: true, videos: [] });
  }
});

// ── Courses CRUD ──────────────────────────────────────────────

router.get('/courses', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY exam_type, class');
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/courses', adminAuth, async (req, res) => {
  try {
    const { name, class: cls, exam_type, subjects, price, original_price, description, features } = req.body;
    const result = await pool.query(
      'INSERT INTO courses (name, class, exam_type, subjects, price, original_price, description, features) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, cls, exam_type, subjects || [], price || 0, original_price || 0, description, features || []]
    );
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, class: cls, exam_type, subjects, price, original_price, description, features, is_active } = req.body;
    const result = await pool.query(
      'UPDATE courses SET name=$1, class=$2, exam_type=$3, subjects=$4, price=$5, original_price=$6, description=$7, features=$8, is_active=$9 WHERE id=$10 RETURNING *',
      [name, cls, exam_type, subjects || [], price || 0, original_price || 0, description, features || [], is_active !== undefined ? is_active : true, id]
    );
    res.json({ success: true, course: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/courses/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM courses WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Student Analytics ─────────────────────────────────────────

router.get('/student-analytics', adminAuth, async (req, res) => {
  try {
    const totalRes = await pool.query('SELECT COUNT(*) as total_students FROM students');
    const activeTodayRes = await pool.query(
      "SELECT COUNT(DISTINCT student_id) as active_today FROM student_attempts WHERE created_at >= NOW() - INTERVAL '24 hours'"
    );
    const activeWeekRes = await pool.query(
      "SELECT COUNT(DISTINCT student_id) as active_week FROM student_attempts WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const studentsRes = await pool.query(`
      SELECT
        s.id, s.name, s.phone, s.total_points, s.created_at,
        MAX(sa.created_at) as last_active,
        COUNT(sa.id) as attempts_total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as attempts_correct,
        CASE WHEN COUNT(sa.id) > 0 THEN ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(sa.id), 1) ELSE 0 END as accuracy_pct,
        c.name as enrolled_course_name
      FROM students s
      LEFT JOIN student_attempts sa ON s.id = sa.student_id
      LEFT JOIN student_courses sc ON s.id = sc.student_id
      LEFT JOIN courses c ON sc.course_id = c.id
      GROUP BY s.id, s.name, s.phone, s.total_points, s.created_at, c.name
      ORDER BY s.total_points DESC
    `);
    res.json({
      success: true,
      total_students: parseInt(totalRes.rows[0].total_students),
      active_today: parseInt(activeTodayRes.rows[0].active_today),
      active_week: parseInt(activeWeekRes.rows[0].active_week),
      students: studentsRes.rows
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.get('/student-analytics/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const studentRes = await pool.query('SELECT * FROM students WHERE id = $1', [id]);
    if (!studentRes.rows[0]) return res.status(404).json({ success: false, error: 'Student not found' });
    const enrollmentRes = await pool.query(
      'SELECT sc.*, c.name, c.exam_type, c.subjects FROM student_courses sc JOIN courses c ON sc.course_id = c.id WHERE sc.student_id = $1 LIMIT 1',
      [id]
    );
    const attemptsRes = await pool.query(`
      SELECT
        co.concept_name,
        COUNT(sa.id) as total,
        SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct,
        CASE WHEN COUNT(sa.id) > 0 THEN ROUND(100.0 * SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) / COUNT(sa.id), 1) ELSE 0 END as accuracy
      FROM student_attempts sa
      JOIN ladder_steps ls ON sa.step_id = ls.id
      JOIN boss_questions bq ON ls.boss_question_id = bq.id
      JOIN concepts co ON bq.concept_id = co.id
      WHERE sa.student_id = $1
      GROUP BY co.concept_name
      ORDER BY total DESC
    `, [id]);
    const recentRes = await pool.query(
      'SELECT sa.*, ls.concept_tag, ls.question_text FROM student_attempts sa JOIN ladder_steps ls ON sa.step_id = ls.id WHERE sa.student_id = $1 ORDER BY sa.created_at DESC LIMIT 20',
      [id]
    );
    res.json({
      success: true,
      student: studentRes.rows[0],
      enrollment: enrollmentRes.rows[0] || null,
      attempts_by_concept: attemptsRes.rows,
      recent_activity: recentRes.rows
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Hard Questions ────────────────────────────────────────────

router.get('/analytics/hard-questions', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ls.id,
        LEFT(ls.question_text, 80) as question_text,
        ls.concept_tag,
        bq.title as boss_title,
        COUNT(sa.id) as total_attempts,
        ROUND(100.0 * SUM(CASE WHEN NOT sa.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(sa.id), 0), 1) as fail_rate
      FROM ladder_steps ls
      JOIN boss_questions bq ON ls.boss_question_id = bq.id
      LEFT JOIN student_attempts sa ON ls.id = sa.step_id
      WHERE ls.is_active = true
      GROUP BY ls.id, ls.question_text, ls.concept_tag, bq.title
      HAVING COUNT(sa.id) > 0
        AND (100.0 * SUM(CASE WHEN NOT sa.is_correct THEN 1 ELSE 0 END) / COUNT(sa.id)) >= 50
      ORDER BY fail_rate DESC
      LIMIT 20
    `);
    res.json({ success: true, questions: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Revenue ───────────────────────────────────────────────────

router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const totalRes = await pool.query('SELECT COALESCE(SUM(amount_paid),0) as total_revenue, COUNT(*) as total_enrollments FROM student_courses');
    const byCourseRes = await pool.query(`
      SELECT c.name as course_name, COUNT(sc.id) as enrollments, COALESCE(SUM(sc.amount_paid),0) as revenue
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);
    const recentRes = await pool.query(`
      SELECT s.name as student_name, c.name as course_name, sc.amount_paid, sc.enrolled_at
      FROM student_courses sc
      JOIN students s ON sc.student_id = s.id
      JOIN courses c ON sc.course_id = c.id
      ORDER BY sc.enrolled_at DESC
      LIMIT 20
    `);
    const monthlyRes = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', enrolled_at), 'YYYY-MM') as month,
        COALESCE(SUM(amount_paid),0) as revenue,
        COUNT(*) as enrollments
      FROM student_courses
      WHERE enrolled_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', enrolled_at)
      ORDER BY month DESC
    `);
    const total = parseInt(totalRes.rows[0].total_enrollments);
    const totalRevenue = parseInt(totalRes.rows[0].total_revenue);
    res.json({
      success: true,
      total_revenue: totalRevenue,
      total_enrollments: total,
      avg_revenue_per_student: total > 0 ? Math.round(totalRevenue / total) : 0,
      by_course: byCourseRes.rows,
      recent_enrollments: recentRes.rows,
      monthly: monthlyRes.rows
    });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Concept course assignment ─────────────────────────────────

router.put('/concepts/:id/courses', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { course_ids } = req.body;
    await pool.query('UPDATE concepts SET course_ids = $1 WHERE id = $2', [course_ids || [], id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Question sets count (dashboard KPI) ──────────────────────

router.get('/question-sets-count', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM boss_questions WHERE is_active = true');
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Practice Questions ────────────────────────────────────────

router.get('/practice-questions', adminAuth, async (req, res) => {
  try {
    const { concept_id } = req.query;
    if (!concept_id) return res.status(400).json({ success: false, error: 'concept_id required' });
    const result = await pool.query(
      'SELECT * FROM practice_questions WHERE concept_id = $1 AND is_active = true ORDER BY order_index, id',
      [concept_id]
    );
    res.json({ success: true, questions: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.post('/practice-questions', adminAuth, async (req, res) => {
  try {
    const { concept_id, question_text, option_a, option_b, option_c, option_d, correct_option, hint_text, order_index } = req.body;
    if (!concept_id || !question_text || !option_a || !option_b) {
      return res.status(400).json({ success: false, error: 'concept_id, question_text, option_a, option_b required' });
    }
    const count = await pool.query('SELECT COUNT(*) FROM practice_questions WHERE concept_id = $1 AND is_active = true', [concept_id]);
    if (parseInt(count.rows[0].count) >= 10) {
      return res.status(400).json({ success: false, error: 'Maximum 10 practice questions per concept' });
    }
    const result = await pool.query(
      'INSERT INTO practice_questions (concept_id,question_text,option_a,option_b,option_c,option_d,correct_option,hint_text,order_index) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [concept_id, question_text, option_a, option_b, option_c || null, option_d || null, correct_option || 'a', hint_text || null, order_index || 1]
    );
    res.json({ success: true, question: result.rows[0] });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/practice-questions/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, hint_text, order_index } = req.body;
    await pool.query(
      'UPDATE practice_questions SET question_text=$1,option_a=$2,option_b=$3,option_c=$4,option_d=$5,correct_option=$6,hint_text=$7,order_index=$8 WHERE id=$9',
      [question_text, option_a, option_b, option_c || null, option_d || null, correct_option, hint_text || null, order_index || 1, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.delete('/practice-questions/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('UPDATE practice_questions SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

// ── Landing Page Content CMS ──────────────────────────────────

router.get('/landing-content', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value, label, section FROM landing_content ORDER BY section, key');
    res.json({ success: true, content: result.rows });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

router.put('/landing-content', adminAuth, async (req, res) => {
  try {
    const { updates } = req.body; // [{ key, value }, ...]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, error: 'updates array required' });
    }
    for (const { key, value } of updates) {
      await pool.query(
        'UPDATE landing_content SET value = $1, updated_at = NOW() WHERE key = $2',
        [value, key]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

module.exports = router;