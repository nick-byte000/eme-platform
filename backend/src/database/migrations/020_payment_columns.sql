ALTER TABLE student_courses
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

UPDATE student_courses SET payment_status = 'completed' WHERE payment_status IS NULL;
