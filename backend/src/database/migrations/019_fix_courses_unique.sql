DELETE FROM courses WHERE id NOT IN (
  SELECT MIN(id) FROM courses GROUP BY name
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'courses_name_unique' AND conrelid = 'courses'::regclass
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_name_unique UNIQUE (name);
  END IF;
END $$;
