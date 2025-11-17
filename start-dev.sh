#!/bin/bash

# Financial Tracker - Development Start Script

set -e

echo "🚀 Starting Financial Tracker..."

# Check if backend is built
if [ ! -f "backend/bin/api" ]; then
    echo "📦 Building backend..."
    cd backend
    go build -o bin/api ./cmd/api
    cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Create .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "⚙️  Creating frontend .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > frontend/.env.local
fi

echo ""
echo "✅ Starting backend on http://localhost:8080..."
cd backend
PORT=8080 DB_PATH=./records.db ./bin/api &
BACKEND_PID=$!
cd ..

sleep 2

echo "✅ Starting frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Financial Tracker is running!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Frontend: http://localhost:3000"
echo "🔌 Backend:  http://localhost:8080"
echo "❤️  Health:  http://localhost:8080/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Trap Ctrl+C and kill both processes
trap "echo ''; echo '🛑 Shutting down...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

# Wait for both processes
wait
