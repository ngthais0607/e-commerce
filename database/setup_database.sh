#!/bin/bash

# Automated database setup script for E-Commerce Project
# Run: bash database/setup_database.sh

echo "🚀 Starting database setup..."

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed!"
    echo "Please install MySQL 8.0+ first"
    exit 1
fi

echo "✅ MySQL is installed"

# Get root password
read -sp "Enter MySQL root password: " ROOT_PASSWORD
echo ""

# Create database and user
echo "Creating database and user..."
mysql -u root -p"$ROOT_PASSWORD" < database/create_database.sql

if [ $? -eq 0 ]; then
    echo "Creating tables..."
    mysql -u root -p"$ROOT_PASSWORD" ecommerce < database/ecommerce_tables_v2.sql
    echo "Applying support conversations schema..."
    mysql -u root -p"$ROOT_PASSWORD" ecommerce < database/add-support-conversations.sql
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Database setup completed successfully!"
        echo ""
        echo "📋 Connection Information:"
        echo "   Database: ecommerce"
        echo "   User: ecommerce_user"
        echo "   Password: ecommerce_pass"
        echo "   Host: localhost"
        echo "   Port: 3306"
        echo ""
        echo "🔗 Connection String for .env:"
        echo "   DATABASE_URL=mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce"
    else
        echo "❌ Failed to create tables"
        echo "Database created but tables failed"
        exit 1
    fi
else
    echo "❌ Failed to create database"
    echo "Please check root password or permissions"
    exit 1
fi

