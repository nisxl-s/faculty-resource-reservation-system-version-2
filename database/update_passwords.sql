-- Update passwords for testing
-- Password: password123
-- Hash generated with: bcrypt.hash('password123', 10)

UPDATE users 
SET password = '$2a$10$sb2N3yu8UWN2ukq31FZ4FOqNumYvY04cgDA5wA9iLqVMWPXMYsMOq'
WHERE email IN ('admin@university.edu', 'john.smith@university.edu');

SELECT id, email, role, LEFT(password, 20) as password_start 
FROM users 
WHERE email IN ('admin@university.edu', 'john.smith@university.edu');
