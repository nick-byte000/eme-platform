ALTER TABLE students
  ADD COLUMN IF NOT EXISTS parent_mobile TEXT,
  ADD COLUMN IF NOT EXISTS otp TEXT,
  ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS student_courses (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id),
  amount_paid INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'completed',
  payment_id TEXT,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);
