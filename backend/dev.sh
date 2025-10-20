#!/bin/bash
# Backend development startup script

set -e

echo "🔧 Starting Backend Development Server..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found, copying from .env.example..."
    cp .env.example .env
    echo "✏️  Please edit backend/.env and set your ENCRYPTION_KEY"
    echo "   You can generate one with: openssl rand -base64 32"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create data directory if it doesn't exist
mkdir -p data

echo "🚀 Starting backend on http://localhost:3001"
echo "📊 Press Ctrl+C to stop"
echo ""

npm run dev
