#!/usr/bin/env bash
# validate-state.sh — sanity check of .state/ and docs/SERVICES.md
# Exit 0 if valid, 1 otherwise. Prints errors to stderr.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

# Prefer project venv for pyyaml; fallback to system python3
PY=python3
if [ -x "$ROOT/.venv/bin/python3" ]; then
  PY="$ROOT/.venv/bin/python3"
fi

ERRORS=0
err() { echo "❌ $1" >&2; ERRORS=$((ERRORS+1)); }

# 1. .state/current.yaml must exist
if [ ! -f .state/current.yaml ]; then
  err ".state/current.yaml missing"
else
  # 2. must parse as YAML
  if ! $PY -c "import yaml; yaml.safe_load(open('.state/current.yaml'))" 2>/dev/null; then
    err ".state/current.yaml is not valid YAML"
  else
    # 3. must contain required top-level keys
    for key in version project plan session git; do
      if ! $PY -c "
import yaml
d = yaml.safe_load(open('.state/current.yaml'))
import sys
sys.exit(0 if isinstance(d, dict) and '$key' in d else 1)
" 2>/dev/null; then
        err ".state/current.yaml missing required key: $key"
      fi
    done
  fi
fi

# 4. .state/session.md must exist
if [ ! -f .state/session.md ]; then
  err ".state/session.md missing"
fi

# 5. If docs/SERVICES.md exists, its YAML frontmatter must parse
if [ -f docs/SERVICES.md ]; then
  if ! $PY -c "
import sys, yaml
content = open('docs/SERVICES.md').read()
if not content.startswith('---'):
    sys.exit(2)
end = content.find('\n---', 3)
if end < 0:
    sys.exit(3)
yaml.safe_load(content[4:end])
" 2>/dev/null; then
    err "docs/SERVICES.md YAML frontmatter invalid or missing"
  fi
fi

# 6. If plan.file is set in current.yaml, that file must exist
if [ -f .state/current.yaml ]; then
  PLAN_FILE=$($PY -c "
import yaml
try:
  d = yaml.safe_load(open('.state/current.yaml'))
  print(d.get('plan', {}).get('file', ''))
except Exception:
  pass
" 2>/dev/null || echo "")
  if [ -n "$PLAN_FILE" ] && [ ! -f "$PLAN_FILE" ]; then
    err "plan.file points to missing: $PLAN_FILE"
  fi
fi

if [ $ERRORS -gt 0 ]; then
  echo "" >&2
  echo "state validation failed with $ERRORS errors" >&2
  exit 1
fi

echo "✅ .state/ valid"
exit 0
