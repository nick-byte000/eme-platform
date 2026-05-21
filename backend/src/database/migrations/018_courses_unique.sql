-- Remove duplicate courses keeping the oldest (lowest id)
DELETE FROM courses WHERE id NOT IN (
  SELECT MIN(id) FROM courses GROUP BY name
);

-- Add unique constraint so duplicates can never be inserted again
ALTER TABLE courses ADD CONSTRAINT IF NOT EXISTS courses_name_unique UNIQUE (name);
