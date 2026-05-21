INSERT INTO students (name, phone, email, parent_mobile)
VALUES ('Test Student', '9999999999', 'test@gokoo.in', '8888888888')
ON CONFLICT (phone) DO NOTHING;

INSERT INTO student_courses (student_id, course_id, amount_paid, payment_status)
SELECT s.id, c.id, c.price, 'completed'
FROM students s
CROSS JOIN (SELECT id, price FROM courses WHERE is_active = true ORDER BY id LIMIT 1) c
WHERE s.phone = '9999999999'
ON CONFLICT DO NOTHING;
