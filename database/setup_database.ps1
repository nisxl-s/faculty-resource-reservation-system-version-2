# Faculty Resource Reservation System - Database Setup Script
# This script automates the database setup process

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Faculty Resource Reservation System" -ForegroundColor Cyan
Write-Host "Database Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_NAME = "faculty_reservation"
$SCHEMA_FILE = "schema.sql"
$SEED_FILE = "seeds/seed_data.sql"

# Get MySQL credentials
Write-Host "Enter MySQL credentials:" -ForegroundColor Yellow
$DB_HOST = Read-Host "MySQL Host (default: localhost)"
if ([string]::IsNullOrWhiteSpace($DB_HOST)) { $DB_HOST = "localhost" }

$DB_USER = Read-Host "MySQL Username (default: root)"
if ([string]::IsNullOrWhiteSpace($DB_USER)) { $DB_USER = "root" }

$DB_PASS = Read-Host "MySQL Password" -AsSecureString
$DB_PASS_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASS)
)

Write-Host ""
Write-Host "Setup Options:" -ForegroundColor Yellow
Write-Host "1. Create database and schema only"
Write-Host "2. Create database, schema, and load seed data (recommended for development)"
Write-Host "3. Drop existing database and recreate (WARNING: This will delete all data!)"
$option = Read-Host "Select option (1-3)"

Write-Host ""

# Function to execute MySQL command
function Execute-MySQL {
    param(
        [string]$Command,
        [string]$Database = ""
    )
    
    if ($Database) {
        $dbParam = "-D $Database"
    } else {
        $dbParam = ""
    }
    
    $process = Start-Process -FilePath "mysql" `
        -ArgumentList "-h$DB_HOST -u$DB_USER -p$DB_PASS_TEXT $dbParam -e `"$Command`"" `
        -NoNewWindow -Wait -PassThru
    
    return $process.ExitCode
}

# Function to execute SQL file
function Execute-SQLFile {
    param(
        [string]$FilePath,
        [string]$Database = ""
    )
    
    if (!(Test-Path $FilePath)) {
        Write-Host "Error: File not found - $FilePath" -ForegroundColor Red
        return 1
    }
    
    if ($Database) {
        $dbParam = "-D $Database"
    } else {
        $dbParam = ""
    }
    
    Write-Host "Executing: $FilePath" -ForegroundColor Cyan
    $process = Start-Process -FilePath "mysql" `
        -ArgumentList "-h$DB_HOST -u$DB_USER -p$DB_PASS_TEXT $dbParam" `
        -RedirectStandardInput $FilePath `
        -NoNewWindow -Wait -PassThru
    
    return $process.ExitCode
}

try {
    # Check if MySQL is accessible
    Write-Host "Testing MySQL connection..." -ForegroundColor Yellow
    $exitCode = Execute-MySQL -Command "SELECT 1;"
    
    if ($exitCode -ne 0) {
        Write-Host "Error: Cannot connect to MySQL. Please check your credentials." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✓ MySQL connection successful" -ForegroundColor Green
    Write-Host ""
    
    # Handle different options
    switch ($option) {
        "3" {
            Write-Host "WARNING: This will delete all existing data!" -ForegroundColor Red
            $confirm = Read-Host "Type 'YES' to confirm"
            if ($confirm -ne "YES") {
                Write-Host "Operation cancelled." -ForegroundColor Yellow
                exit 0
            }
            
            Write-Host "Dropping existing database..." -ForegroundColor Yellow
            Execute-MySQL -Command "DROP DATABASE IF EXISTS $DB_NAME;"
            Write-Host "✓ Database dropped" -ForegroundColor Green
        }
    }
    
    # Create database
    Write-Host "Creating database: $DB_NAME" -ForegroundColor Yellow
    $exitCode = Execute-MySQL -Command "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if ($exitCode -eq 0) {
        Write-Host "✓ Database created successfully" -ForegroundColor Green
    } else {
        Write-Host "Error: Failed to create database" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    
    # Load schema
    Write-Host "Loading database schema..." -ForegroundColor Yellow
    $exitCode = Execute-SQLFile -FilePath $SCHEMA_FILE -Database $DB_NAME
    
    if ($exitCode -eq 0) {
        Write-Host "✓ Schema loaded successfully" -ForegroundColor Green
    } else {
        Write-Host "Error: Failed to load schema" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    
    # Load seed data if option 2 or 3
    if ($option -eq "2" -or $option -eq "3") {
        Write-Host "Loading seed data..." -ForegroundColor Yellow
        $exitCode = Execute-SQLFile -FilePath $SEED_FILE -Database $DB_NAME
        
        if ($exitCode -eq 0) {
            Write-Host "✓ Seed data loaded successfully" -ForegroundColor Green
        } else {
            Write-Host "Warning: Failed to load seed data (non-critical)" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    # Verify setup
    Write-Host "Verifying database setup..." -ForegroundColor Yellow
    $exitCode = Execute-MySQL -Command "USE $DB_NAME; SHOW TABLES;" -Database $DB_NAME
    
    if ($exitCode -eq 0) {
        Write-Host "✓ Database verification successful" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Database Details:" -ForegroundColor Yellow
    Write-Host "  Host: $DB_HOST"
    Write-Host "  Database: $DB_NAME"
    Write-Host "  User: $DB_USER"
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Update your server/.env file with these database credentials"
    Write-Host "2. Navigate to server directory: cd ../server"
    Write-Host "3. Install dependencies: npm install"
    Write-Host "4. Start the server: npm run dev"
    Write-Host ""
    
    if ($option -eq "2" -or $option -eq "3") {
        Write-Host "Test Credentials (from seed data):" -ForegroundColor Yellow
        Write-Host "  Admin: admin@university.edu / password123"
        Write-Host "  Faculty: john.smith@university.edu / password123"
        Write-Host "  Student: alice.williams@student.edu / password123"
        Write-Host ""
    }
    
} catch {
    Write-Host ""
    Write-Host "Error occurred: $_" -ForegroundColor Red
    exit 1
}
