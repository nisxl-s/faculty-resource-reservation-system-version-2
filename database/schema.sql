-- ========================================
-- Faculty Resource Reservation System
-- Database Schema
-- ========================================
-- This schema supports the Express.js backend and React frontend
-- Compatible with MySQL 5.7+ / MariaDB 10.2+

-- Drop existing database if exists (CAUTION: This will delete all data)
-- Uncomment the following lines if you want to start fresh
-- DROP DATABASE IF EXISTS faculty_reservation;
-- CREATE DATABASE faculty_reservation CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE faculty_reservation;

-- ========================================
-- USERS TABLE
-- ========================================
-- Stores all user information for students, faculty, and administrators

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL COMMENT 'Hashed password using bcryptjs',
    role ENUM('student', 'faculty', 'admin') DEFAULT 'student' NOT NULL,
    department VARCHAR(100) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    profile_picture VARCHAR(500) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_department (department),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User accounts for students, faculty, and administrators';

-- ========================================
-- RESOURCES TABLE
-- ========================================
-- Stores all available resources that can be reserved

CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('classroom', 'lab', 'equipment', 'hall', 'other') NOT NULL,
    building VARCHAR(100) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL COMMENT 'Room number or specific location',
    capacity INT DEFAULT NULL COMMENT 'Maximum number of people/items',
    description TEXT DEFAULT NULL,
    features JSON DEFAULT NULL COMMENT 'Additional features like projector, whiteboard, etc',
    image_url VARCHAR(500) DEFAULT NULL,
    status ENUM('available', 'unavailable', 'maintenance') DEFAULT 'available',
    requires_approval BOOLEAN DEFAULT TRUE COMMENT 'Whether reservations need admin approval',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_building (building),
    INDEX idx_name (name),
    FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Available resources for reservation';

