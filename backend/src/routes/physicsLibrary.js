const express = require('express');
const router = express.Router();
const pool = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM physics_library WHERE is_active = true ORDER BY sort_order, chapter_name'
    );
    const library = {};
    result.rows.forEach(row => {
      library[row.chapter_name] = {
        id: row.id,
        subject: row.subject,
        topics: row.topics || [],
        subtopics: row.subtopics || [],
        sort_order: row.sort_order,
      };
    });
    res.json({ success: true, library });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
