const axios = require('axios');
require('dotenv').config();
const pool = require('../config/database');

const generateCloneQuestion = async (originalStepId) => {
  try {
    const stepResult = await pool.query('SELECT * FROM ladder_steps WHERE id = $1', [originalStepId]);
    if (stepResult.rows.length === 0) throw new Error('Step not found');
    
    const step = stepResult.rows[0];
    const bossResult = await pool.query('SELECT * FROM boss_questions WHERE id = $1', [step.boss_question_id]);
    const boss = bossResult.rows[0];
    
    const prompt = `Generate a clone MCQ question for concept: ${step.concept_tag}. Original question: ${step.question_text}. Create completely new numbers and scenario, keep same difficulty, 4 options with only 1 correct. Return ONLY valid JSON with keys: question_text, option_a, option_b, option_c, option_d, correct_options (a/b/c/d), explanation, theory_card, hint_text`;
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY
      }
    });
    
    const text = response.data.content.map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const cloneData = JSON.parse(clean);
    
    const insertResult = await pool.query(
      'INSERT INTO clone_questions (original_step_id, question_text, option_a, option_b, option_c, option_d, correct_options, explanation, theory_card, hint_text, difficulty, language, is_prefetch_ready) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [originalStepId, cloneData.question_text, cloneData.option_a, cloneData.option_b, cloneData.option_c, cloneData.option_d, cloneData.correct_options, cloneData.explanation, cloneData.theory_card, cloneData.hint_text, step.difficulty, step.language, false]
    );
    return insertResult.rows[0];
  } catch (err) {
    console.error('AI Error:', err.message);
    throw err;
  }
};

const generateAllClones = async (bossQuestionId) => {
  try {
    const steps = await pool.query('SELECT id FROM ladder_steps WHERE boss_question_id = $1 AND is_active = true ORDER BY step_number', [bossQuestionId]);
    const results = [];
    for (const step of steps.rows) {
      const existing = await pool.query('SELECT id FROM clone_questions WHERE original_step_id = $1 LIMIT 1', [step.id]);
      if (existing.rows.length === 0) {
        const clone = await generateCloneQuestion(step.id);
        results.push(clone);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return results;
  } catch (err) {
    console.error('Batch Error:', err.message);
    throw err;
  }
};

module.exports = { generateCloneQuestion, generateAllClones };