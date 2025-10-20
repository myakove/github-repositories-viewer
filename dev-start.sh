#!/bin/bash
# Start both backend and frontend for local development

set -e

echo "🚀 GitHub Repositories Viewer - Local Development"
echo "=================================================="
echo ""

# Function to check if server is ready
check_server() {
  local url=$1
  local name=$2
  local max_attempts=30
  local attempt=1

  echo -n "⏳ Waiting for $name to be ready..."

  while [ $attempt -le $max_attempts ]; do
    if curl -s "$url" > /dev/null 2>&1; then
      echo " ✅"
      return 0
    fi
    echo -n "."
    sleep 1
    attempt=$((attempt + 1))
  done

  echo " ❌"
  return 1
}

# Start backend in background
echo "📦 Starting backend on http://localhost:3002..."
cd backend
npm run dev > /tmp/backend-dev.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
if ! check_server "http://localhost:3002" "backend"; then
  echo ""
  echo "❌ Backend failed to start. Check logs:"
  echo "   tail -f /tmp/backend-dev.log"
  kill $BACKEND_PID 2>/dev/null || true
  exit 1
fi

# Start frontend in background
echo "🌐 Starting frontend on http://localhost:5173..."
cd frontend
npm run dev > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
if ! check_server "http://localhost:5173" "frontend"; then
  echo ""
  echo "❌ Frontend failed to start. Check logs:"
  echo "   tail -f /tmp/frontend-dev.log"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 1
fi

echo ""
echo "✅ Both services are running and healthy!"
echo ""
echo "📊 Backend:  http://localhost:3002 (PID: $BACKEND_PID)"
echo "🎨 Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f /tmp/backend-dev.log"
echo "   Frontend: tail -f /tmp/frontend-dev.log"
echo ""
echo "🛑 To stop services:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
