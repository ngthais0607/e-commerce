@echo off
REM Script tự động setup database cho E-Commerce Project (Windows)
REM Chạy: database\setup_database.bat

echo ============================================
echo Setup Database cho E-Commerce Project
echo ============================================
echo.

REM Kiểm tra MySQL đã cài đặt chưa
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] MySQL chưa được cài đặt hoặc chưa có trong PATH!
    echo Vui lòng cài đặt MySQL 8.0+ và thêm vào PATH
    pause
    exit /b 1
)

echo [OK] MySQL đã được cài đặt
echo.

REM Nhập password root
set /p ROOT_PASSWORD="Nhập MySQL root password: "

REM Tạo database và user
mysql -u root -p%ROOT_PASSWORD% < database\create_database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo [SUCCESS] Database đã được tạo thành công!
    echo ============================================
    echo.
    echo Thong tin ket noi:
    echo   Database: ecommerce
    echo   User: ecommerce_user
    echo   Password: ecommerce_pass
    echo   Host: localhost
    echo   Port: 3306
    echo.
    echo Connection String:
    echo   mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce
    echo.
) else (
    echo.
    echo [ERROR] Co loi xay ra khi tao database
    echo Kiem tra lai password root hoac quyen truy cap
    echo.
)

pause

