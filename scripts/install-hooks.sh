#!/usr/bin/env bash
# install-hooks.sh — idempotent git hook installer for portable state layer
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" <<'HOOK_EOF'
#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.sh
# Validates .state/ and docs/SERVICES.md on commits that touch them.
set -e
ROOT="$(git rev-parse --show-toplevel)"

# Only run validator if staged changes touch .state/ or docs/SERVICES.md
if git diff --cached --name-only | grep -qE '^\.state/|^docs/SERVICES\.md$'; then
  if ! bash "$ROOT/scripts/validate-state.sh"; then
    echo ""
    echo "Pre-commit blocked. Fix with: bash scripts/bootstrap-state.sh"
    exit 1
  fi
fi
HOOK_EOF

chmod +x "$HOOK"
echo "✅ pre-commit hook installed at $HOOK"
