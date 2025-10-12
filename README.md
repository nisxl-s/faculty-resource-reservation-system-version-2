# Faculty Resource Reservation System

A comprehensive web-based resource management system for educational institutions, enabling students and faculty to browse, book, and manage institutional resources efficiently.

## 📋 Project Overview

The Faculty Resource Reservation System is a full-stack web application built with modern technologies to streamline the process of reserving institutional resources such as:
- 📚 Laboratories
- 💻 Equipment
- 🏢 Meeting Rooms
- 📊 Projectors and Audio-Visual Equipment
- 🔬 Research Facilities

### Key Features

#### 🔐 Authentication & Authorization
- Role-based access control (Admin, Faculty, Student)
- Secure JWT-based authentication
- Protected routes and API endpoints
- Password hashing with bcrypt

#### 👥 User Management
- User registration with email validation
- Profile management (view/edit personal information)
- Department and role assignment
- User activity tracking

#### 📦 Resource Management
- Browse available resources with filtering
- Real-time availability checking
- Resource categorization and search
- Detailed resource information display
- Image gallery for resources

#### 📅 Booking System
- Interactive date/time selection
- Conflict prevention (no double-booking)
- Booking purpose documentation
- Auto-approval system
- Booking history tracking

#### 📬 Notification System
- Real-time notifications for booking status
- Email notifications (configurable)
- In-app notification center
- Mark as read/unread functionality

#### 💬 Feedback & Help System
- Post-booking feedback collection
- Help center with FAQs
- Help request submission
- Contact information display
- Guest access to help resources

#### 👨‍💼 Admin Dashboard
- User management (CRUD operations)
- Resource management
- Booking oversight and management
- System analytics and statistics
- Recent activity monitoring

## 🏗️ Technology Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router DOM 6.x** - Client-side routing
- **Lucide React** - Icon library
- **Custom CSS** - Styling with modern animations
- **Fetch API** - HTTP requests

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing
- **Nodemon** - Development auto-restart

### Database
- **MySQL 8.0+** - Primary database
- **Structured schema** - Normalized tables
- **Foreign key constraints** - Data integrity
- **Indexes** - Optimized queries

## 📁 Project Structure

