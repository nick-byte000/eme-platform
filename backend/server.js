const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const pool = require('./src/config/database');

const authRoutes = require('./src/routes/auth');
const conceptRoutes = require('./src/routes/concepts');
const bossQuestionRoutes = require('./src/routes/bossQuestions');
const attemptRoutes = require('./src/routes/attempts');
const progressRoutes = require('./src/routes/progress');
const leaderboardRoutes = require('./src/routes/leaderboard');
const prefetchRoutes = require('./src/routes/prefetch');
const adminRoutes = require('./src/routes/admin');
const physicsLibraryRoutes = require('./src/routes/physicsLibrary');
const enrollmentRoutes = require('./src/routes/enrollment');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/videos', express.static(path.join(__dirname, 'videos')));

pool.query('SELECT NOW()', (err, res) => {
  if (err) { console.error('Database connection failed:', err.message); }
  else { console.log('Database connected at:', res.rows[0].now); }
});

app.use('/api/auth', authRoutes);
app.use('/api/concepts', conceptRoutes);
app.use('/api/boss-questions', bossQuestionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/prefetch', prefetchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/physics-library', physicsLibraryRoutes);
app.use('/api/enrollment', enrollmentRoutes);

// Practice questions — student facing
app.get('/api/practice/:concept_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id,question_text,option_a,option_b,option_c,option_d,correct_option,hint_text,order_index FROM practice_questions WHERE concept_id=$1 AND is_active=true ORDER BY order_index,id LIMIT 10',
      [req.params.concept_id]
    );
    res.json({ success: true, questions: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/practice/:concept_id/result', async (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    let studentId = null;
    try { studentId = jwt.verify(token, process.env.JWT_SECRET).id; } catch {}
    if (studentId) {
      const { score, total } = req.body;
      await pool.query(
        'INSERT INTO practice_results (student_id,concept_id,score,total) VALUES ($1,$2,$3,$4) ON CONFLICT (student_id,concept_id) DO UPDATE SET score=$3,total=$4,completed_at=NOW()',
        [studentId, req.params.concept_id, score, total]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public courses endpoint
app.get('/api/courses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses WHERE is_active = true ORDER BY exam_type, class');
    res.json({ success: true, courses: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'GOKOO Backend is running!' });
});

const fs = require('fs');
const runMigrations = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename TEXT PRIMARY KEY,
      run_at TIMESTAMP DEFAULT NOW()
    )
  `);
  const migrationsPath = path.join(__dirname, 'src/database/migrations');
  const files = fs.readdirSync(migrationsPath).sort();
  for (const file of files) {
    const { rows } = await pool.query('SELECT 1 FROM _migrations WHERE filename = $1', [file]);
    if (rows.length > 0) continue;
    const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log('Migration:', file);
  }
};

runMigrations()
  .then(() => {
    app.listen(PORT, () => {
      console.log('GOKOO Backend running on port ' + PORT);
    });
  })
  .catch(err => {
    console.error('Migration failed:', err.message);
    app.listen(PORT, () => {
      console.log('GOKOO Backend running on port ' + PORT + ' (migrations failed)');
    });
  });
