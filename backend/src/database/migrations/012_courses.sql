CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  subjects TEXT[] NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER DEFAULT 0,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
INSERT INTO courses (name, class, exam_type, subjects, price, original_price, description, features) VALUES
  ('Class 11 JEE (Main + Advanced)', '11', 'JEE', ARRAY['Physics', 'Chemistry', 'Mathematics'], 4999, 9999, 'Complete JEE preparation for Class 11 students', ARRAY['Physics, Chemistry & Mathematics', 'AI-powered adaptive learning', '500+ ladder question sets', 'Performance analytics', 'Concept mastery tracking']),
  ('Class 12 JEE (Main + Advanced)', '12', 'JEE', ARRAY['Physics', 'Chemistry', 'Mathematics'], 4999, 9999, 'Complete JEE preparation for Class 12 students', ARRAY['Physics, Chemistry & Mathematics', 'AI-powered adaptive learning', '600+ ladder question sets', 'Performance analytics', 'Concept mastery tracking']),
  ('Class 11 NEET', '11', 'NEET', ARRAY['Physics', 'Chemistry', 'Botany', 'Zoology'], 3999, 7999, 'Complete NEET preparation for Class 11 students', ARRAY['Physics, Chemistry, Botany & Zoology', 'AI-powered adaptive learning', '400+ ladder question sets', 'Performance analytics', 'Concept mastery tracking']),
  ('Class 12 NEET', '12', 'NEET', ARRAY['Physics', 'Chemistry', 'Botany', 'Zoology'], 3999, 7999, 'Complete NEET preparation for Class 12 students', ARRAY['Physics, Chemistry, Botany & Zoology', 'AI-powered adaptive learning', '500+ ladder question sets', 'Performance analytics', 'Concept mastery tracking'])
ON CONFLICT DO NOTHING;