```
faculty-resource-reservation-system-version-2-fixed/
│
├── client/                          # React Frontend Application
│   ├── public/
│   │   ├── index.html              # Main HTML template
│   │   └── bg-image.jpeg           # Background image asset
│   │
│   ├── src/
│   │   ├── assets/                 # Static assets
│   │   │   ├── css/                # Component-specific CSS files
│   │   │   │   ├── admin.css
│   │   │   │   ├── bookinghistory.css
│   │   │   │   ├── features.css
│   │   │   │   ├── footer.css
│   │   │   │   ├── global.css
│   │   │   │   ├── helpstyle.css
│   │   │   │   ├── hero.css
│   │   │   │   ├── legal.css
│   │   │   │   ├── login_styles.css
│   │   │   │   ├── navbar.css
│   │   │   │   ├── notify.css
│   │   │   │   ├── reg_styles.css
│   │   │   │   ├── student.css
│   │   │   │   └── ...
│   │   │   └── images/             # Image assets
│   │   │
│   │   ├── components/             # Reusable React components
│   │   │   ├── footer/
│   │   │   │   ├── Footer.jsx      # Main footer with help modal
│   │   │   │   ├── Footer.css
│   │   │   │   └── index.js        # Footer export
│   │   │   ├── header/
│   │   │   ├── AdminHeader.jsx     # Admin navigation header
│   │   │   ├── StudentHeader.jsx   # Student navigation header
│   │   │   ├── navbar.jsx          # Main navigation bar
│   │   │   ├── FloatingFeedbackButton.jsx  # Feedback modal
│   │   │   └── FloatingHelpButton.jsx      # Help modal
│   │   │
│   │   ├── config/
│   │   │   └── api.js              # API endpoints configuration
│   │   │
│   │   ├── context/                # React Context providers
│   │   │
│   │   ├── css/                    # Global CSS styles
│   │   │   ├── admin.css
│   │   │   ├── features.css
│   │   │   ├── footer.css
│   │   │   ├── global.css
│   │   │   ├── hero.css
│   │   │   ├── nav.css
│   │   │   ├── navbar.css
│   │   │   ├── notify.css
│   │   │   ├── user_management.css
│   │   │   └── user.css
│   │   │
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── animations.js
│   │   │   ├── carousel.js
│   │   │   ├── effects.js
│   │   │   ├── extra.js
│   │   │   ├── mobile-nav.js
│   │   │   ├── navbar.js
│   │   │   ├── useCarousel.js
│   │   │   ├── useFadeScroll.js
│   │   │   ├── useMobileNavbar.js
│   │   │   └── useNavbarEffects.js
│   │   │
│   │   ├── pages/                  # Page-level components
│   │   │   ├── HomePage.jsx        # Landing page
│   │   │   ├── LoginPage.jsx       # User login
│   │   │   ├── RegisterPage.jsx    # User registration
│   │   │   ├── StudentDashboard.jsx  # Student main dashboard
│   │   │   ├── admin.jsx           # Admin dashboard
│   │   │   ├── BrowseResources.jsx # Resource catalog
│   │   │   ├── BookResource.jsx    # Resource booking form
│   │   │   ├── MyReservations.jsx  # User's booking history
│   │   │   ├── Profile.jsx         # User profile (admin/faculty)
│   │   │   ├── StudentProfile.jsx  # Student profile
│   │   │   ├── Help.jsx            # Help center page
│   │   │   ├── Feedback.jsx        # Feedback page
│   │   │   ├── Legal.jsx           # Legal/terms page
│   │   │   ├── notify.jsx          # Notifications page
│   │   │   ├── bookinghistory.jsx  # Booking history
│   │   │   ├── user_management.jsx # User management (admin)
│   │   │   └── user.jsx            # User details
│   │   │
│   │   ├── services/               # API service functions
│   │   │
│   │   ├── App.js                  # Root React component
│   │   └── index.js                # React entry point
│   │
│   ├── package.json                # Frontend dependencies
│   ├── craco.config.js             # Create React App config
│   └── README.md                   # Frontend documentation
│
├── server/                          # Express Backend Application
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # MySQL connection configuration
│   │   │
│   │   ├── controllers/            # Business logic controllers
│   │   │   ├── authController.js   # Authentication logic
│   │   │   ├── feedbackController.js  # Feedback handling
│   │   │   ├── helpController.js   # Help request handling
│   │   │   ├── reservationController.js  # Booking management
│   │   │   └── resourceController.js     # Resource management
│   │   │
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication middleware
│   │   │
│   │   ├── models/                 # Database models
│   │   │   ├── Reservation.js      # Reservation model
│   │   │   ├── Resource.js         # Resource model
│   │   │   └── User.js             # User model
│   │   │
│   │   ├── routes/                 # API route definitions
│   │   │   ├── authRoutes.js       # Auth endpoints (/login, /register)
│   │   │   ├── feedback.js         # Feedback endpoints
│   │   │   ├── help.js             # Help request endpoints
│   │   │   ├── notificationRoutes.js  # Notification endpoints
│   │   │   ├── reservationRoutes.js   # Booking endpoints
│   │   │   └── resourceRoutes.js      # Resource endpoints
│   │   │
│   │   └── server.js               # Express app entry point
│   │
│   ├── package.json                # Backend dependencies
│   ├── start-server.bat            # Windows startup script
│   ├── SERVER_README.md            # Backend documentation
│   └── README.md                   # Backend setup guide
│
├── database/                        # Database Setup & Management
│   ├── migrations/                 # Database migration scripts
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_example_migration.sql
│   │   └── 003_feedback_help_system.sql
│   │
│   ├── seeds/                      # Sample data scripts
│   │   └── seed_data.sql
│   │
│   ├── schema.sql                  # Complete database schema
│   ├── create_admin_account.sql    # Admin user creation
│   ├── update_passwords.sql        # Password update utility
│   ├── setup_database.ps1          # PowerShell setup script
│   ├── setup_database.sh           # Bash setup script
│   ├── DATABASE_SETUP_COMPLETE.md  # Setup documentation
│   ├── MANUAL_SETUP.md             # Manual setup guide
│   └── README.md                   # Database documentation
│
├── .env                            # Environment variables (not in git)
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── START_SERVERS.bat               # Windows server startup script
├── START_SERVERS.ps1               # PowerShell server startup script
└── README.md                       # Main project documentation (this file)
```

## 🗄️ Database Schema

### Tables

#### users
- `user_id` (PK) - Auto-increment ID
- `full_name` - User's full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (admin, faculty, student)
- `department` - Department name
- `phone` - Contact number
- `created_at` - Account creation timestamp

#### resources
- `resource_id` (PK) - Auto-increment ID
- `name` - Resource name
- `type` - Resource type/category
- `description` - Detailed description
- `location` - Physical location
- `capacity` - Maximum capacity
- `availability_status` - Current status
- `image_url` - Resource image path
- `created_at` - Creation timestamp

#### reservations
- `reservation_id` (PK) - Auto-increment ID
- `user_id` (FK) - References users table
- `resource_id` (FK) - References resources table
- `start_time` - Booking start datetime
- `end_time` - Booking end datetime
- `purpose` - Booking reason/purpose
- `status` - Booking status (pending, approved, rejected)
- `created_at` - Booking creation timestamp

#### notifications
- `notification_id` (PK) - Auto-increment ID
- `user_id` (FK) - References users table
- `message` - Notification text
- `type` - Notification type
- `is_read` - Read status flag
- `created_at` - Notification timestamp

#### feedback
- `feedback_id` (PK) - Auto-increment ID
- `user_id` (FK) - References users table
- `category` - Feedback category
- `subject` - Feedback subject
- `message` - Feedback content
- `rating` - Rating (1-5 stars)
- `status` - Processing status
- `created_at` - Submission timestamp

