#!/usr/bin/env bash
# validate-docs-index.sh — проверяет соответствие DOCS.md и файловой системы
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

echo "🔍 Проверка DOCS.md..."

ERRORS=0

# Проверяем критические файлы
CRITICAL_FILES=(
  "AI.MD"
  "AGENTS.md"
  "CLAUDE.md"
  "DOCS.md"
  "DOCS_RULES.md"
  "CONTRIBUTING.md"
  "CHANGELOG.md"
  "LICENSE"
  ".agent/soul.md"
  ".agent/SESSION-START-RULES.md"
  ".github/CODEOWNERS"
)

echo "Проверка критических файлов..."
for file in "${CRITICAL_FILES[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (ОТСУТСТВУЕТ)"
    ((ERRORS++))
  fi
done

echo ""
echo "Проверка директорий..."
DIRS=(
  ".github/workflows"
  "notebooks/shadow-stack"
  "notebooks/agent-factory"
  ".agent/skills"
  ".agent/tasks"
  "workflows"
  "templates"
  "logs"
  "autosaves-and-commits"
  "memory"
  "server"
  "bot"
  "docs/00-overview"
  "docs/01-plans"
  "docs/02-projects"
  "docs/03-architecture"
  "docs/04-security"
  "docs/05-heads"
)

for dir in "${DIRS[@]}"; do
  if [[ -d "$dir" ]]; then
    count=$(find "$dir" -type f \( -name "*.md" -o -name "*.yml" -o -name "*.yaml" \) 2>/dev/null | wc -l | xargs)
    echo "  ✅ $dir ($count файлов)"
  else
    echo "  ⚠️  $dir (пусто или отсутствует)"
  fi
done

echo ""
echo "📊 Статистика:"
total_md=$(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null | wc -l | xargs)
echo "Всего .md файлов: $total_md"

if [ $ERRORS -eq 0 ]; then
  echo ""
  echo "✅ DOCS.md валидация пройдена!"
  exit 0
else
  echo ""
  echo "❌ Найдено критических ошибок: $ERRORS"
  exit 1
fi
