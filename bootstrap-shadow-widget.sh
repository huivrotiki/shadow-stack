#!/bin/bash
set -euo pipefail

WORKSPACE="$HOME/shadow-stack-widget"
NODE_VERSION="22"

echo "=============================================="
echo "  Shadow Stack Widget Bootstrapper v3.2"
echo "=============================================="
echo ""

ensure_brew() {
  if ! command -v brew &>/dev/null; then
    echo "❌ Homebrew не найден."
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
  fi
}

ensure_node() {
  echo "[0/6] Checking Node.js..."
  if ! command -v node &>/dev/null; then
    echo "  Устанавливаю node@${NODE_VERSION}..."
    brew install "node@${NODE_VERSION}"
  else
    echo "  node: $(node -v)"
  fi
}

ensure_jq() {
  if ! command -v jq &>/dev/null; then
    echo "  jq не найден. Устанавливаю..."
    brew install jq
  else
    echo "  jq: $(jq --version)"
  fi
}

install_git() {
  echo "[1/6] Checking git..."
  if ! command -v git &>/dev/null; then
    brew install git
  else
    echo "  git: $(git --version)"
  fi
}

setup_vite_project() {
  echo "[2/6] Setting up Vite + React..."
  mkdir -p "$WORKSPACE"
  cd "$WORKSPACE"

  if [[ -f "package.json" ]]; then
    echo "  package.json exists. Skipping Vite init."
  else
    npm create vite@latest . -- --template react
  fi
}

install_dependencies() {
  echo "[3/6] Installing dependencies..."
  cd "$WORKSPACE"

  npm install
  npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer
  npm install lucide-react
  npm install -D electron concurrently cross-env wait-on
  npm install -D @eslint/js eslint
}

write_config_files() {
  echo "[4/6] Writing config files..."
  cd "$WORKSPACE"
  mkdir -p src

  cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
})
EOF

  cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(30, 41, 59, 0.8)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      backdropBlur: {
        glass: '12px',
      },
    },
  },
  plugins: [],
}
EOF

  cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF

  cat > src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif;
}

body {
  margin: 0;
  padding: 0;
  background: transparent;
  overflow: hidden;
}
EOF

  echo "  Config files written ✅"
}

patch_package_json() {
  echo "[5/6] Patching package.json..."
  cd "$WORKSPACE"

  tmp="$(mktemp)"
  jq '
    .main = "main.cjs"
    | .scripts.dev = "vite"
    | .scripts.build = "vite build"
    | .scripts.electron = "wait-on --timeout 30000 http://127.0.0.1:5175 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5175 node_modules/.bin/electron ."
    | .scripts.start = "concurrently --names \"vite,electron\" --prefix-colors \"cyan,yellow\" \"npm run dev\" \"npm run electron\""
    | .scripts["kill-port"] = "lsof -ti:5175 | xargs kill -9 2>/dev/null || true"
  ' package.json > "$tmp" && mv "$tmp" package.json

  echo "  package.json patched ✅"
}

check_result() {
  echo "[6/6] Verifying setup..."
  cd "$WORKSPACE"

  local ok=true

  check() {
    if [[ -e "$1" ]]; then
      echo "  ✅ $1"
    else
      echo "  ❌ $1 NOT found"
      ok=false
    fi
  }

  check "package.json"
  check "vite.config.js"
  check "tailwind.config.js"
  check "postcss.config.js"
  check "src/index.css"
  check "node_modules"

  if grep -q '"main.cjs"' package.json 2>/dev/null; then
    echo "  ✅ main: main.cjs"
  else
    echo "  ❌ main field incorrect"
    ok=false
  fi

  if grep -q '"start"' package.json 2>/dev/null; then
    echo "  ✅ scripts.start"
  else
    echo "  ❌ scripts.start missing"
    ok=false
  fi

  $ok && echo "" && echo "  All checks passed ✅" || echo "" && echo "  ⚠️  Some checks failed"
}

main() {
  ensure_brew
  ensure_node
  ensure_jq
  install_git
  setup_vite_project
  install_dependencies
  write_config_files
  patch_package_json
  check_result

  echo ""
  echo "=============================================="
  echo "  ✅ Bootstrap Complete!"
  echo "=============================================="
  echo ""
  echo "Next steps:"
  echo "  1. cd \"$WORKSPACE\""
  echo "  2. Скопируй main.cjs, preload.cjs, src/App.jsx"
  echo "  3. npm run start"
  echo ""
  echo "  Если порт 5175 занят:"
  echo "  npm run kill-port && npm run start"
  echo ""
}

main "$@"
