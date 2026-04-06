#!/usr/bin/env python3
"""
train.py — Код для оптимизации (ЕДИНСТВЕННЫЙ редактируемый файл)

Цель: Ускорить генерацию токенов в Ollama
Метрика: tokens/sec (больше = лучше)
"""

import requests
import time
import json

# Ollama endpoint
OLLAMA_URL = "http://localhost:11434/v1/chat/completions"

# Параметры модели (ОПТИМИЗИРУЙ ЭТО)
MODEL_CONFIG = {
    "model": "qwen2.5-coder:3b",
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 40,
    "num_ctx": 2048,  # Context window
    "num_predict": 100,  # Max tokens to generate
    "keep_alive": 0,  # Выгружать модель после генерации (RAM Guard)
}

# Тестовый промпт
SYSTEM_PROMPT = (
    "You are a helpful coding assistant. Write clean, efficient Python code."
)
USER_PROMPT = (
    "Write a Python function to calculate fibonacci numbers using dynamic programming."
)


def generate_tokens():
    """Генерация токенов через Ollama API"""

    payload = {
        "model": MODEL_CONFIG["model"],
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT},
        ],
        "temperature": MODEL_CONFIG["temperature"],
        "top_p": MODEL_CONFIG["top_p"],
        "top_k": MODEL_CONFIG["top_k"],
        "options": {
            "num_ctx": MODEL_CONFIG["num_ctx"],
            "num_predict": MODEL_CONFIG["num_predict"],
        },
        "stream": False,
    }

    start_time = time.time()

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        response.raise_for_status()

        end_time = time.time()
        duration = end_time - start_time

        result = response.json()
        content = result["choices"][0]["message"]["content"]

        # Подсчёт токенов (примерно: 1 токен ≈ 4 символа)
        tokens = len(content) // 4
        tokens_per_sec = tokens / duration if duration > 0 else 0

        return {
            "success": True,
            "tokens": tokens,
            "duration": duration,
            "tokens_per_sec": tokens_per_sec,
            "content": content,
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def main():
    """Запуск эксперимента"""

    print("🚀 Starting LLM inference benchmark...")
    print(f"Model: {MODEL_CONFIG['model']}")
    print(f"Context window: {MODEL_CONFIG['num_ctx']}")
    print(f"Max tokens: {MODEL_CONFIG['num_predict']}")
    print()

    # Запускаем 5 раз и берём среднее
    results = []

    for i in range(5):
        print(f"Run {i + 1}/5...", end=" ")
        result = generate_tokens()

        if result["success"]:
            print(f"✅ {result['tokens_per_sec']:.2f} tokens/sec")
            results.append(result["tokens_per_sec"])
        else:
            print(f"❌ Error: {result['error']}")

    if results:
        avg_tokens_per_sec = sum(results) / len(results)
        print()
        print(f"📊 Average: {avg_tokens_per_sec:.2f} tokens/sec")

        # Вывод для prepare.py
        output = {
            "tokens_per_sec": avg_tokens_per_sec,
            "runs": len(results),
            "config": MODEL_CONFIG,
        }

        with open("/tmp/train_result.json", "w") as f:
            json.dump(output, f)

        return 0
    else:
        print("❌ All runs failed")
        return 1


if __name__ == "__main__":
    exit(main())
