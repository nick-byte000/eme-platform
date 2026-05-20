CREATE TABLE IF NOT EXISTS concepts (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  subtopic_name TEXT,
  concept_name TEXT NOT NULL,
  prerequisite_concept_id INTEGER REFERENCES concepts(id),
  unlock_points INTEGER DEFAULT 0,
  language TEXT DEFAULT 'english',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);