#!/usr/bin/env bash
set -euo pipefail

CACHE_DIR="${HOME}/.cache/zeroclaw-skills"
INDEX_FILE=".state/skills-index.json"
LOG_FILE=".state/github-skills-sync.log"
MAX_PARALLEL=3
UPDATE_THRESHOLD_HOURS=24

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
  echo "[$(date +'%H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

mkdir -p "$CACHE_DIR"

REPOS=(
  "https://github.com/awesome-opencode/awesome-opencode"
  "https://github.com/agent0ai/agent-zero"
  "https://github.com/VoltAgent/awesome-openclaw-skills"
  "https://github.com/hesreallyhim/awesome-claude-code"
  "https://github.com/huivrotiki/the-book-of-secret-knowledge"
  "https://github.com/huivrotiki/.github"
  "https://github.com/huivrotiki/build-your-own-x"
  "https://github.com/huivrotiki/awesome"
  "https://github.com/huivrotiki/awesome-selfhosted"
  "https://github.com/huivrotiki/awesome-python"
  "https://github.com/huivrotiki/browser-use"
  "https://github.com/huivrotiki/open-ralph-wiggum"
)

sync_repo() {
  local url="$1"
  local repo_name=$(basename "$url" .git)
  local repo_path="$CACHE_DIR/$repo_name"
  
  if [ -d "$repo_path/.git" ]; then
    local last_update=$(stat -f %m "$repo_path/.git/FETCH_HEAD" 2>/dev/null || echo 0)
    local now=$(date +%s)
    local age_hours=$(( (now - last_update) / 3600 ))
    
    if [ "$age_hours" -gt "$UPDATE_THRESHOLD_HOURS" ]; then
      log "${YELLOW}Updating${NC} $repo_name (age: ${age_hours}h)"
      cd "$repo_path"
      timeout 30s git pull --quiet || log "${RED}Failed to update${NC} $repo_name"
    else
      log "${GREEN}Cached${NC} $repo_name (age: ${age_hours}h)"
    fi
  else
    log "${YELLOW}Cloning${NC} $repo_name"
    timeout 60s git clone --depth 1 --quiet "$url" "$repo_path" || {
      log "${RED}Failed to clone${NC} $repo_name"
      return 1
    }
  fi
}

log "Starting GitHub skills sync (${#REPOS[@]} repos)"

export -f sync_repo log
export CACHE_DIR UPDATE_THRESHOLD_HOURS RED GREEN YELLOW NC LOG_FILE

printf '%s\n' "${REPOS[@]}" | xargs -P "$MAX_PARALLEL" -I {} bash -c 'sync_repo "{}"'

log "${GREEN}Sync complete${NC}"
log "Building skills index..."
node scripts/build-skills-index.cjs
log "${GREEN}Done${NC}"
