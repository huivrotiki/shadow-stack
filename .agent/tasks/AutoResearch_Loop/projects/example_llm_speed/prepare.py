#!/usr/bin/env python3
"""
prepare.py — Неподкупный судья (ЗАПРЕЩЕНО менять во время AutoResearch)

Цель: Объективная оценка результата эксперимента
Метрика: tokens/sec (больше = лучше)
"""

import json
import os
import sys


def evaluate():
    """Оценка результата эксперимента"""

    result_file = "/tmp/train_result.json"

    # 1. Проверка: файл результата существует
    if not os.path.exists(result_file):
        return {
            "status": "error",
            "message": "train.py не создал файл результата",
            "metric": 0,
            "tests_passed": 0,
            "tests_total": 3,
        }

    # 2. Чтение результата
    try:
        with open(result_file, "r") as f:
            result = json.load(f)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Не удалось прочитать результат: {e}",
            "metric": 0,
            "tests_passed": 0,
            "tests_total": 3,
        }

    # 3. Проверка корректности
    tests_passed = 0
    tests_total = 3

    # Test 1: Метрика присутствует
    if "tokens_per_sec" in result and result["tokens_per_sec"] > 0:
        tests_passed += 1

    # Test 2: Метрика в разумных пределах (1-100 tokens/sec)
    if 1 <= result.get("tokens_per_sec", 0) <= 100:
        tests_passed += 1

    # Test 3: Количество запусков = 5
    if result.get("runs", 0) == 5:
        tests_passed += 1

    # 4. Финальная оценка
    if tests_passed == tests_total:
        status = "success"
        metric = result["tokens_per_sec"]
    else:
        status = "partial"
        metric = result.get("tokens_per_sec", 0)

    return {
        "status": status,
        "metric": metric,
        "unit": "tokens/sec",
        "tests_passed": tests_passed,
        "tests_total": tests_total,
        "config": result.get("config", {}),
    }


def main():
    """Запуск оценки"""

    print("⚖️  Judge: Evaluating experiment...")

    evaluation = evaluate()

    print(f"Status: {evaluation['status']}")
    print(f"Metric: {evaluation['metric']:.2f} {evaluation['unit']}")
    print(f"Tests: {evaluation['tests_passed']}/{evaluation['tests_total']}")
    print()

    # Вывод в JSON для Judge агента
    print(json.dumps(evaluation, indent=2))

    # Exit code
    if evaluation["status"] == "success":
        return 0
    else:
        return 1


if __name__ == "__main__":
    exit(main())
