#!/bin/bash
# Shadow Stack Model Router v5.2
# RAM-aware выбор провайдера по типу задачи.
# Usage: ./model-router.sh [general|code|reasoning|fast|long]
# Output: PROVIDER=<id> MODEL=<alias>

TASK_TYPE=${1:-"general"}
FREE_MB=$(curl -sf http://localhost:3001/ram 2>/dev/null | jq -r '.free_mb // 400' 2>/dev/null)
FREE_MB=${FREE_MB:-400}

echo "[Router] RAM: ${FREE_MB}MB | Task: $TASK_TYPE" >&2

# RAM < 300MB — только облачные, без локальных моделей
if [ "$FREE_MB" -lt 300 ]; then
  case "$TASK_TYPE" in
    reasoning) echo "PROVIDER=openrouter MODEL=or-trinity" ;;
    code)      echo "PROVIDER=openrouter MODEL=or-qwen3coder" ;;
    *)         echo "PROVIDER=groq MODEL=gr-llama70b" ;;
  esac
  exit 0
fi

# Нормальный режим — оптимальный выбор под задачу
case "$TASK_TYPE" in
  reasoning) echo "PROVIDER=nvidia MODEL=nv-deepseek-r1" ;;
  code)      echo "PROVIDER=nvidia MODEL=nv-deepseek-v3" ;;
  fast)      echo "PROVIDER=groq MODEL=gr-llama70b" ;;
  long)      echo "PROVIDER=gemini MODEL=gem-2.5-flash" ;;  # 1M context
  *)         echo "PROVIDER=groq MODEL=gr-llama70b" ;;
esac
