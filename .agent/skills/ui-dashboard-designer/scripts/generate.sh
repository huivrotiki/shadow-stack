#!/bin/bash
# UI Dashboard Designer — Component Generator
# Usage: ./generate.sh <name> <type>

NAME="$1"
TYPE="$2"
OUTPUT_DIR=".agent/skills/ui-dashboard-designer/generated/$NAME"

if [ -z "$NAME" ] || [ -z "$TYPE" ]; then
  echo "Usage: $0 <name> <type>"
  echo "  name: Component name (e.g., StatusCard)"
  echo "  type: card|dashboard|table|chart|form|button|input|modal"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "🎨 UI Dashboard Designer — Component Generator"
echo "Name: $NAME"
echo "Type: $TYPE"
echo ""

# Generate based on type
case "$TYPE" in
  card)
    echo "📦 Generating Card component..."
    cat > "$OUTPUT_DIR/${NAME}.jsx" << EOF
export function ${NAME}({ status, label, icon }) {
  return (
    <div className="card" data-status={status}>
      <span className="icon">{icon}</span>
      <div className="content">
        <h3>{label}</h3>
        <span className={\`badge badge-\${status}\`}>{status}</span>
      </div>
    </div>
  );
}
EOF
    cat > "$OUTPUT_DIR/${NAME}.css" << EOF
.card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 16px);
  padding: var(--spacing-lg, 24px);
  background: var(--color-surface, #1E293B);
  border-radius: 8px;
  border: 1px solid var(--color-border, #334155);
}
.badge-ok { background: #10B981; color: white; }
.badge-warning { background: #F59E0B; color: white; }
.badge-error { background: #EF4444; color: white; }
EOF
    ;;
  dashboard)
    echo "📊 Generating Dashboard component..."
    cat > "$OUTPUT_DIR/${NAME}.jsx" << EOF
export function ${NAME}({ widgets }) {
  return (
    <div className="dashboard">
      {widgets.map((w, i) => (
        <div key={i} className="widget">{w}</div>
      ))}
    </div>
  );
}
EOF
    cat > "$OUTPUT_DIR/${NAME}.css" << EOF
.dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg, 24px);
  padding: var(--spacing-xl, 32px);
}
EOF
    ;;
  *)
    echo "⚠️  Type '$TYPE' not fully implemented yet"
    echo "📝 Created placeholder files"
    cat > "$OUTPUT_DIR/${NAME}.jsx" << EOF
export function ${NAME}(props) {
  return <div className="${NAME}">{/* TODO: Implement */}</div>;
}
EOF
    ;;
esac

echo ""
echo "✅ Generated: $OUTPUT_DIR/"
ls -la "$OUTPUT_DIR/"
