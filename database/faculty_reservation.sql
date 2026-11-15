-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 12, 2025 at 09:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `faculty_reservation`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `check_availability` (IN `p_resource_id` INT, IN `p_start_time` DATETIME, IN `p_end_time` DATETIME, IN `p_exclude_reservation_id` INT)   BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Stand-in structure for view `active_reservations_view`
-- (See below for the actual view)
--
CREATE TABLE `active_reservations_view` (
`id` int(11)
,`start_time` datetime
,`end_time` datetime
,`purpose` text
,`status` enum('pending','approved','rejected','cancelled')
,`notes` text
,`user_id` int(11)
,`user_name` varchar(255)
,`user_email` varchar(255)
,`user_role` enum('student','faculty','admin')
,`user_department` varchar(100)
,`resource_id` int(11)
,`resource_name` varchar(255)
,`resource_type` enum('classroom','lab','equipment','hall','other')
,`building` varchar(100)
,`location` varchar(255)
,`capacity` int(11)
,`approved_by_name` varchar(255)
,`approved_at` timestamp
,`created_at` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL COMMENT 'e.g., CREATE, UPDATE, DELETE, LOGIN',
  `entity_type` varchar(50) NOT NULL COMMENT 'e.g., user, resource, reservation',
  `entity_id` int(11) DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for system actions';

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`, `created_at`) VALUES
(1, 1, 'LOGIN', 'user', 1, NULL, '{\"timestamp\": \"2025-10-11 08:00:00\"}', '192.168.1.100', NULL, '2025-10-11 11:37:49'),
(2, 1, 'CREATE', 'resource', 1, NULL, '{\"name\": \"Lecture Hall A\", \"type\": \"classroom\"}', '192.168.1.100', NULL, '2025-10-11 11:37:49'),
(3, 1, 'APPROVE', 'reservation', 6, NULL, '{\"status\": \"approved\"}', '192.168.1.100', NULL, '2025-10-11 11:37:49'),
(4, 3, 'LOGIN', 'user', 3, NULL, '{\"timestamp\": \"2025-10-11 08:30:00\"}', '192.168.1.101', NULL, '2025-10-11 11:37:49'),
(5, 3, 'CREATE', 'reservation', 6, NULL, '{\"resource_id\": 1, \"start_time\": \"2025-10-12 09:00:00\"}', '192.168.1.101', NULL, '2025-10-11 11:37:49');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User favorite resources';

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `resource_id`, `created_at`) VALUES
(1, 3, 1, '2025-10-11 11:37:49'),
(2, 3, 6, '2025-10-11 11:37:49'),
(3, 7, 6, '2025-10-11 11:37:49'),
(4, 7, 2, '2025-10-11 11:37:49'),
(5, 8, 6, '2025-10-11 11:37:49'),
(6, 9, 4, '2025-10-11 11:37:49');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category` enum('bug','feature','improvement','general','other') NOT NULL DEFAULT 'general',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `rating` int(11) DEFAULT NULL COMMENT 'Rating 1-5 stars',
  `status` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
  `admin_response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL COMMENT 'Admin user ID who responded',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User feedback and suggestions';

-- --------------------------------------------------------

--
-- Table structure for table `feedback_attachments`
--

CREATE TABLE `feedback_attachments` (
  `id` int(11) NOT NULL,
  `feedback_id` int(11) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(50) NOT NULL,
  `file_size` int(11) NOT NULL COMMENT 'Size in bytes',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Attachments for feedback submissions';

-- --------------------------------------------------------

--
-- Table structure for table `help_requests`
--

CREATE TABLE `help_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `topic` varchar(255) NOT NULL COMMENT 'Help topic or question category',
  `question` text NOT NULL,
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `admin_response` text DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `responded_by` int(11) DEFAULT NULL COMMENT 'Admin user ID who responded',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Help requests and support tickets';

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `related_type` enum('reservation','resource','user','system') DEFAULT 'system',
  `related_id` int(11) DEFAULT NULL COMMENT 'ID of related reservation/resource',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User notifications';

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `related_type`, `related_id`, `is_read`, `read_at`, `created_at`) VALUES
(1, 3, 'Reservation Approved', 'Your reservation for Lecture Hall A has been approved', 'success', 'reservation', 6, 1, NULL, '2025-10-11 11:37:49'),
(2, 4, 'Reservation Approved', 'Your reservation for Classroom B2 has been approved', 'success', 'reservation', 7, 1, NULL, '2025-10-11 11:37:49'),
(3, 5, 'Reservation Approved', 'Your reservation for Physics Lab has been approved', 'success', 'reservation', 8, 0, NULL, '2025-10-11 11:37:49'),
(4, 7, 'Reservation Pending', 'Your reservation for Classroom B1 is awaiting approval', 'info', 'reservation', 11, 0, NULL, '2025-10-11 11:37:49'),
(5, 8, 'Reservation Pending', 'Your reservation for Computer Lab 1 is awaiting approval', 'info', 'reservation', 12, 0, NULL, '2025-10-11 11:37:49'),
(6, 11, 'Reservation Rejected', 'Your reservation for Lecture Hall A has been rejected: Outside working hours', 'error', 'reservation', 15, 0, NULL, '2025-10-11 11:37:49'),
(7, 1, 'Welcome to the System', 'Welcome Admin! You have full access to all system features.', 'info', 'system', NULL, 1, NULL, '2025-10-11 11:37:49'),
(8, 3, 'Welcome to the System', 'Welcome Dr. Smith! Start by browsing available resources.', 'info', 'system', NULL, 1, NULL, '2025-10-11 11:37:49'),
(9, 7, 'Welcome to the System', 'Welcome Alice! You can now make reservations for resources.', 'info', 'system', NULL, 0, NULL, '2025-10-11 11:37:49'),
(10, 7, 'Reservation APPROVED', 'Your reservation for Classroom B1 has been approved', 'success', 'reservation', 11, 0, NULL, '2025-10-12 06:23:20'),
(11, 7, 'Reservation CANCELLED', 'Your reservation for Assembly Hall has been cancelled', 'warning', 'reservation', 18, 0, NULL, '2025-10-12 12:10:20'),
(12, 7, 'Reservation APPROVED', 'Your reservation for 3D Printer has been approved', 'success', 'reservation', 17, 0, NULL, '2025-10-12 12:37:42');

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `purpose` text DEFAULT NULL COMMENT 'Reason for reservation',
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `notes` text DEFAULT NULL COMMENT 'Additional notes or special requests',
  `approved_by` int(11) DEFAULT NULL COMMENT 'Admin/Faculty who approved',
  `approved_at` timestamp NULL DEFAULT NULL,
  `cancelled_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `resource_id`, `start_time`, `end_time`, `purpose`, `status`, `notes`, `approved_by`, `approved_at`, `cancelled_reason`, `created_at`, `updated_at`) VALUES
(1, 3, 1, '2025-10-05 02:07:49', '2025-10-05 04:07:49', 'Introduction to Programming lecture', 'approved', 'Need projector setup by 8:45 AM', 1, '2025-10-03 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(2, 4, 2, '2025-10-07 07:07:49', '2025-10-07 09:07:49', 'Engineering Design Workshop', 'approved', NULL, 1, '2025-10-05 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(3, 5, 9, '2025-10-09 03:07:49', '2025-10-09 05:07:49', 'Physics Lab Session - Mechanics', 'approved', 'Class of 20 students', 1, '2025-10-07 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(4, 3, 1, '2025-10-11 09:00:00', '2025-10-11 11:00:00', 'Database Systems Lecture', 'approved', NULL, 1, '2025-10-10 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(5, 7, 6, '2025-10-11 13:00:00', '2025-10-11 15:00:00', 'Group Project Work', 'approved', 'Team of 4 students', 1, '2025-10-09 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(6, 3, 1, '2025-10-13 02:07:49', '2025-10-13 04:07:49', 'Advanced Algorithms Lecture', 'approved', NULL, 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(7, 4, 3, '2025-10-14 07:07:49', '2025-10-14 09:07:49', 'Engineering Seminar', 'approved', NULL, 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(8, 5, 9, '2025-10-15 03:07:49', '2025-10-15 05:07:49', 'Physics Lab - Optics', 'approved', NULL, 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(9, 6, 11, '2025-10-16 06:07:49', '2025-10-16 08:07:49', 'Biology Lab - Cell Culture', 'approved', 'Need sterilization', 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(10, 3, 18, '2025-10-17 08:07:49', '2025-10-17 10:07:49', 'Department Conference', 'approved', NULL, 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(11, 7, 2, '2025-10-14 03:07:49', '2025-10-14 05:07:49', 'Study Group Session', 'approved', 'Group of 5 students', NULL, NULL, NULL, '2025-10-11 11:37:49', '2025-10-12 06:23:20'),
(12, 8, 6, '2025-10-15 07:07:49', '2025-10-15 09:07:49', 'Programming Assignment', 'pending', NULL, NULL, NULL, NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(13, 9, 4, '2025-10-16 04:07:49', '2025-10-16 06:07:49', 'Project Presentation Practice', 'pending', 'Need video conferencing', NULL, NULL, NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(14, 10, 12, '2025-10-17 02:07:49', '2025-10-17 03:07:49', 'Presentation for class project', 'pending', NULL, NULL, NULL, NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(15, 11, 1, '2025-10-13 12:07:49', '2025-10-13 14:07:49', 'Personal study session', 'rejected', 'Outside working hours', 1, '2025-10-11 11:37:49', NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(16, 7, 8, '2025-10-18 03:07:49', '2025-10-18 05:07:49', 'Lab session', 'cancelled', NULL, NULL, NULL, NULL, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(17, 7, 18, '2025-10-13 05:30:00', '2025-10-13 17:30:00', 'printing plastic cups', 'approved', NULL, NULL, NULL, NULL, '2025-10-12 12:01:47', '2025-10-12 12:37:42'),
(18, 7, 20, '2025-10-13 06:32:00', '2025-10-14 17:32:00', 'assemble function', 'cancelled', NULL, NULL, NULL, NULL, '2025-10-12 12:02:31', '2025-10-12 12:10:20'),
(19, 16, 21, '2025-10-16 08:40:00', '2025-10-16 09:41:00', 'award ceremony and assembly', 'pending', NULL, NULL, NULL, NULL, '2025-10-12 13:09:19', '2025-10-12 13:09:19'),
(20, 16, 16, '2025-10-15 11:00:00', '2025-10-15 12:00:00', 'graduation ceremony', 'pending', NULL, NULL, NULL, NULL, '2025-10-12 13:27:19', '2025-10-12 13:27:19');

--
-- Triggers `reservations`
--
DELIMITER $$
CREATE TRIGGER `after_reservation_status_update` AFTER UPDATE ON `reservations` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('classroom','lab','equipment','hall','other') NOT NULL,
  `building` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL COMMENT 'Room number or specific location',
  `capacity` int(11) DEFAULT NULL COMMENT 'Maximum number of people/items',
  `description` text DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional features like projector, whiteboard, etc' CHECK (json_valid(`features`)),
  `image_url` varchar(500) DEFAULT NULL,
  `status` enum('available','unavailable','maintenance') DEFAULT 'available',
  `requires_approval` tinyint(1) DEFAULT 1 COMMENT 'Whether reservations need admin approval',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Available resources for reservation';

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`id`, `name`, `type`, `building`, `location`, `capacity`, `description`, `features`, `image_url`, `status`, `requires_approval`, `created_at`, `updated_at`) VALUES
(1, 'Lecture Hall A', 'classroom', 'Science Building', 'Room 101', 150, 'Large lecture hall with tiered seating', '{\"projector\": true, \"whiteboard\": true, \"audio_system\": true, \"video_recording\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(2, 'Classroom B1', 'classroom', 'Science Building', 'Room 201', 40, 'Medium-sized classroom', '{\"projector\": true, \"whiteboard\": true, \"smartboard\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(3, 'Classroom B2', 'classroom', 'Science Building', 'Room 202', 40, 'Medium-sized classroom', '{\"projector\": true, \"whiteboard\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(4, 'Seminar Room C', 'classroom', 'Engineering Building', 'Room 301', 25, 'Small seminar room', '{\"tv_screen\": true, \"whiteboard\": true, \"video_conference\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(5, 'Tutorial Room D', 'classroom', 'Math Building', 'Room 105', 20, 'Tutorial and discussion room', '{\"whiteboard\": true, \"round_tables\": true}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(6, 'Computer Lab 1', 'lab', 'IT Building', 'Lab A', 30, 'General purpose computer lab', '{\"computers\": 30, \"windows\": true, \"projector\": true, \"printer\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(7, 'Computer Lab 2', 'lab', 'IT Building', 'Lab B', 25, 'Advanced computing lab', '{\"computers\": 25, \"linux\": true, \"windows\": true, \"high_spec\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(8, 'Programming Lab', 'lab', 'IT Building', 'Lab C', 20, 'Specialized programming lab', '{\"computers\": 20, \"multiple_monitors\": true, \"dev_tools\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(9, 'Physics Lab', 'lab', 'Science Building', 'Lab 301', 25, 'Physics experiments laboratory', '{\"lab_equipment\": true, \"safety_equipment\": true, \"fume_hood\": false}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(10, 'Chemistry Lab', 'lab', 'Science Building', 'Lab 302', 20, 'Chemistry laboratory with fume hoods', '{\"lab_equipment\": true, \"safety_equipment\": true, \"fume_hood\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(11, 'Biology Lab', 'lab', 'Science Building', 'Lab 401', 24, 'Biology and life sciences lab', '{\"microscopes\": true, \"lab_equipment\": true, \"refrigeration\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(12, 'Projector - Portable 1', 'equipment', 'Equipment Center', 'Storage A', 1, 'HD projector with HDMI', '{\"hdmi\": true, \"vga\": true, \"wireless\": false, \"brightness\": \"3000_lumens\"}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(13, 'Projector - Portable 2', 'equipment', 'Equipment Center', 'Storage A', 1, 'HD projector with wireless', '{\"hdmi\": true, \"wireless\": true, \"brightness\": \"3500_lumens\"}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(14, 'Laptop - Dell 1', 'equipment', 'Equipment Center', 'Storage B', 1, 'Dell laptop for presentations', '{\"ram\": \"16GB\", \"processor\": \"i7\", \"os\": \"Windows 11\"}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(15, 'Laptop - Dell 2', 'equipment', 'Equipment Center', 'Storage B', 1, 'Dell laptop for presentations', '{\"ram\": \"16GB\", \"processor\": \"i7\", \"os\": \"Windows 11\"}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(16, 'Camera - Canon DSLR', 'equipment', 'Equipment Center', 'Storage C', 1, 'Professional DSLR camera', '{\"megapixels\": \"24MP\", \"video\": \"4K\", \"lenses\": \"2\"}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(17, 'Microphone Set', 'equipment', 'Equipment Center', 'Storage D', 1, 'Wireless microphone system', '{\"wireless\": true, \"channels\": 2, \"range\": \"100m\"}', NULL, 'available', 0, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(18, '3D Printer', 'equipment', 'Engineering Building', 'Maker Space', 1, 'FDM 3D printer', '{\"build_volume\": \"300x300x400mm\", \"materials\": \"PLA, ABS, PETG\"}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(19, 'Conference Hall', 'hall', 'Main Building', 'Ground Floor', 200, 'Large conference and event hall', '{\"stage\": true, \"audio_system\": true, \"projector\": true, \"seating\": \"theater_style\"}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(20, 'Assembly Hall', 'hall', 'Main Building', '2nd Floor', 500, 'Main assembly hall for large events', '{\"stage\": true, \"audio_system\": true, \"lighting\": true, \"video_wall\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(21, 'Auditorium', 'hall', 'Arts Building', 'Ground Floor', 300, 'Theater-style auditorium', '{\"stage\": true, \"audio_system\": true, \"lighting\": true, \"backstage\": true}', NULL, 'available', 1, '2025-10-11 11:37:49', '2025-10-11 11:37:49');

-- --------------------------------------------------------

--
-- Table structure for table `resource_schedules`
--

CREATE TABLE `resource_schedules` (
  `id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `recurring` tinyint(1) DEFAULT 1,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Regular schedules for resources';

