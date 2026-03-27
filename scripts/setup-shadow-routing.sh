#!/bin/bash

echo "Setting up Shadow Routing..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

# Install Playwright if not already installed
if ! npx playwright --version &> /dev/null; then
    echo "Installing Playwright..."
    npm install playwright
fi

# Install Chromium browser for Playwright
echo "Installing Chromium browser..."
npx playwright install chromium

echo "Shadow Routing setup complete!"
echo ""
echo "To use:"
echo "1. Start Chrome with CDP: open -a \"Google Chrome\" --args --remote-debugging-port=9222"
echo "2. Start Shadow Router: node server/shadow-router.cjs &"
echo "3. Test: curl http://localhost:3002/health"