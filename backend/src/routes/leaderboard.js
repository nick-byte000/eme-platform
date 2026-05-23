const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const studentId = req.student.id;
    const result = await pool.query('SELECT id, name, total_points, current_level, batch FROM students WHERE show_on_leaderboard = true ORDER BY total_points DESC LIMIT 20');
    const leaderboard = result.rows.map((s, i) => ({ ...s, rank: i + 1 }));
    const studentRank = leaderboard.findIndex(s => s.id === studentId) + 1;
    res.json({ success: true, leaderboard, student_rank: studentRank || null });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
  }
});

module.exports = router;