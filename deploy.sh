#!/bin/bash
# tblsp Deployment Script
# Run this to build and start tblsp for production use

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== tblsp Production Deployment ==="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo ""

# Install dependencies if needed
echo "=== Installing dependencies ==="
(cd frontend && npm install)
(cd backend && npm install)
echo ""

# Build frontend
echo "=== Building frontend ==="
(cd frontend && npm run build)
echo ""

# Build backend (clean first to avoid stale files)
echo "=== Building backend ==="
(cd backend && rm -rf dist && npm run build)
echo ""

# Setup production environment
if [ ! -f backend/.env ]; then
    echo "=== Setting up production environment ==="
    cp backend/.env.production backend/.env
    echo "Created backend/.env from .env.production"
    echo ""
fi

# Initialize database if needed
echo "=== Initializing database ==="
(cd backend && npm run db:init)
echo ""

# Get the server's IP address for display
IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "your-server-ip")

echo "=== Deployment Complete ==="
echo ""
echo "To start the server, run:"
echo "  cd backend && npm start"
echo ""
echo "Or for background operation:"
echo "  cd backend && nohup npm start > ../tblsp.log 2>&1 &"
echo ""
echo "To add sample recipes (optional):"
echo "  cd backend && npm run db:seed"
echo ""
echo "Access tblsp from any device at:"
echo "  http://${IP_ADDR}:3001"
echo ""
