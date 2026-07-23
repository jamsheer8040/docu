#!/bin/bash
# Exit on any error
set -e

echo "Starting Deployment for Docu..."

# 1. Directory Setup & Git Pull
TARGET_DIR="/var/www/docu"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Cloning repository..."
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone https://github.com/jamsheer8040/docu.git docu
    sudo chown -R $USER:$USER /var/www/docu
    cd docu
else
    echo "Repository exists. Pulling latest changes..."
    cd $TARGET_DIR
    git pull origin main
fi

# 2. Database Setup (MySQL)
echo "Setting up MySQL Database (Enter your MySQL root password if prompted)..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS docclear_prod;"
# Note: Update the password 'docclear_secure_pass' in the command below and in your backend/.env
sudo mysql -e "CREATE USER IF NOT EXISTS 'docclear_admin'@'localhost' IDENTIFIED BY 'docclear_secure_pass';"
sudo mysql -e "GRANT ALL PRIVILEGES ON docclear_prod.* TO 'docclear_admin'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 3. Backend Setup
echo "Setting up Backend..."
cd $TARGET_DIR/backend
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.production.example .env
    echo "Please edit the $TARGET_DIR/backend/.env file to set DB_PASS='docclear_secure_pass' and change JWT_SECRET before proceeding!"
    # Auto-generate a random JWT secret
    sed -i "s/CHANGE_ME_TO_A_SECURE_RANDOM_STRING/$(openssl rand -hex 32)/g" .env
fi

# Ensure uploads directory exists
mkdir -p uploads/branding uploads/documents

# Run Database Migrations
echo "Running Database Migrations..."
npm run migrate

# Optionally, to seed default data (only on first deployment):
# echo "Running Database Seeders..."
# npm run seed

# Start backend with PM2
echo "Starting Backend with PM2..."
pm2 start app.js --name "docu-backend"
pm2 save
pm2 startup

# 4. Frontend Setup
echo "Setting up Frontend..."
cd $TARGET_DIR/frontend
npm install
# Ensure it points to the correct API base
export NUXT_PUBLIC_API_BASE="/api/v1"
npm run generate

echo "Deployment scripts completed successfully!"
echo "Next step: Configure Nginx using docu_nginx.conf"
