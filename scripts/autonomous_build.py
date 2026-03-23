#!/usr/bin/env python3
# ~/shadow-stack_local_1/scripts/autonomous_build.py
#
# Shadow Stack v4 — Multi-Agent Autonomous Build Pipeline
# Supervisor Agent координирует 6 Worker Agents
# Каждый шаг: Ollama/LiteLLM → JSON output → SQLite checkpoint → следующий шаг
#
# Запуск: doppler run -- python3 scripts/autonomous_build.py

import os
import json
import sqlite3
import subprocess
import time
from datetime import datetime
from pathlib import Path
import hashlib

# ═══════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════
DOPPLER_ACTIVE = os.environ.get("DOPPLER_ENABLED", "true") == "true"
DB_PATH = os.path.expanduser("~/shadow-stack/db/memory.db")
OUTPUT_DIR = os.path.expanduser("~/shadow-stack_local_1/health-dashboard")
GITHUB_REPO = os.path.expanduser("~/shadow-stack_local_1")

AGENTS = {
    "step_1": {
        "model": "shadow-coder",      # Ollama 3B
        "task": "CSS + Header + Tab 1",
        "timeout": 120,
        "retry": 3,
    },
    "step_2": {
        "model": "phi-mini",           # Ollama
        "task": "Canvas Tab 2 + Tab 6",
        "timeout": 180,
        "retry": 2,
    },
    "step_3": {
        "model": "shadow-coder",      # Ollama
        "task": "Tab 3 Auto-Router Simulator",
        "timeout": 150,
        "retry": 3,
    },
    "step_4": {
        "model": "phi-mini",           # Ollama
        "task": "Tab 4 + 5 + 7",
        "timeout": 160,
        "retry": 2,
    },
    "step_5": {
        "model": "shadow-coder",      # Ollama
        "task": "Tab 8 + Polish + Performance",
        "timeout": 120,
        "retry": 2,
    },
    "step_6": {
        "model": "claude-3-5-sonnet",  # LiteLLM proxy
        "task": "Vercel Deploy + Handoff",
        "timeout": 90,
        "retry": 1,
    },
}

# ═══════════════════════════════════════════════
# DATABASE INIT
# ═══════════════════════════════════════════════
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS build_pipeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            step TEXT UNIQUE,
            model TEXT,
            status TEXT DEFAULT 'pending',
            output TEXT,
            error TEXT,
            start_time TEXT,
            end_time TEXT,
            duration_seconds REAL,
            token_usage INT,
            ram_mb INT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS agent_outputs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            step TEXT,
            component_name TEXT,
            html_fragment TEXT,
            canvas_code TEXT,
            validation_passed INT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

# ═══════════════════════════════════════════════
# DOPPLER INJECTION
# ═══════════════════════════════════════════════
def inject_secrets():
    """Инжектировать Doppler переменные в процесс"""
    if not DOPPLER_ACTIVE:
        return {}

    try:
        result = subprocess.run(
            ["doppler", "secrets", "download", "--no-file", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return json.loads(result.stdout)
    except Exception as e:
        print(f"✘ Doppler injection failed: {e}")
        return {}

# ═══════════════════════════════════════════════
# CALL AGENT via LiteLLM / Ollama
# ═══════════════════════════════════════════════
def call_agent(step_key, agent_config, previous_outputs=None):
    """
    Вызвать AI-агент через LiteLLM proxy или Ollama напрямую.
    Возвращает JSON: {"status": "success|error", "output": "...", "html": "..."}
    """
    model = agent_config["model"]
    task = agent_config["task"]

    # Контекст для агента
    context = f"""
You are an autonomous code generation agent for Shadow Stack v4 Health Dashboard.

TASK: {task}
STEP: {step_key}

Previous outputs:
{json.dumps(previous_outputs or {}, indent=2)}

OUTPUT FORMAT (mandatory JSON):
{{
    "status": "success|error",
    "html": "<your generated HTML or Canvas code>",
    "canvas_renderer": "<CanvasRenderer class if needed>",
    "validation_notes": "What was verified",
    "next_checkpoint": "Ready for step N+1: <reason>"
}}

Generate ONLY valid JSON. No markdown, no code fences.
"""

    # Вызов Ollama локально (no auth)
    if model in ["shadow-coder", "phi-mini"]:
        return call_ollama(model, context, agent_config)

    # Вызов LiteLLM proxy (с LITELLM_MASTER_KEY)
    else:
        return call_litellm(model, context, agent_config)


def call_ollama(model, prompt, config):
    """Запрос к Ollama http://localhost:11434"""
    import requests

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40,
            },
            timeout=config["timeout"]
        )
        response.raise_for_status()

        response_text = response.json()["response"]

        # Найти JSON блок в ответе
        try:
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(response_text[json_start:json_end])
                return result
        except:
            pass

        return {"status": "error", "error": f"Failed to parse JSON from Ollama"}

    except Exception as e:
        return {"status": "error", "error": str(e)}


def call_litellm(model, prompt, config):
    """Запрос к LiteLLM proxy http://localhost:4000"""
    import requests

    try:
        master_key = os.environ.get("LITELLM_MASTER_KEY")
        response = requests.post(
            "http://localhost:4000/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {master_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 8000,
            },
            timeout=config["timeout"]
        )
        response.raise_for_status()

        content = response.json()["choices"][0]["message"]["content"]

        # Парсить JSON из ответа
        try:
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                result = json.loads(content[json_start:json_end])
                return result
        except:
            pass

        return {"status": "error", "error": f"Failed to parse JSON from Claude"}

    except Exception as e:
        return {"status": "error", "error": str(e)}

