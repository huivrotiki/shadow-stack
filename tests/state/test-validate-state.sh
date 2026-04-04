#!/usr/bin/env bash
# Test harness for scripts/validate-state.sh
# Runs a sequence of cases and reports pass/fail counts.
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel)"
VALIDATOR="$ROOT/scripts/validate-state.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PASS=0
FAIL=0

assert() {
  local name="$1"
  local expected_exit="$2"
  local actual_exit="$3"
  if [ "$expected_exit" = "$actual_exit" ]; then
    echo "  ✅ $name"
    PASS=$((PASS+1))
  else
    echo "  ❌ $name (expected exit=$expected_exit, got $actual_exit)"
    FAIL=$((FAIL+1))
  fi
}

# Case 1: happy path (real project state)
cd "$ROOT"
bash "$VALIDATOR" >/dev/null 2>&1
assert "happy_path: real state validates" 0 $?

# Case 2: missing current.yaml
cd "$TMP"
git init -q .
mkdir -p .state
bash "$VALIDATOR" >/dev/null 2>&1
assert "missing_current_yaml: fails" 1 $?

# Case 3: invalid YAML in current.yaml
echo "this is: not: valid: yaml:" > "$TMP/.state/current.yaml"
touch "$TMP/.state/session.md"
bash "$VALIDATOR" >/dev/null 2>&1
assert "invalid_yaml: fails" 1 $?

# Case 4: missing required key (no 'git' section)
cat > "$TMP/.state/current.yaml" <<'EOF'
version: 1
project: test
plan:
  file: missing.md
session:
  file: .state/session.md
EOF
bash "$VALIDATOR" >/dev/null 2>&1
assert "missing_required_key_git: fails" 1 $?

echo ""
echo "Passed: $PASS / $((PASS+FAIL))"
[ $FAIL -eq 0 ]
