CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  class TEXT,
  batch TEXT,
  target_exam TEXT,
  preferred_language TEXT DEFAULT 'english',
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  show_on_leaderboard BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);