#!/bin/bash
# Frontend development startup script

set -e

echo "🔧 Starting Frontend Development Server..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting frontend on http://localhost:5173"
echo "🔗 API requests will proxy to http://localhost:3001"
echo "📊 Press Ctrl+C to stop"
echo ""

npm run dev
