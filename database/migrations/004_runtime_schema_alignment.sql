-- Align existing installations with the runtime controllers.
-- Run once after migrations 001-003.

ALTER TABLE notifications
    ADD COLUMN related_type ENUM('reservation', 'resource', 'user', 'system') DEFAULT 'system' AFTER type,
    ADD COLUMN related_id INT DEFAULT NULL AFTER related_type,
    ADD COLUMN read_at TIMESTAMP NULL DEFAULT NULL AFTER is_read;

ALTER TABLE help_requests
    MODIFY COLUMN user_id INT DEFAULT NULL,
    ADD COLUMN guest_email VARCHAR(255) DEFAULT NULL AFTER user_id;