--
-- Dumping data for table `resource_schedules`
--

INSERT INTO `resource_schedules` (`id`, `resource_id`, `day_of_week`, `start_time`, `end_time`, `recurring`, `effective_from`, `effective_until`, `description`, `created_at`, `updated_at`) VALUES
(1, 1, 'Monday', '09:00:00', '11:00:00', 1, '2025-10-11', '2026-02-11', 'CS101 - Introduction to Programming', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(2, 1, 'Wednesday', '09:00:00', '11:00:00', 1, '2025-10-11', '2026-02-11', 'CS101 - Introduction to Programming', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(3, 1, 'Friday', '14:00:00', '16:00:00', 1, '2025-10-11', '2026-02-11', 'CS201 - Data Structures', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(4, 6, 'Tuesday', '10:00:00', '12:00:00', 1, '2025-10-11', '2026-02-11', 'CS Lab Session A', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(5, 6, 'Thursday', '10:00:00', '12:00:00', 1, '2025-10-11', '2026-02-11', 'CS Lab Session B', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(6, 9, 'Monday', '14:00:00', '17:00:00', 1, '2025-10-11', '2026-02-11', 'Physics Lab - Section A', '2025-10-11 11:37:49', '2025-10-11 11:37:49'),
(7, 9, 'Thursday', '14:00:00', '17:00:00', 1, '2025-10-11', '2026-02-11', 'Physics Lab - Section B', '2025-10-11 11:37:49', '2025-10-11 11:37:49');

-- --------------------------------------------------------

--
-- Stand-in structure for view `resource_utilization_view`
-- (See below for the actual view)
--
CREATE TABLE `resource_utilization_view` (
`resource_id` int(11)
,`resource_name` varchar(255)
,`resource_type` enum('classroom','lab','equipment','hall','other')
,`building` varchar(100)
,`status` enum('available','unavailable','maintenance')
,`total_reservations` bigint(21)
,`approved_reservations` bigint(21)
,`pending_reservations` bigint(21)
,`cancelled_reservations` bigint(21)
,`upcoming_reservations` bigint(21)
);

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `data_type` enum('string','number','boolean','json') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT 0 COMMENT 'Whether setting is visible to non-admins',
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System configuration settings';

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `setting_key`, `setting_value`, `data_type`, `description`, `is_public`, `updated_by`, `created_at`, `updated_at`) VALUES
(1, 'system_name', 'Faculty Resource Reservation System', 'string', 'System display name', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(2, 'max_reservation_days', '30', 'number', 'Maximum days in advance for reservations', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(3, 'min_reservation_duration', '30', 'number', 'Minimum reservation duration in minutes', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(4, 'max_reservation_duration', '480', 'number', 'Maximum reservation duration in minutes', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(5, 'auto_approve_faculty', 'false', 'boolean', 'Auto-approve faculty reservations', 0, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(6, 'allow_overlapping_bookings', 'false', 'boolean', 'Allow overlapping bookings', 0, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(7, 'notification_email_enabled', 'true', 'boolean', 'Enable email notifications', 0, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(8, 'working_hours_start', '08:00', 'string', 'Working hours start time', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34'),
(9, 'working_hours_end', '18:00', 'string', 'Working hours end time', 1, NULL, '2025-10-11 11:37:34', '2025-10-11 11:37:34');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL COMMENT 'Hashed password using bcryptjs',
  `role` enum('student','faculty','admin') NOT NULL DEFAULT 'student',
  `department` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_picture` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User accounts for students, faculty, and administrators';

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `role`, `department`, `phone`, `profile_picture`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'Nisal Sanjaya', 'admin@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'admin', 'Administration', '0764094163', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-12 06:27:03'),
(2, 'Nisal Sanjaya', 'nisal.sanjaya@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'admin', 'IT Administration', '555-0101', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:22:05'),
(3, 'Sunil Fernando', 'sunil.fernando@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'faculty', 'Computer Science', '555-0200', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:11:12'),
(4, 'Sandya Wickramasinghe', 'sandya.wickramasinghe@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'faculty', 'Engineering', '555-0201', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:11:12'),
(5, 'Pradeep Jayasinghe', 'pradeep.jayasinghe@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'faculty', 'Mathematics', '555-0202', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:11:12'),
(6, 'Dilini Rajapaksha', 'dilini.rajapaksha@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'faculty', 'Physics', '555-0203', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:11:12'),
(7, 'Nisal Sanjaya', 'nisal@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '0778441196', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-12 07:39:08'),
(8, 'Lakshani', 'lakshani@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0301', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(9, 'Arundi', 'arundi@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0302', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(10, 'Sanjeewa', 'sanjeewa@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0303', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(11, 'Achini', 'achini@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0304', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(12, 'Chamodi', 'chamodi@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0305', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(13, 'Harshani', 'harshani@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0306', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(14, 'Kavindi', 'kavindi@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', '555-0307', NULL, 1, NULL, '2025-10-11 11:37:49', '2025-10-11 21:15:41'),
(15, 'Isumi', 'isumi@foc.sjp.ac.lk', '$2a$10$LoJtRLhc283AI6gg7XMds.Rpz5MglH38qMUEtd06U3p1CbYDtwyEu', 'student', 'Computer Science', NULL, NULL, 1, NULL, '2025-10-11 21:15:42', '2025-10-11 21:15:42'),
(16, 'Tharindu Rangana', 'tharindu@foc.sjp.ac.lk', '$2a$10$u1w7HrLH15lmgMXgwfTZAOSrEeKDEmnepS1AZpNYC4AGWOlFfzyQK', 'student', 'computer_science', 'FC111530', NULL, 1, NULL, '2025-10-12 13:08:11', '2025-10-12 13:08:11');

-- --------------------------------------------------------

--
-- Structure for view `active_reservations_view`
--
DROP TABLE IF EXISTS `active_reservations_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `active_reservations_view`  AS SELECT `r`.`id` AS `id`, `r`.`start_time` AS `start_time`, `r`.`end_time` AS `end_time`, `r`.`purpose` AS `purpose`, `r`.`status` AS `status`, `r`.`notes` AS `notes`, `u`.`id` AS `user_id`, `u`.`full_name` AS `user_name`, `u`.`email` AS `user_email`, `u`.`role` AS `user_role`, `u`.`department` AS `user_department`, `res`.`id` AS `resource_id`, `res`.`name` AS `resource_name`, `res`.`type` AS `resource_type`, `res`.`building` AS `building`, `res`.`location` AS `location`, `res`.`capacity` AS `capacity`, `approver`.`full_name` AS `approved_by_name`, `r`.`approved_at` AS `approved_at`, `r`.`created_at` AS `created_at` FROM (((`reservations` `r` join `users` `u` on(`r`.`user_id` = `u`.`id`)) join `resources` `res` on(`r`.`resource_id` = `res`.`id`)) left join `users` `approver` on(`r`.`approved_by` = `approver`.`id`)) WHERE `r`.`status` in ('pending','approved') ORDER BY `r`.`start_time` ASC ;

-- --------------------------------------------------------

--
-- Structure for view `resource_utilization_view`
--
DROP TABLE IF EXISTS `resource_utilization_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `resource_utilization_view`  AS SELECT `res`.`id` AS `resource_id`, `res`.`name` AS `resource_name`, `res`.`type` AS `resource_type`, `res`.`building` AS `building`, `res`.`status` AS `status`, count(`r`.`id`) AS `total_reservations`, count(case when `r`.`status` = 'approved' then 1 end) AS `approved_reservations`, count(case when `r`.`status` = 'pending' then 1 end) AS `pending_reservations`, count(case when `r`.`status` = 'cancelled' then 1 end) AS `cancelled_reservations`, count(case when `r`.`start_time` > current_timestamp() then 1 end) AS `upcoming_reservations` FROM (`resources` `res` left join `reservations` `r` on(`res`.`id` = `r`.`resource_id`)) GROUP BY `res`.`id`, `res`.`name`, `res`.`type`, `res`.`building`, `res`.`status` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_favorite` (`user_id`,`resource_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_resource` (`resource_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responded_by` (`responded_by`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `feedback_attachments`
--
ALTER TABLE `feedback_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_feedback_id` (`feedback_id`);

--
-- Indexes for table `help_requests`
--
ALTER TABLE `help_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `responded_by` (`responded_by`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`is_read`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_resource` (`resource_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_time_range` (`start_time`,`end_time`),
  ADD KEY `idx_approved_by` (`approved_by`),
  ADD KEY `idx_reservations_user_status` (`user_id`,`status`),
  ADD KEY `idx_reservations_resource_time` (`resource_id`,`start_time`,`end_time`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_building` (`building`),
  ADD KEY `idx_name` (`name`);
ALTER TABLE `resources` ADD FULLTEXT KEY `idx_search` (`name`,`description`);

--
-- Indexes for table `resource_schedules`
--
ALTER TABLE `resource_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_resource` (`resource_id`),
  ADD KEY `idx_day` (`day_of_week`),
  ADD KEY `idx_effective` (`effective_from`,`effective_until`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_key` (`setting_key`),
  ADD KEY `idx_public` (`is_public`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `idx_active` (`is_active`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback_attachments`
--
ALTER TABLE `feedback_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `help_requests`
--
ALTER TABLE `help_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `resource_schedules`
--
ALTER TABLE `resource_schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `feedback_attachments`
--
ALTER TABLE `feedback_attachments`
  ADD CONSTRAINT `feedback_attachments_ibfk_1` FOREIGN KEY (`feedback_id`) REFERENCES `feedback` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `help_requests`
--
ALTER TABLE `help_requests`
  ADD CONSTRAINT `help_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `help_requests_ibfk_2` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reservations_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `resource_schedules`
--
ALTER TABLE `resource_schedules`
  ADD CONSTRAINT `resource_schedules_ibfk_1` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `settings`
--
ALTER TABLE `settings`
  ADD CONSTRAINT `settings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
