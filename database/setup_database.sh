#!/bin/bash

# Script tự động setup database cho E-Commerce Project
# Chạy: bash database/setup_database.sh

echo "🚀 Bắt đầu setup database..."

# Kiểm tra MySQL đã cài đặt chưa
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL chưa được cài đặt!"
    echo "Vui lòng cài đặt MySQL 8.0+ trước"
    exit 1
fi

echo "✅ MySQL đã được cài đặt"

# Nhập password root
read -sp "Nhập MySQL root password: " ROOT_PASSWORD
echo ""

# Tạo database và user
mysql -u root -p"$ROOT_PASSWORD" < database/create_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database đã được tạo thành công!"
    echo ""
    echo "📋 Thông tin kết nối:"
    echo "   Database: ecommerce"
    echo "   User: ecommerce_user"
    echo "   Password: ecommerce_pass"
    echo "   Host: localhost"
    echo "   Port: 3306"
    echo ""
    echo "🔗 Connection String:"
    echo "   mysql://ecommerce_user:ecommerce_pass@localhost:3306/ecommerce"
else
    echo "❌ Có lỗi xảy ra khi tạo database"
    exit 1
fi

