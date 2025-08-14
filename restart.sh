#!/bin/bash

# PharmaTraK Development Server Restart Script
# This script stops and restarts both frontend and backend servers

echo "🔄 Restarting PharmaTraK Development Servers..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📡 Stopping existing servers...${NC}"

# Kill processes on ports 3000 and 3001
echo -e "${BLUE}🔍 Checking for processes on port 3000 (frontend)...${NC}"
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚡ Killing frontend process on port 3000...${NC}"
    kill $(lsof -ti:3000) 2>/dev/null || true
    sleep 2
else
    echo -e "${GREEN}✅ No process found on port 3000${NC}"
fi

echo -e "${BLUE}🔍 Checking for processes on port 3001 (backend)...${NC}"
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚡ Killing backend process on port 3001...${NC}"
    kill $(lsof -ti:3001) 2>/dev/null || true
    sleep 2
else
    echo -e "${GREEN}✅ No process found on port 3001${NC}"
fi

# Additional cleanup - kill any node processes related to our project
echo -e "${BLUE}🧹 Cleaning up any remaining node processes...${NC}"
pkill -f "node server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
sleep 1

echo -e "${GREEN}🚀 Starting servers...${NC}"

# Start backend server
echo -e "${BLUE}🔧 Starting backend server (port 3001)...${NC}"
nohup node server.js > backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started with PID: $BACKEND_PID${NC}"

# Wait a moment for backend to initialize
sleep 3

# Start frontend server
echo -e "${BLUE}⚛️ Starting frontend server (port 3000)...${NC}"
cd frontend
nohup npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend started with PID: $FRONTEND_PID${NC}"

# Wait for servers to start
echo -e "${YELLOW}⏳ Waiting for servers to initialize...${NC}"
sleep 5

# Check if servers are running
echo -e "${BLUE}🔍 Verifying server status...${NC}"

# Check backend
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on http://localhost:3001${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
fi

# Check frontend (just check if port is open)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running on http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
fi

echo -e "${GREEN}🎉 Restart complete!${NC}"
echo -e "${BLUE}📋 Server Information:${NC}"
echo -e "   🔧 Backend:  http://localhost:3001 (PID: $BACKEND_PID)"
echo -e "   ⚛️ Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend log: backend.log"
echo -e "   Frontend log: frontend.log"
echo -e "${BLUE}💡 To stop servers: kill $BACKEND_PID $FRONTEND_PID${NC}"