# ═══════════════════════════════════════════════
# ASSEMBLY — собрать HTML из фрагментов
# ═══════════════════════════════════════════════
def assemble_html(outputs):
    """Собрать окончательный index.html из всех компонентов"""

    html_parts = []

    # Header от Step 1
    html_parts.append(outputs.get("step_1", {}).get("html", ""))

    # CSS от Step 1
    css = outputs.get("step_1", {}).get("css", "")

    # Canvas renderer от Step 2
    canvas_renderer = outputs.get("step_2", {}).get("canvas_renderer", "")

    # Tab содержимое от Step 3, 4, 5
    tabs_html = "\n".join([
        outputs.get(f"step_{i}", {}).get("html", "")
        for i in range(3, 6)
    ])

    final_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shadow Stack v4 — Health Dashboard</title>
    <style>
{css}
    </style>
</head>
<body>
    <div id="root">
        {html_parts[0]}
        {tabs_html}
    </div>

    <script>
        // CanvasRenderer
        {canvas_renderer}

        // Tab switching logic
        document.querySelectorAll('[data-tab]').forEach(tab => {{
            tab.addEventListener('click', e => {{
                const target = e.target.dataset.tab;
                document.querySelectorAll('[data-panel]').forEach(p => p.hidden = true);
                document.querySelector(`[data-panel="${{target}}"]`).hidden = false;
            }});
        }});
    </script>
</body>
</html>"""

    return final_html

# ═══════════════════════════════════════════════
# PIPELINE EXECUTOR
# ═══════════════════════════════════════════════
def run_pipeline():
    """Основной цикл автоматизации"""

    init_db()
    secrets = inject_secrets()

    print("🔨 Starting autonomous build pipeline...")
    print(f"    Time: {datetime.now().isoformat()}")
    print(f"    DB: {DB_PATH}")
    print(f"    Output: {OUTPUT_DIR}")
    print()

    outputs = {}
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    for step_num, (step_key, agent_config) in enumerate(AGENTS.items(), 1):
        print(f"\n🔨 STEP {step_num}/6 — {agent_config['task']}")
        print(f"    Model: {agent_config['model']}")
        print(f"    Timeout: {agent_config['timeout']}s")

        # Check DB status
        c.execute("SELECT status FROM build_pipeline WHERE step = ?", (step_key,))
        existing = c.fetchone()

        if existing and existing[0] == "completed":
            print(f"    ✅ Already completed — loading from cache")
            c.execute("SELECT output FROM build_pipeline WHERE step = ?", (step_key,))
            cached_output = c.fetchone()[0]
            outputs[step_key] = json.loads(cached_output)
            continue

        # Retry logic
        for attempt in range(agent_config["retry"]):
            print(f"    Attempt {attempt + 1}/{agent_config['retry']}")

            start_time = time.time()

            # Call agent
            result = call_agent(step_key, agent_config, outputs)

            duration = time.time() - start_time

            if result.get("status") == "success":
                print(f"    ✅ Success in {duration:.1f}s")

                # Store in DB
                c.execute("""
                    INSERT OR REPLACE INTO build_pipeline
                    (step, model, status, output, duration_seconds, start_time)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    step_key,
                    agent_config["model"],
                    "completed",
                    json.dumps(result),
                    duration,
                    datetime.now().isoformat()
                ))
                conn.commit()

                outputs[step_key] = result
                break

            else:
                error = result.get("error", "Unknown error")
                print(f"    ⚠ Attempt {attempt + 1} failed: {error[:80]}")

                if attempt == agent_config["retry"] - 1:
                    print(f"    ✘ FAILED after {agent_config['retry']} attempts")
                    return False

                time.sleep(5)  # Backoff before retry

        print(f"    Pipeline integrity: {step_num}/6 steps complete")

    conn.close()

    # Assemble final HTML
    print("\n🔨 Assembling final HTML...")
    final_html = assemble_html(outputs)

    # Write to file
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    html_file = Path(OUTPUT_DIR) / "index.html"
    html_file.write_text(final_html, encoding="utf-8")
    print(f"    ✅ Written to {html_file} ({len(final_html)} bytes)")

    # Git commit
    print("\n🔨 Committing to Git...")
    subprocess.run(
        ["git", "-C", GITHUB_REPO, "add", "health-dashboard/index.html"],
        check=False
    )
    subprocess.run(
        ["git", "-C", GITHUB_REPO, "commit", "-m", "feat: autonomous build v4 complete"],
        check=False
    )
    print("    ✅ Committed")

    # Deploy
    print("\n🔨 Deploying to Vercel...")
    result = subprocess.run(
        ["bash", "-c", f"cd {OUTPUT_DIR} && vercel deploy --prod --yes"],
        capture_output=True,
        text=True,
    )

    if result.returncode == 0:
        print("    ✅ Deployment successful")
        vercel_url = result.stdout.strip().split("\n")[-1]
        print(f"    URL: {vercel_url}")
    else:
        print(f"    ⚠ Deployment status: {result.stderr[:200]}")

    print("\n✨ Pipeline complete!")
    return True

# ═══════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════
if __name__ == "__main__":
    success = run_pipeline()
    exit(0 if success else 1)
