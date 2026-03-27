# Shadow Stack OpenClaw - Runbook

## Start/Stop/Debug/Deploy Instructions

### Starting Services

#### 1. Start All Services (Development)
```bash
npm run start
```
This starts both Vite dev server and Electron application concurrently.

#### 2. Start Backend API Only
```bash
npm run api:dev
```
Starts the Express API with file watching for development.

#### 3. Start Dashboard Frontend Only
```bash
npm run dev
```
Starts the Vite development server for the dashboard.

#### 4. Start Electron Application Only
```bash
npm run electron
```
Starts the Electron application pointing to the dev server.

#### 5. Start in Headless Mode (CLI Only)
```bash
npm run headless
```
Runs the system without GUI, useful for server deployment or testing.

#### 6. Start Telegram Bot
```bash
npm run bot:dev
```
Starts the Telegram bot with file watching for development.

#### 7. Start Telegram Bot Production
```bash
npm run bot:start
```
Starts the Telegram bot in production mode.

### Stopping Services

#### Stop All Node Processes
```bash
pkill -f "node.*shadow-stack" || true
pkill -f "npm.*shadow-stack" || true
```

#### Stop Specific Services
```bash
# Stop API
pkill -f "node server/index.js" || true

# Stop Telegram Bot
pkill -f "bot/opencode-telegram-bridge.cjs" || true

# Stop Shadow Router
pkill -f "server/shadow-router.cjs" || true
```

### Debugging

#### View Logs
```bash
# See running Node processes
ps aux | grep node | grep -v grep

# Check specific service logs
tail -f /tmp/bot.log
tail -f /tmp/gdrive-sync.log
```

#### Check Service Health
```bash
# API Health
curl -s http://localhost:3001/health | jq .

# Bot Health
curl -s http://localhost:4000/health | jq .

# Shadow Router Health
curl -s http://localhost:3002/health | jq .

# OpenClaw Gateway Health
curl -s http://localhost:18789/health | jq .

# Dashboard Health
curl -s http://localhost:5176 | head -5
```

#### Check RAM Usage (via Shadow Router)
```bash
curl -s http://localhost:3002/ram | jq .
```

#### Test Shadow Router Functionality
```bash
# Test routing to Claude via browser automation
curl -s -X POST http://localhost:3002/route/claude/hello \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello, how are you?"}' | jq .
```

### Deploying

#### Build for Production
```bash
npm run build
```
Creates production-ready files in the `dist/` directory.

#### Create Installer (macOS)
```bash
npm run pack
```
Creates a distributable installer in the `release/` directory.

#### Full Build and Package
```bash
npm run dist
```
Creates packaged application for distribution.

#### Deploy Dashboard to Vercel
```bash
# Using Doppler for environment variables
doppler run --project serpent --config dev -- vercel deploy --prod --yes
```

### Google Drive Synchronization

#### Initial Setup
```bash
# 1. Authorize gdrive (opens browser for authentication)
gdrive about

# 2. Create folder for shadow stack
FOLDER_ID=$(gdrive mkdir "Shadow Stack" | awk '{print $2}')

# 3. Save folder ID to config
mkdir -p ~/.zeroclaw
echo "GDRIVE_FOLDER_ID=$FOLDER_ID" >> ~/.zeroclaw/.env

# 4. Test sync
./shadow-gdrive-sync.sh
```

#### Automated Sync (Cron)
Add to crontab (`crontab -e`):
```
0 * * * * cd /path/to/shadow-stack && ./shadow-gdrive-sync.sh >> /tmp/gdrive-sync.log 2>&1
```

### Environment Variables

Required environment variables (set in `.env` or via Doppler):
```
# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
TELEGRAM_GROUP_ID=your_telegram_group_id

# API Keys (for cascade routing)
OPENAI_API_KEY=your_openai_api_key
ALIBABA_API_KEY=your_alibaba_api_key
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Supabase (optional, for persistent logs)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Drive (for sync)
GDRIVE_FOLDER_ID=your_google_drive_folder_id

# Vercel (for deployment)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Doppler (for secrets management)
DOPPLER_TOKEN=your_doppler_token
```

### Smoke Tests

After starting services, run these checks:
```bash
# All should return 200 OK or valid JSON
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:18789/health
curl -s -o /dev/null -w "%{http_code}" http://localhost:5176

# Test Telegram bot endpoint
curl -s -X POST http://localhost:4000/ \
  -H "Content-Type: application/json" \
  -d '{"update_id":1,"message":{"chat":{"id":"'$TELEGRAM_CHAT_ID'"},"text":"/ping"}}' | jq .

# Test shadow router
curl -s http://localhost:3002/route/claude/test | jq .

# Test OpenClaw gateway
curl -s http://localhost:18789/health | jq .
```

### Troubleshooting

#### Common Issues

1. **"Address already in use" errors**
   ```bash
   # Kill processes on specific ports
   lsof -ti:3001 | xargs kill -9 2>/dev/null || true
   lsof -ti:4000 | xargs kill -9 2>/dev/null || true
   lsof -ti:3002 | xargs kill -9 2>/dev/null || true
   lsof -ti:18789 | xargs kill -9 2>/dev/null || true
   lsof -ti:5176 | xargs kill -9 2>/dev/null || true
   ```

2. **Chrome not available for Shadow Router**
   ```bash
   # Start Chrome with remote debugging
   open -a "Google Chrome" --args --remote-debugging-port=9222
   
   # Or install Chrome if missing
   brew install --cask google-chrome
   ```

3. **Node.js version issues**
   ```bash
   # Use Node.js 20.x or higher
   node --version
   # Should be v20.x.x or higher
   ```

4. **Permission issues**
   ```bash
   # Fix node_modules permissions
   sudo chown -R $USER:$USER node_modules
   
   # Fix script permissions
   chmod +x scripts/*.sh
   chmod +x bot/*.cjs
   chmod +x shadow-gdrive-sync.sh
   ```

### Maintenance

#### Update Dependencies
```bash
npm update
npm audit fix
```

#### Update Playwright Browsers
```bash
npx playwright install --with-deps
```

#### Reset Application State
```bash
# Clear Electron app data
rm -rf ~/Library/Application\ Support/shadow-stack-widget

# Clear Vite cache
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force
```

### Security Notes

1. Never commit `.env` files to git
2. Use Doppler or similar secrets management for production
3. Restrict Telegram bot to authorized chat IDs only
4. Keep API keys secure and rotate regularly
5. Review shadow-router.cjs for security if exposing to public networks

### Version Information

- Current Version: 3.2.0
- Last Updated: 2026-03-27
- Built with: Node.js, Electron, React, Vite, TypeScript
