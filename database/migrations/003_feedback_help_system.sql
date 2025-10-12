-- ========================================
-- Feedback and Help System Tables
-- Migration: 003_feedback_help_system
-- ========================================

-- ========================================
-- FEEDBACK TABLE
-- ========================================
-- Stores user feedback submissions

CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category ENUM('bug', 'feature', 'improvement', 'general', 'other') DEFAULT 'general' NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    rating INT DEFAULT NULL COMMENT 'Rating 1-5 stars',
    status ENUM('new', 'in_progress', 'resolved', 'closed') DEFAULT 'new' NOT NULL,
    admin_response TEXT DEFAULT NULL,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    responded_by INT DEFAULT NULL COMMENT 'Admin user ID who responded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='User feedback and suggestions';

-- ========================================
-- HELP_REQUESTS TABLE
-- ========================================
-- Stores help request submissions from users

CREATE TABLE IF NOT EXISTS help_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    topic VARCHAR(255) NOT NULL COMMENT 'Help topic or question category',
    question TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open' NOT NULL,
    admin_response TEXT DEFAULT NULL,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    responded_by INT DEFAULT NULL COMMENT 'Admin user ID who responded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Help requests and support tickets';

-- ========================================
-- FEEDBACK_ATTACHMENTS TABLE (Optional)
-- ========================================
-- Stores attachments/screenshots for feedback

CREATE TABLE IF NOT EXISTS feedback_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    feedback_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NOT NULL COMMENT 'Size in bytes',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
    INDEX idx_feedback_id (feedback_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Attachments for feedback submissions';
