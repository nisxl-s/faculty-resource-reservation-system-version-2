-- ========================================
-- Faculty Resource Reservation System
-- Seed Data for Development & Testing
-- ========================================
-- This file contains sample data for testing the application
-- Run this AFTER running schema.sql

USE faculty_reservation;

-- ========================================
-- SEED USERS
-- ========================================
-- Password for all users: 'password123' (hashed with bcryptjs)
-- Hash: $2a$10$rN8L8xQZqYZQXZvZKqYZQOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ

INSERT INTO users (full_name, email, password, role, department, phone, is_active) VALUES
-- Admin Users
('Admin User', 'admin@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'admin', 'Administration', '555-0100', TRUE),
('System Admin', 'sysadmin@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'admin', 'IT Services', '555-0101', TRUE),

-- Faculty Users
('Dr. John Smith', 'john.smith@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'faculty', 'Computer Science', '555-0200', TRUE),
('Dr. Sarah Johnson', 'sarah.johnson@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'faculty', 'Engineering', '555-0201', TRUE),
('Dr. Michael Brown', 'michael.brown@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'faculty', 'Mathematics', '555-0202', TRUE),
('Dr. Emily Davis', 'emily.davis@university.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'faculty', 'Physics', '555-0203', TRUE),

-- Student Users
('Alice Williams', 'alice.williams@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Computer Science', '555-0300', TRUE),
('Bob Anderson', 'bob.anderson@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Computer Science', '555-0301', TRUE),
('Carol Martinez', 'carol.martinez@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Engineering', '555-0302', TRUE),
('David Garcia', 'david.garcia@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Mathematics', '555-0303', TRUE),
('Emma Rodriguez', 'emma.rodriguez@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Physics', '555-0304', TRUE),
('Frank Wilson', 'frank.wilson@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Chemistry', '555-0305', TRUE),
('Grace Lee', 'grace.lee@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Biology', '555-0306', TRUE),
('Henry Taylor', 'henry.taylor@student.edu', '$2a$10$K7Z8rN8L8xQZqYZQXZvZKOeKqYZQXZvZKqYZQXZvZKqYZQXZvZ', 'student', 'Computer Science', '555-0307', TRUE);

-- ========================================
-- SEED RESOURCES
-- ========================================

-- Classrooms
INSERT INTO resources (name, type, building, location, capacity, description, features, status, requires_approval) VALUES
('Lecture Hall A', 'classroom', 'Science Building', 'Room 101', 150, 'Large lecture hall with tiered seating', '{"projector": true, "whiteboard": true, "audio_system": true, "video_recording": true}', 'available', TRUE),
('Classroom B1', 'classroom', 'Science Building', 'Room 201', 40, 'Medium-sized classroom', '{"projector": true, "whiteboard": true, "smartboard": true}', 'available', TRUE),
('Classroom B2', 'classroom', 'Science Building', 'Room 202', 40, 'Medium-sized classroom', '{"projector": true, "whiteboard": true}', 'available', TRUE),
('Seminar Room C', 'classroom', 'Engineering Building', 'Room 301', 25, 'Small seminar room', '{"tv_screen": true, "whiteboard": true, "video_conference": true}', 'available', TRUE),
('Tutorial Room D', 'classroom', 'Math Building', 'Room 105', 20, 'Tutorial and discussion room', '{"whiteboard": true, "round_tables": true}', 'available', FALSE),

-- Computer Labs
('Computer Lab 1', 'lab', 'IT Building', 'Lab A', 30, 'General purpose computer lab', '{"computers": 30, "windows": true, "projector": true, "printer": true}', 'available', TRUE),
('Computer Lab 2', 'lab', 'IT Building', 'Lab B', 25, 'Advanced computing lab', '{"computers": 25, "linux": true, "windows": true, "high_spec": true}', 'available', TRUE),
('Programming Lab', 'lab', 'IT Building', 'Lab C', 20, 'Specialized programming lab', '{"computers": 20, "multiple_monitors": true, "dev_tools": true}', 'available', TRUE),

-- Science Labs
('Physics Lab', 'lab', 'Science Building', 'Lab 301', 25, 'Physics experiments laboratory', '{"lab_equipment": true, "safety_equipment": true, "fume_hood": false}', 'available', TRUE),
('Chemistry Lab', 'lab', 'Science Building', 'Lab 302', 20, 'Chemistry laboratory with fume hoods', '{"lab_equipment": true, "safety_equipment": true, "fume_hood": true}', 'available', TRUE),
('Biology Lab', 'lab', 'Science Building', 'Lab 401', 24, 'Biology and life sciences lab', '{"microscopes": true, "lab_equipment": true, "refrigeration": true}', 'available', TRUE),

-- Equipment
('Projector - Portable 1', 'equipment', 'Equipment Center', 'Storage A', 1, 'HD projector with HDMI', '{"hdmi": true, "vga": true, "wireless": false, "brightness": "3000_lumens"}', 'available', FALSE),
('Projector - Portable 2', 'equipment', 'Equipment Center', 'Storage A', 1, 'HD projector with wireless', '{"hdmi": true, "wireless": true, "brightness": "3500_lumens"}', 'available', FALSE),
('Laptop - Dell 1', 'equipment', 'Equipment Center', 'Storage B', 1, 'Dell laptop for presentations', '{"ram": "16GB", "processor": "i7", "os": "Windows 11"}', 'available', FALSE),
('Laptop - Dell 2', 'equipment', 'Equipment Center', 'Storage B', 1, 'Dell laptop for presentations', '{"ram": "16GB", "processor": "i7", "os": "Windows 11"}', 'available', FALSE),
('Camera - Canon DSLR', 'equipment', 'Equipment Center', 'Storage C', 1, 'Professional DSLR camera', '{"megapixels": "24MP", "video": "4K", "lenses": "2"}', 'available', TRUE),
('Microphone Set', 'equipment', 'Equipment Center', 'Storage D', 1, 'Wireless microphone system', '{"wireless": true, "channels": 2, "range": "100m"}', 'available', FALSE),
('3D Printer', 'equipment', 'Engineering Building', 'Maker Space', 1, 'FDM 3D printer', '{"build_volume": "300x300x400mm", "materials": "PLA, ABS, PETG"}', 'available', TRUE),

-- Halls
('Conference Hall', 'hall', 'Main Building', 'Ground Floor', 200, 'Large conference and event hall', '{"stage": true, "audio_system": true, "projector": true, "seating": "theater_style"}', 'available', TRUE),
('Assembly Hall', 'hall', 'Main Building', '2nd Floor', 500, 'Main assembly hall for large events', '{"stage": true, "audio_system": true, "lighting": true, "video_wall": true}', 'available', TRUE),
('Auditorium', 'hall', 'Arts Building', 'Ground Floor', 300, 'Theater-style auditorium', '{"stage": true, "audio_system": true, "lighting": true, "backstage": true}', 'available', TRUE);

-- ========================================
-- SEED RESERVATIONS
-- ========================================

-- Past reservations
INSERT INTO reservations (user_id, resource_id, start_time, end_time, purpose, status, notes, approved_by, approved_at) VALUES
-- Approved past reservations
(3, 1, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 9 HOUR, DATE_SUB(NOW(), INTERVAL 7 DAY) + INTERVAL 11 HOUR, 'Introduction to Programming lecture', 'approved', 'Need projector setup by 8:45 AM', 1, DATE_SUB(NOW(), INTERVAL 8 DAY)),
(4, 2, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 14 HOUR, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 16 HOUR, 'Engineering Design Workshop', 'approved', NULL, 1, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 9, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 12 HOUR, 'Physics Lab Session - Mechanics', 'approved', 'Class of 20 students', 1, DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Current day reservations
(3, 1, CURDATE() + INTERVAL 9 HOUR, CURDATE() + INTERVAL 11 HOUR, 'Database Systems Lecture', 'approved', NULL, 1, DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7, 6, CURDATE() + INTERVAL 13 HOUR, CURDATE() + INTERVAL 15 HOUR, 'Group Project Work', 'approved', 'Team of 4 students', 1, DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Future approved reservations
(3, 1, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 9 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 11 HOUR, 'Advanced Algorithms Lecture', 'approved', NULL, 1, NOW()),
(4, 3, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 14 HOUR, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 16 HOUR, 'Engineering Seminar', 'approved', NULL, 1, NOW()),
(5, 9, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 10 HOUR, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 12 HOUR, 'Physics Lab - Optics', 'approved', NULL, 1, NOW()),
(6, 11, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 13 HOUR, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 15 HOUR, 'Biology Lab - Cell Culture', 'approved', 'Need sterilization', 1, NOW()),
(3, 18, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 15 HOUR, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 17 HOUR, 'Department Conference', 'approved', NULL, 1, NOW()),

-- Pending reservations
(7, 2, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 10 HOUR, DATE_ADD(NOW(), INTERVAL 2 DAY) + INTERVAL 12 HOUR, 'Study Group Session', 'pending', 'Group of 5 students', NULL, NULL),
(8, 6, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 14 HOUR, DATE_ADD(NOW(), INTERVAL 3 DAY) + INTERVAL 16 HOUR, 'Programming Assignment', 'pending', NULL, NULL, NULL),
(9, 4, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 11 HOUR, DATE_ADD(NOW(), INTERVAL 4 DAY) + INTERVAL 13 HOUR, 'Project Presentation Practice', 'pending', 'Need video conferencing', NULL, NULL),
(10, 12, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 9 HOUR, DATE_ADD(NOW(), INTERVAL 5 DAY) + INTERVAL 10 HOUR, 'Presentation for class project', 'pending', NULL, NULL, NULL),

-- Rejected reservation (for demonstration)
(11, 1, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 19 HOUR, DATE_ADD(NOW(), INTERVAL 1 DAY) + INTERVAL 21 HOUR, 'Personal study session', 'rejected', 'Outside working hours', 1, NOW()),

-- Cancelled reservation (for demonstration)
(7, 8, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 10 HOUR, DATE_ADD(NOW(), INTERVAL 6 DAY) + INTERVAL 12 HOUR, 'Lab session', 'cancelled', NULL, NULL, NULL);

-- ========================================
-- SEED NOTIFICATIONS
-- ========================================

INSERT INTO notifications (user_id, title, message, type, related_type, related_id, is_read) VALUES
-- Approved reservation notifications
(3, 'Reservation Approved', 'Your reservation for Lecture Hall A has been approved', 'success', 'reservation', 6, TRUE),
(4, 'Reservation Approved', 'Your reservation for Classroom B2 has been approved', 'success', 'reservation', 7, TRUE),
(5, 'Reservation Approved', 'Your reservation for Physics Lab has been approved', 'success', 'reservation', 8, FALSE),

-- Pending notifications
(7, 'Reservation Pending', 'Your reservation for Classroom B1 is awaiting approval', 'info', 'reservation', 11, FALSE),
(8, 'Reservation Pending', 'Your reservation for Computer Lab 1 is awaiting approval', 'info', 'reservation', 12, FALSE),

-- Rejected notification
(11, 'Reservation Rejected', 'Your reservation for Lecture Hall A has been rejected: Outside working hours', 'error', 'reservation', 15, FALSE),

-- System notifications
(1, 'Welcome to the System', 'Welcome Admin! You have full access to all system features.', 'info', 'system', NULL, TRUE),
(3, 'Welcome to the System', 'Welcome Dr. Smith! Start by browsing available resources.', 'info', 'system', NULL, TRUE),
(7, 'Welcome to the System', 'Welcome Alice! You can now make reservations for resources.', 'info', 'system', NULL, FALSE);

-- ========================================
-- SEED FAVORITES
-- ========================================

INSERT INTO favorites (user_id, resource_id) VALUES
(3, 1),  -- Dr. Smith favorites Lecture Hall A
(3, 6),  -- Dr. Smith favorites Computer Lab 1
(7, 6),  -- Alice favorites Computer Lab 1
(7, 2),  -- Alice favorites Classroom B1
(8, 6),  -- Bob favorites Computer Lab 1
(9, 4);  -- Carol favorites Seminar Room C

-- ========================================
-- SEED RESOURCE SCHEDULES (Regular Classes)
-- ========================================

INSERT INTO resource_schedules (resource_id, day_of_week, start_time, end_time, recurring, effective_from, effective_until, description) VALUES
-- Lecture Hall A - Regular classes
(1, 'Monday', '09:00:00', '11:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'CS101 - Introduction to Programming'),
(1, 'Wednesday', '09:00:00', '11:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'CS101 - Introduction to Programming'),
(1, 'Friday', '14:00:00', '16:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'CS201 - Data Structures'),

-- Computer Lab 1 - Regular lab sessions
(6, 'Tuesday', '10:00:00', '12:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'CS Lab Session A'),
(6, 'Thursday', '10:00:00', '12:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'CS Lab Session B'),

-- Physics Lab - Regular sessions
(9, 'Monday', '14:00:00', '17:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'Physics Lab - Section A'),
(9, 'Thursday', '14:00:00', '17:00:00', TRUE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 MONTH), 'Physics Lab - Section B');

-- ========================================
-- SEED AUDIT LOGS (Sample)
-- ========================================

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values, ip_address) VALUES
(1, 'LOGIN', 'user', 1, '{"timestamp": "2025-10-11 08:00:00"}', '192.168.1.100'),
(1, 'CREATE', 'resource', 1, '{"name": "Lecture Hall A", "type": "classroom"}', '192.168.1.100'),
(1, 'APPROVE', 'reservation', 6, '{"status": "approved"}', '192.168.1.100'),
(3, 'LOGIN', 'user', 3, '{"timestamp": "2025-10-11 08:30:00"}', '192.168.1.101'),
(3, 'CREATE', 'reservation', 6, '{"resource_id": 1, "start_time": "2025-10-12 09:00:00"}', '192.168.1.101');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify data insertion
SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Resources', COUNT(*) FROM resources
UNION ALL
SELECT 'Reservations', COUNT(*) FROM reservations
UNION ALL
SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'Favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'Resource Schedules', COUNT(*) FROM resource_schedules
UNION ALL
SELECT 'Audit Logs', COUNT(*) FROM audit_logs;

-- ========================================
-- SEED DATA SUMMARY
-- ========================================
-- Users: 14 (2 admins, 4 faculty, 8 students)
-- Resources: 20 (5 classrooms, 6 labs, 7 equipment, 3 halls)
-- Reservations: 16 (various statuses and time ranges)
-- Notifications: 9
-- Favorites: 6
-- Resource Schedules: 7
-- Audit Logs: 5
-- ========================================
