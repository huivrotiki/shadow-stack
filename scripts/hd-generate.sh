#!/bin/bash
# hd-generate.sh — Generate HD reports

TYPE=${1:-"hd"}
SESSION_TIME=$(date '+%Y-%m-%d-%H-%M')
OUTPUT_DIR="autosaves-and-commits/sessions"
mkdir -p "$OUTPUT_DIR"

case $TYPE in
  "hd")
    # Краткий отчет
    FILE="$OUTPUT_DIR/${SESSION_TIME}.md"
    echo "# Session ${SESSION_TIME}" > "$FILE"
    echo -e "\n## Quick Summary\n$(git log -1 --oneline)\n" >> "$FILE"
    ;;
  "hd+")
    # Детальный отчет
    FILE="$OUTPUT_DIR/${SESSION_TIME}-full.md"
    echo "# Session ${SESSION_TIME} — Full Analysis" > "$FILE"
    # Добавить статистику
    git log -5 --oneline >> "$FILE"
    ;;
esac
