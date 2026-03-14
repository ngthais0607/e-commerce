@echo off
REM Automated database setup for E-Commerce (Windows)
REM Run from repo root: database\setup_database.bat
REM Requires: MySQL 8+ in PATH

echo ============================================
echo E-Commerce Database Setup
echo ============================================
echo.

where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL not found in PATH. Install MySQL 8+ and add to PATH.
    pause
    exit /b 1
)
echo [OK] MySQL found
echo.

set /p ROOT_PASSWORD=Enter MySQL root password: 

echo.
echo [1/4] Creating database and base tables...
mysql -u root -p%ROOT_PASSWORD% < database\ecommerce_full_schema.sql
if %ERRORLEVEL% NEQ 0 ( echo [ERROR] ecommerce_full_schema.sql failed & pause & exit /b 1 )

echo [2/4] Applying optimizations and extra indexes...
mysql -u root -p%ROOT_PASSWORD% ecommerce < database\ecommerce_schema_optimizations.sql
if %ERRORLEVEL% NEQ 0 ( echo [WARN] optimizations failed - ignore if FK/index already exist )
mysql -u root -p%ROOT_PASSWORD% ecommerce < database\add_indexes_pagination.sql
if %ERRORLEVEL% NEQ 0 ( echo [WARN] add_indexes_pagination failed - ignore if index exists )
mysql -u root -p%ROOT_PASSWORD% ecommerce < database\add_support_fk_cascade.sql
if %ERRORLEVEL% NEQ 0 ( echo [WARN] add_support_fk_cascade failed - ignore if FK already exist )

echo [3/4] Done. Optional: seed admin and test users.
echo   cd apps\api
echo   npm run seed:admin
echo   npm run seed:test-users
echo.
echo [4/4] Optional: sample data
echo   mysql -u root -p ecommerce ^< database\insert-products-with-images.sql
echo   mysql -u root -p ecommerce ^< database\create-admin.sql
echo.
echo ============================================
echo [SUCCESS] Database setup completed.
echo ============================================
echo Use in apps/api/.env (root user):
echo   DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/ecommerce
echo.
pause
