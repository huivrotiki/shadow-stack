#!/bin/bash
# Shadow Stack → Google Drive sync
# Usage: ./shadow-gdrive-sync.sh
# Cron: 0 * * * * cd ~/shadow-stack_local_1 && ./shadow-gdrive-sync.sh >> /tmp/gdrive-sync.log 2>&1

cd "$(dirname "$0")"

FOLDER_ID_FILE="$HOME/.zeroclaw/.env"
if [ -f "$FOLDER_ID_FILE" ]; then
  FOLDER_ID="$(grep GDRIVE_FOLDER_ID "$FOLDER_ID_FILE" 2>/dev/null | cut -d= -f2)"
fi

if [ -z "$FOLDER_ID" ]; then
  echo "⚠️  GDRIVE_FOLDER_ID not set. Run: gdrive about && FOLDER_ID=\$(gdrive mkdir 'Shadow Stack' | awk '{print \$2}')"
  exit 1
fi

FILES=(
  "shadow-stack-phases.md"
  "todo.md"
  "SKILL.md"
  "CLAUDE.md"
  "RUNBOOK.md"
  ".agent/knowledge/shadow-stack-kb.md"
)

echo "☁️  Sync to Google Drive — $(date)"

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    FILE_ID=$(gdrive files list --query "name='$(basename "$file")' and '$FOLDER_ID' in parents" --no-header 2>/dev/null | awk '{print $1}' | head -1)

    if [ -n "$FILE_ID" ]; then
      gdrive files update "$FILE_ID" "$file" >/dev/null 2>&1 && echo "  ✅ Updated: $file" || echo "  ❌ Failed: $file"
    else
      gdrive files upload --parent "$FOLDER_ID" "$file" >/dev/null 2>&1 && echo "  ✅ Uploaded: $file" || echo "  ❌ Failed: $file"
    fi
  else
    echo "  ⏭️  Skipped (not found): $file"
  fi
done

echo "✅ Done: $(date)"
