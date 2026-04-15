INSERT INTO users (id, name, email)
VALUES (1, 'Aarav Sharma', 'aarav@calendlyclone.dev')
ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email);

INSERT INTO availability_settings (user_id, timezone)
VALUES (1, 'Asia/Kolkata')
ON DUPLICATE KEY UPDATE timezone = VALUES(timezone);

INSERT INTO availability_rules (user_id, day_of_week, is_enabled, start_time, end_time)
VALUES
  (1, 0, FALSE, '09:00:00', '17:00:00'),
  (1, 1, TRUE, '09:00:00', '17:00:00'),
  (1, 2, TRUE, '09:00:00', '17:00:00'),
  (1, 3, TRUE, '09:00:00', '17:00:00'),
  (1, 4, TRUE, '09:00:00', '17:00:00'),
  (1, 5, TRUE, '09:00:00', '16:00:00'),
  (1, 6, FALSE, '09:00:00', '12:00:00')
ON DUPLICATE KEY UPDATE
  is_enabled = VALUES(is_enabled),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time);

INSERT INTO event_types (id, user_id, name, slug, duration_minutes, description, location, color_hex, is_active)
VALUES
  (1, 1, 'Intro call', 'intro-call', 30, 'A quick introduction to align on your goals and next steps.', 'Google Meet', '#006bff', TRUE),
  (2, 1, 'Product demo', 'product-demo', 45, 'Walk through your use case and see the product in action.', 'Zoom', '#0f766e', TRUE),
  (3, 1, 'Design review', 'design-review', 60, 'Collaborative review for flows, UI, and implementation details.', 'Google Meet', '#7c3aed', TRUE)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  duration_minutes = VALUES(duration_minutes),
  description = VALUES(description),
  location = VALUES(location),
  color_hex = VALUES(color_hex),
  is_active = VALUES(is_active);

INSERT INTO meetings (event_type_id, host_user_id, invitee_name, invitee_email, start_at, end_at, status)
SELECT 1, 1, 'Neha Gupta', 'neha@example.com', UTC_TIMESTAMP() + INTERVAL 2 DAY, UTC_TIMESTAMP() + INTERVAL 2 DAY + INTERVAL 30 MINUTE, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM meetings WHERE invitee_email = 'neha@example.com'
);

INSERT INTO meetings (event_type_id, host_user_id, invitee_name, invitee_email, start_at, end_at, status)
SELECT 2, 1, 'Rahul Verma', 'rahul@example.com', UTC_TIMESTAMP() - INTERVAL 3 DAY, UTC_TIMESTAMP() - INTERVAL 3 DAY + INTERVAL 45 MINUTE, 'scheduled'
WHERE NOT EXISTS (
  SELECT 1 FROM meetings WHERE invitee_email = 'rahul@example.com'
);
