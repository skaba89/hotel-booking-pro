#!/bin/bash
set -e

echo "Starting Hotel Booking Pro in development mode..."
echo ""

# Ensure database is running
docker compose up -d postgres redis 2>/dev/null || true

# Wait for database
echo "Waiting for database..."
sleep 2

# Start both apps
echo "Starting API and Web..."
npm run dev
