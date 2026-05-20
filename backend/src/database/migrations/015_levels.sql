ALTER TABLE boss_questions
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'beginner',
  ADD COLUMN IF NOT EXISTS question_type_category TEXT DEFAULT 'single_correct';
