-- Unique constraint on email (partial: only for non-null emails)
CREATE UNIQUE INDEX IF NOT EXISTS students_email_unique
  ON students (email)
  WHERE email IS NOT NULL AND email != '';
