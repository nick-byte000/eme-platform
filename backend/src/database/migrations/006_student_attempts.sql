CREATE TABLE IF NOT EXISTS student_attempts (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  boss_question_id INTEGER REFERENCES boss_questions(id),
  step_id INTEGER REFERENCES ladder_steps(id),
  clone_id INTEGER REFERENCES clone_questions(id),
  selected_options TEXT,
  correct_options TEXT,
  is_correct BOOLEAN DEFAULT false,
  time_taken_seconds INTEGER,
  attempt_number INTEGER DEFAULT 1,
  hint_opened BOOLEAN DEFAULT false,
  theory_opened BOOLEAN DEFAULT false,
  video_watched BOOLEAN DEFAULT false,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);