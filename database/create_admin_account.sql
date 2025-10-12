-- ========================================
-- CREATE ADMIN ACCOUNT SCRIPT
-- Faculty Resource Reservation System
-- ========================================
-- This script helps you create or promote admin accounts

USE faculty_reservation;

-- ========================================
-- METHOD 1: CREATE NEW ADMIN ACCOUNT
-- ========================================
-- Note: Replace the password hash with an actual bcrypt hash
-- Generate hash at: https://bcrypt-generator.com/ (use 10 rounds)
-- Or use Node.js: bcrypt.hashSync('your-password', 10)

-- Example: Create admin account
INSERT INTO users (
    full_name,
    email,
    password,
    role,
    department,
    phone,
    is_active
) VALUES (
    'System Administrator',                                    -- Full name
    'admin@yourdomain.com',                                    -- Email (change this)
    '$2b$10$YourBcryptHashedPasswordHere',                     -- Bcrypt hash (CHANGE THIS!)
    'admin',                                                   -- Role: admin
    'IT Department',                                           -- Department
    '+1234567890',                                             -- Phone (optional)
    TRUE                                                       -- Active status
);

-- Verify the new admin was created
SELECT id, full_name, email, role, department, is_active, created_at
FROM users
WHERE email = 'admin@yourdomain.com';

-- ========================================
-- METHOD 2: PROMOTE EXISTING USER TO ADMIN
-- ========================================

-- Check current users (to find who to promote)
SELECT id, full_name, email, role, department
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Promote a specific user to admin by email
UPDATE users 
SET role = 'admin',
    department = 'Administration'  -- Optional: update department
WHERE email = 'user@example.com';  -- CHANGE THIS EMAIL

-- Verify the promotion
SELECT id, full_name, email, role, department, updated_at
FROM users
WHERE email = 'user@example.com';  -- CHANGE THIS EMAIL

-- ========================================
-- METHOD 3: BATCH CREATE MULTIPLE ADMINS
-- ========================================

-- Insert multiple admin accounts at once
INSERT INTO users (full_name, email, password, role, department, is_active) VALUES
('Admin One', 'admin1@domain.com', '$2b$10$HASH_HERE', 'admin', 'IT', TRUE),
('Admin Two', 'admin2@domain.com', '$2b$10$HASH_HERE', 'admin', 'Management', TRUE),
('Admin Three', 'admin3@domain.com', '$2b$10$HASH_HERE', 'admin', 'Operations', TRUE);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- List all admin users
SELECT 
    id,
    full_name,
    email,
    role,
    department,
    is_active,
    last_login,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Count users by role
SELECT 
    role,
    COUNT(*) as total_users,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users
FROM users
GROUP BY role
ORDER BY role;

-- ========================================
-- ADMIN MANAGEMENT QUERIES
-- ========================================

-- Temporarily disable an admin account (useful for security)
UPDATE users 
SET is_active = FALSE 
WHERE email = 'admin@email.com'
AND role = 'admin';

-- Re-enable an admin account
UPDATE users 
SET is_active = TRUE 
WHERE email = 'admin@email.com'
AND role = 'admin';

-- Demote admin to faculty (preserve user but remove admin privileges)
UPDATE users 
SET role = 'faculty' 
WHERE email = 'admin@email.com';

-- Demote admin to student
UPDATE users 
SET role = 'student' 
WHERE email = 'admin@email.com';

-- Update admin password (use a new bcrypt hash)
UPDATE users 
SET password = '$2b$10$NewBcryptHashHere'
WHERE email = 'admin@email.com';

-- ========================================
-- SECURITY AUDIT QUERIES
-- ========================================

-- Find admins who haven't logged in recently (potential security risk)
SELECT 
    full_name,
    email,
    last_login,
    DATEDIFF(NOW(), last_login) as days_since_login
FROM users
WHERE role = 'admin'
AND (last_login IS NULL OR last_login < DATE_SUB(NOW(), INTERVAL 90 DAY))
ORDER BY last_login ASC;

-- List all active admin accounts
SELECT 
    id,
    full_name,
    email,
    department,
    last_login,
    DATE_FORMAT(created_at, '%Y-%m-%d') as created_date
FROM users
WHERE role = 'admin' 
AND is_active = TRUE
ORDER BY last_login DESC;

-- Check for duplicate email addresses (should return 0 rows)
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING count > 1;

-- ========================================
-- CLEANUP QUERIES (USE WITH CAUTION!)
-- ========================================

-- Delete inactive admin accounts (CAREFUL!)
-- DELETE FROM users 
-- WHERE role = 'admin' 
-- AND is_active = FALSE
-- AND last_login < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Remove admin role from all test accounts
-- UPDATE users 
-- SET role = 'student'
-- WHERE email LIKE '%test%'
-- AND role = 'admin';

-- ========================================
-- EXAMPLE: Complete Admin Creation Process
-- ========================================

-- Step 1: Generate password hash (example only, use real bcrypt!)
-- Password: "Admin@2025Secure"
-- Bcrypt Hash (10 rounds): $2b$10$vQx7c5sZF.LMoUZN6qPWWe8qQZH4kPLGx5C.YJU2X.aNHQc8LFaXW

-- Step 2: Insert new admin
-- INSERT INTO users (full_name, email, password, role, department, is_active)
-- VALUES (
--     'John Doe',
--     'john.doe@university.edu',
--     '$2b$10$vQx7c5sZF.LMoUZN6qPWWe8qQZH4kPLGx5C.YJU2X.aNHQc8LFaXW',
--     'admin',
--     'IT Department',
--     TRUE
-- );

-- Step 3: Verify
-- SELECT id, full_name, email, role FROM users WHERE email = 'john.doe@university.edu';

-- Step 4: Test login via API
-- POST http://localhost:5000/api/auth/login
-- { "email": "john.doe@university.edu", "password": "Admin@2025Secure" }

-- ========================================
-- QUICK REFERENCE
-- ========================================
/*
ROLE TYPES:
- 'student'  : Default role, basic access
- 'faculty'  : Can approve reservations, respond to help tickets
- 'admin'    : Full system access, all privileges

PASSWORD REQUIREMENTS:
- Must be hashed with bcrypt (rounds=10)
- Never store plain text passwords
- Use strong passwords (12+ chars, mixed case, numbers, symbols)

GENERATING BCRYPT HASH:
1. Online: https://bcrypt-generator.com/ (set rounds to 10)
2. Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('password', 10);
3. Command line: node -e "console.log(require('bcryptjs').hashSync('password', 10))"

EMAIL VALIDATION:
- Any valid email format accepted
- No domain restrictions
- Must be unique across all users
- Case-insensitive (stored as-is but compared case-insensitively)

SECURITY BEST PRACTICES:
✓ Use strong, unique passwords for admin accounts
✓ Limit number of admin accounts to necessary personnel only
✓ Regularly audit admin user list
✓ Deactivate (don't delete) when removing admin access
✓ Monitor last_login dates for inactive accounts
✓ Use faculty role for departmental managers instead of admin
*/

-- ========================================
-- END OF SCRIPT
-- ========================================
