@echo off
REM Automated database setup script for E-Commerce Project (Windows)
REM Run: database\setup_database.bat

echo ============================================
echo E-Commerce Database Setup
echo ============================================
echo.

REM Check if MySQL is installed
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL is not installed or not in PATH!
    echo Please install MySQL 8.0+ and add it to PATH
    pause
    exit /b 1
)

echo [OK] MySQL is installed
echo.

REM Get root password
set /p ROOT_PASSWORD="Enter MySQL root password: "

echo.
echo Creating database and user...
mysql -u root -p%ROOT_PASSWORD% < database\create_database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Creating tables...
    mysql -u root -p%ROOT_PASSWORD% ecommerce < database\ecommerce_tables_v2.sql
    echo Applying support conversations schema...
    mysql -u root -p%ROOT_PASSWORD% ecommerce < database\add-support-conversations.sql
    
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ============================================
        echo [SUCCESS] Database setup completed!
        echo ============================================
        echo.
        echo Connection Information:
        echo   Database: ecommerce
        echo   User: ecommerce_user
        echo   Password: ecommerce_pass
        echo   Host: localhost
        echo   Port: 3306
        echo.
        echo Connection String for .env:
        echo   DATABASE_URL=mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce
        echo.
    ) else (
        echo.
        echo [ERROR] Failed to create tables
        echo Database created but tables failed
        echo.
    )
) else (
    echo.
    echo [ERROR] Failed to create database
    echo Please check root password or permissions
    echo.
)

pause

