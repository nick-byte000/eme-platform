ALTER TABLE ladder_steps
  ADD COLUMN IF NOT EXISTS clone_question_image_url TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_a_image_url TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_b_image_url TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_c_image_url TEXT,
  ADD COLUMN IF NOT EXISTS clone_option_d_image_url TEXT;