-- ========================================
-- RESERVATIONS TABLE
-- ========================================
-- Stores all booking/reservation records

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT DEFAULT NULL COMMENT 'Reason for reservation',
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    notes TEXT DEFAULT NULL COMMENT 'Additional notes or special requests',
    approved_by INT DEFAULT NULL COMMENT 'Admin/Faculty who approved',
    approved_at TIMESTAMP NULL DEFAULT NULL,
    cancelled_reason TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_resource (resource_id),
    INDEX idx_status (status),
    INDEX idx_time_range (start_time, end_time),
    INDEX idx_approved_by (approved_by),
    
    CONSTRAINT chk_time_order CHECK (end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reservation/booking records';

-- ========================================
-- NOTIFICATIONS TABLE
-- ========================================
-- Stores user notifications

CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    related_type ENUM('reservation', 'resource', 'user', 'system') DEFAULT 'system',
    related_id INT DEFAULT NULL COMMENT 'ID of related reservation/resource',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user (user_id),
    INDEX idx_read (is_read),
    INDEX idx_type (type),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User notifications';

-- ========================================
-- RESOURCE_SCHEDULES TABLE
-- ========================================
-- Stores regular schedules for resources (e.g., class schedules)

CREATE TABLE IF NOT EXISTS resource_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    resource_id INT NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    recurring BOOLEAN DEFAULT TRUE,
    effective_from DATE NOT NULL,
    effective_until DATE DEFAULT NULL,
    description VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    
    INDEX idx_resource (resource_id),
    INDEX idx_day (day_of_week),
    INDEX idx_effective (effective_from, effective_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Regular schedules for resources';

-- ========================================
-- FAVORITES TABLE
-- ========================================
-- Stores user's favorite resources

CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_favorite (user_id, resource_id),
    INDEX idx_user (user_id),
    INDEX idx_resource (resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User favorite resources';

-- ========================================
-- AUDIT_LOGS TABLE
-- ========================================
-- Stores audit trail for important actions

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'e.g., CREATE, UPDATE, DELETE, LOGIN',
    entity_type VARCHAR(50) NOT NULL COMMENT 'e.g., user, resource, reservation',
    entity_id INT DEFAULT NULL,
    old_values JSON DEFAULT NULL,
    new_values JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user (user_id),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for system actions';

-- ========================================
-- SETTINGS TABLE
-- ========================================
-- Stores system-wide settings

CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT DEFAULT NULL,
    data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT DEFAULT NULL,
    is_public BOOLEAN DEFAULT FALSE COMMENT 'Whether setting is visible to non-admins',
    updated_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_key (setting_key),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='System configuration settings';

-- ========================================
-- VIEWS
-- ========================================

-- View: Active Reservations with Details
CREATE OR REPLACE VIEW active_reservations_view AS
SELECT 
    r.id,
    r.start_time,
    r.end_time,
    r.purpose,
    r.status,
    r.notes,
    u.id AS user_id,
    u.full_name AS user_name,
    u.email AS user_email,
    u.role AS user_role,
    u.department AS user_department,
    res.id AS resource_id,
    res.name AS resource_name,
    res.type AS resource_type,
    res.building,
    res.location,
    res.capacity,
    approver.full_name AS approved_by_name,
    r.approved_at,
    r.created_at
FROM reservations r
JOIN users u ON r.user_id = u.id
JOIN resources res ON r.resource_id = res.id
LEFT JOIN users approver ON r.approved_by = approver.id
WHERE r.status IN ('pending', 'approved')
ORDER BY r.start_time;

-- View: Resource Utilization Statistics
CREATE OR REPLACE VIEW resource_utilization_view AS
SELECT 
    res.id AS resource_id,
    res.name AS resource_name,
    res.type AS resource_type,
    res.building,
    res.status,
    COUNT(r.id) AS total_reservations,
    COUNT(CASE WHEN r.status = 'approved' THEN 1 END) AS approved_reservations,
    COUNT(CASE WHEN r.status = 'pending' THEN 1 END) AS pending_reservations,
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) AS cancelled_reservations,
    COUNT(CASE WHEN r.start_time > NOW() THEN 1 END) AS upcoming_reservations
FROM resources res
LEFT JOIN reservations r ON res.id = r.resource_id
GROUP BY res.id, res.name, res.type, res.building, res.status;

-- ========================================
-- STORED PROCEDURES
-- ========================================

-- Procedure: Check Resource Availability
DELIMITER //
CREATE PROCEDURE check_availability(
    IN p_resource_id INT,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME,
    IN p_exclude_reservation_id INT
)
BEGIN
    SELECT COUNT(*) AS conflict_count
    FROM reservations
    WHERE resource_id = p_resource_id
      AND status NOT IN ('cancelled', 'rejected')
      AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id)
      AND (
          (start_time <= p_start_time AND end_time > p_start_time) OR
          (start_time < p_end_time AND end_time >= p_end_time) OR
          (start_time >= p_start_time AND end_time <= p_end_time)
      );
END //
DELIMITER ;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger: Create notification on reservation status change
DELIMITER //
CREATE TRIGGER after_reservation_status_update
AFTER UPDATE ON reservations
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
        VALUES (
            NEW.user_id,
            CONCAT('Reservation ', UPPER(NEW.status)),
            CONCAT('Your reservation for ', 
                (SELECT name FROM resources WHERE id = NEW.resource_id),
                ' has been ', NEW.status),
            CASE NEW.status
                WHEN 'approved' THEN 'success'
                WHEN 'rejected' THEN 'error'
                WHEN 'cancelled' THEN 'warning'
                ELSE 'info'
            END,
            'reservation',
            NEW.id
        );
    END IF;
END //
DELIMITER ;

-- ========================================
-- INITIAL DATA / SYSTEM SETTINGS
-- ========================================

-- Insert default system settings
INSERT INTO settings (setting_key, setting_value, data_type, description, is_public) VALUES
('system_name', 'Faculty Resource Reservation System', 'string', 'System display name', TRUE),
('max_reservation_days', '30', 'number', 'Maximum days in advance for reservations', TRUE),
('min_reservation_duration', '30', 'number', 'Minimum reservation duration in minutes', TRUE),
('max_reservation_duration', '480', 'number', 'Maximum reservation duration in minutes', TRUE),
('auto_approve_faculty', 'false', 'boolean', 'Auto-approve faculty reservations', FALSE),
('allow_overlapping_bookings', 'false', 'boolean', 'Allow overlapping bookings', FALSE),
('notification_email_enabled', 'true', 'boolean', 'Enable email notifications', FALSE),
('working_hours_start', '08:00', 'string', 'Working hours start time', TRUE),
('working_hours_end', '18:00', 'string', 'Working hours end time', TRUE)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Additional composite indexes for common queries
CREATE INDEX idx_reservations_user_status ON reservations(user_id, status);
CREATE INDEX idx_reservations_resource_time ON reservations(resource_id, start_time, end_time);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ========================================
-- DATABASE INFORMATION
-- ========================================
-- Schema Version: 1.0.0
-- Created: 2025-10-11
-- Last Updated: 2025-10-11
-- Compatible with: Express.js Backend + React Frontend
-- ========================================