#### help_requests
- `help_id` (PK) - Auto-increment ID
- `user_id` (FK) - References users table (nullable for guests)
- `topic` - Help topic
- `question` - Question/issue description
- `priority` - Priority level (low, medium, high)
- `status` - Request status (open, in_progress, resolved)
- `is_guest` - Guest user flag
- `created_at` - Submission timestamp

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** (v8.0 or higher)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd faculty-resource-reservation-system-version-2
   ```

2. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure:
   - `DB_HOST` - Database host (default: localhost)
   - `DB_USER` - Database username (default: root)
   - `DB_PASSWORD` - Database password
   - `DB_NAME` - Database name (default: faculty_reservation)
   - `JWT_SECRET` - Secret key for JWT tokens
   - `PORT` - Backend server port (default: 5000)

3. **Setup Database**
   
   **Option A: Automated (Windows PowerShell)**
   ```powershell
   cd database
   .\setup_database.ps1
   ```
   
   **Option B: Automated (Linux/Mac)**
   ```bash
   cd database
   chmod +x setup_database.sh
   ./setup_database.sh
   ```
   
   **Option C: Manual**
   ```bash
   cd database
   mysql -u root -p < schema.sql
   mysql -u root -p faculty_reservation < seeds/seed_data.sql
   mysql -u root -p faculty_reservation < create_admin_account.sql
   ```

4. **Install Dependencies**
   
   **Backend**
   ```bash
   cd server
   npm install
   ```
   
   **Frontend**
   ```bash
   cd client
   npm install
   ```

5. **Start the Application**
   
   **Option A: Both servers (Windows)**
   ```bash
   # From project root
   .\START_SERVERS.bat
   ```
   
   **Option B: Both servers (PowerShell)**
   ```powershell
   # From project root
   .\START_SERVERS.ps1
   ```
   
   **Option C: Separate terminals**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

### Default Credentials

After running the database setup, you can login with:

**Admin Account**
- Email: `admin@faculty.edu`
- Password: `admin123`

**Test Student Account**
- Email: `student@faculty.edu`
- Password: `student123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Resources
- `GET /api/resources` - Get all resources
- `GET /api/resources/:id` - Get resource by ID
- `POST /api/resources` - Create resource (Admin)
- `PUT /api/resources/:id` - Update resource (Admin)
- `DELETE /api/resources/:id` - Delete resource (Admin)

### Reservations
- `GET /api/reservations` - Get all reservations (Admin)
- `GET /api/reservations/user/:userId` - Get user's reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `POST /api/reservations/check-availability` - Check time slot availability

### Notifications
- `GET /api/notifications/user/:userId` - Get user's notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `DELETE /api/notifications/:id` - Delete notification

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (Admin)
- `PUT /api/feedback/:id/status` - Update feedback status (Admin)

### Help
- `POST /api/help` - Submit help request
- `GET /api/help` - Get all help requests (Admin)
- `PUT /api/help/:id/status` - Update help request status (Admin)

## 🎨 Features Highlights

### 1. Interactive Dashboard
- Real-time statistics
- Quick action buttons
- Recent activity feed
- Responsive grid layout

### 2. Smart Booking System
- Calendar integration
- Time slot selection
- Conflict detection
- Instant feedback

### 3. Modern UI/UX
- Dark theme help modals
- Smooth animations
- Mobile-responsive design
- Intuitive navigation

### 4. Feedback System
- Star rating (1-5)
- Category selection
- Auto-open after booking
- Admin review dashboard

### 5. Help Center
- Searchable FAQs
- Quick links (auth-aware)
- Help request submission
- Contact information
- Guest access enabled

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- SQL injection prevention
- XSS protection
- CORS configuration
- Input validation

## 🛠️ Development

### Code Structure Guidelines

- **Components**: Reusable, single-responsibility React components
- **Pages**: Route-level components with business logic
- **Controllers**: Handle business logic, not presentation
- **Models**: Database interaction layer
- **Routes**: API endpoint definitions
- **Middleware**: Request processing pipeline

### Naming Conventions

- **Files**: PascalCase for components (HomePage.jsx), camelCase for utilities (api.js)
- **Variables**: camelCase (userData, isLoading)
- **Constants**: UPPER_SNAKE_CASE (API_ENDPOINTS)
- **Components**: PascalCase (StudentDashboard)
- **Functions**: camelCase (getUserData)

## 📞 Support

### Contact Information
- **Email**: support@facultyreserve.edu
- **Phone**: +94 76 409 4163
- **Hours**: Mon-Fri, 8AM-6PM

### Help Resources
- In-app Help Center with FAQs
- Help request submission system
- Email support
- Admin assistance

## 📝 License

This project is developed for educational purposes.

## 👥 Contributors

Faculty Resource Reservation System Development Team

---

**Version**: 2.0.0  
**Last Updated**: October 2025  
**Status**: Active Development
