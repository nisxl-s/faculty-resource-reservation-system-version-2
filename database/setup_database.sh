#!/bin/bash

# ========================================
# Faculty Resource Reservation System
# Database Setup Script (Linux/Mac)
# ========================================

echo "========================================"
echo "Faculty Resource Reservation System"
echo "Database Setup Script"
echo "========================================"
echo ""

# Configuration
DB_NAME="faculty_reservation"
SCHEMA_FILE="schema.sql"
SEED_FILE="seeds/seed_data.sql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get MySQL credentials
echo -e "${YELLOW}Enter MySQL credentials:${NC}"
read -p "MySQL Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "MySQL Username (default: root): " DB_USER
DB_USER=${DB_USER:-root}

read -sp "MySQL Password: " DB_PASS
echo ""
echo ""

# Setup options
echo -e "${YELLOW}Setup Options:${NC}"
echo "1. Create database and schema only"
echo "2. Create database, schema, and load seed data (recommended for development)"
echo "3. Drop existing database and recreate (WARNING: This will delete all data!)"
read -p "Select option (1-3): " option
echo ""

# Function to execute MySQL command
execute_mysql() {
    local command=$1
    local database=$2
    
    if [ -n "$database" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -D"$database" -e "$command" 2>/dev/null
    else
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -e "$command" 2>/dev/null
    fi
    
    return $?
}

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local database=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File not found - $file${NC}"
        return 1
    fi
    
    echo -e "${CYAN}Executing: $file${NC}"
    
    if [ -n "$database" ]; then
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" -D"$database" < "$file" 2>/dev/null
    else
        mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASS" < "$file" 2>/dev/null
    fi
    
    return $?
}

# Test MySQL connection
echo -e "${YELLOW}Testing MySQL connection...${NC}"
if execute_mysql "SELECT 1;" ""; then
    echo -e "${GREEN}✓ MySQL connection successful${NC}"
    echo ""
else
    echo -e "${RED}Error: Cannot connect to MySQL. Please check your credentials.${NC}"
    exit 1
fi

# Handle different options
case $option in
    3)
        echo -e "${RED}WARNING: This will delete all existing data!${NC}"
        read -p "Type 'YES' to confirm: " confirm
        if [ "$confirm" != "YES" ]; then
            echo -e "${YELLOW}Operation cancelled.${NC}"
            exit 0
        fi
        
        echo -e "${YELLOW}Dropping existing database...${NC}"
        execute_mysql "DROP DATABASE IF EXISTS $DB_NAME;"
        echo -e "${GREEN}✓ Database dropped${NC}"
        ;;
esac

# Create database
echo -e "${YELLOW}Creating database: $DB_NAME${NC}"
if execute_mysql "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"; then
    echo -e "${GREEN}✓ Database created successfully${NC}"
else
    echo -e "${RED}Error: Failed to create database${NC}"
    exit 1
fi

echo ""

# Load schema
echo -e "${YELLOW}Loading database schema...${NC}"
if execute_sql_file "$SCHEMA_FILE" "$DB_NAME"; then
    echo -e "${GREEN}✓ Schema loaded successfully${NC}"
else
    echo -e "${RED}Error: Failed to load schema${NC}"
    exit 1
fi

echo ""

# Load seed data if option 2 or 3
if [ "$option" == "2" ] || [ "$option" == "3" ]; then
    echo -e "${YELLOW}Loading seed data...${NC}"
    if execute_sql_file "$SEED_FILE" "$DB_NAME"; then
        echo -e "${GREEN}✓ Seed data loaded successfully${NC}"
    else
        echo -e "${YELLOW}Warning: Failed to load seed data (non-critical)${NC}"
    fi
    echo ""
fi

# Verify setup
echo -e "${YELLOW}Verifying database setup...${NC}"
if execute_mysql "SHOW TABLES;" "$DB_NAME" > /dev/null; then
    echo -e "${GREEN}✓ Database verification successful${NC}"
fi

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}Database setup completed successfully!${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Database Details:${NC}"
echo "  Host: $DB_HOST"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your server/.env file with these database credentials"
echo "2. Navigate to server directory: cd ../server"
echo "3. Install dependencies: npm install"
echo "4. Start the server: npm run dev"
echo ""

if [ "$option" == "2" ] || [ "$option" == "3" ]; then
    echo -e "${YELLOW}Test Credentials (from seed data):${NC}"
    echo "  Admin: admin@university.edu / password123"
    echo "  Faculty: john.smith@university.edu / password123"
    echo "  Student: alice.williams@student.edu / password123"
    echo ""
fi
