CREATE TABLE IF NOT EXISTS student_progress (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  boss_question_id INTEGER REFERENCES boss_questions(id),
  current_step INTEGER DEFAULT 1,
  steps_completed INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  readiness_score INTEGER,
  is_completed BOOLEAN DEFAULT false,
  total_points_earned INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  UNIQUE(student_id, boss_question_id)
);