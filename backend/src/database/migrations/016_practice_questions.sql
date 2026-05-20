CREATE TABLE IF NOT EXISTS practice_questions (
  id SERIAL PRIMARY KEY,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT NOT NULL DEFAULT 'a',
  hint_text TEXT,
  order_index INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  concept_id INTEGER REFERENCES concepts(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  completed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, concept_id)
);
