#!/bin/bash
set -e

echo "============================================"
echo "  Hotel Booking Pro - Setup"
echo "============================================"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install from https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required. Install from https://docker.com"; exit 1; }

echo "1. Installing dependencies..."
npm install

echo ""
echo "2. Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "   .env file created from .env.example"
  echo "   Please edit .env with your configuration"
else
  echo "   .env file already exists"
fi

echo ""
echo "3. Starting database..."
docker compose up -d postgres redis
echo "   Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "4. Running database migrations..."
npx prisma migrate dev --name init || true

echo ""
echo "5. Generating Prisma client..."
npx prisma generate || echo "   Warning: prisma generate failed (file may be locked by a running process). Stop the API and retry: npx prisma generate"

echo ""
echo "6. Seeding database..."
npx prisma db seed || echo "   Warning: Seeding may have already been done during migration."

echo ""
echo "============================================"
echo "  Setup complete!"
echo "============================================"
echo ""
echo "  Admin credentials:"
echo "    Email: admin@setifana.com"
echo "    Password: Admin@2024!"
echo ""
echo "  To start development:"
echo "    npm run dev"
echo ""
echo "  Frontend: http://localhost:3001"
echo "  Backend:  http://localhost:4001"
echo "  Admin:    http://localhost:3001/admin/login"
echo ""
