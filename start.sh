#!/bin/bash

# Navigate to script directory
cd "$(dirname "$0")"

# Install deps if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies for the first time..."
  npm install
fi

# Open browser after short delay (gives server time to start)
(sleep 3 && open http://localhost:3000) &

# Start the server
npm run dev
