#!/bin/bash

echo "🚀 Starting Deployment Process..."

# 1. Install dependencies
echo "📦 Installing root dependencies..."
npm install

echo "📦 Installing server dependencies..."
cd server && npm install && cd ..

# 2. Build Frontend
echo "🏗️ Building Frontend..."
npm run build

# 3. Build Backend
echo "🏗️ Building Backend..."
cd server && npm run build && cd ..

# 4. Restart PM2
echo "🔄 Restarting PM2 process..."
if pm2 list | grep -q "masuma-parts"; then
    pm2 restart ecosystem.config.cjs
else
    pm2 start ecosystem.config.cjs
fi

echo "✅ Deployment Complete!"
