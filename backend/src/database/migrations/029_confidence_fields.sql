ALTER TABLE student_attempts
  ADD COLUMN IF NOT EXISTS confidence TEXT,
  ADD COLUMN IF NOT EXISTS is_personal_foul BOOLEAN DEFAULT false;
