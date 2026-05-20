CREATE TABLE IF NOT EXISTS unlocked_chapters (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id),
  concept_id INTEGER REFERENCES concepts(id),
  points_spent INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, concept_id)
);