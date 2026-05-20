ALTER TABLE ladder_steps
  ADD COLUMN IF NOT EXISTS clone_question_text TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_a TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_b TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_c TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_d TEXT,
  ADD COLUMN IF NOT EXISTS clone_correct_options TEXT,
  ADD COLUMN IF NOT EXISTS clone_explanation TEXT;
