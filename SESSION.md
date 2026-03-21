# Shadow Stack Widget — Complete CLI Session Prompt

## One-liner for OpenCode

```markdown
Read AGENTS.md and SKILL.md from ~/shadow-stack-widget

## Setup (run in order):

1. Check system:
   - brew, node, python3, ollama, git versions
   - Disk space (df -h ~)
   - Memory (vm_stat)
   - Running services (launchctl list | grep -E "(ollama|openclaw)")

2. Auto-select best FREE Ollama model:
   ./select-model.sh
   OR manually:
   ollama list

   # Priority: qwen2.5:3b > llama3.2 > phi3 > mistral

   # Use first available

3. Check available API providers (NO Anthropic):
   - curl OpenAI-compatible endpoints
   - curl http://localhost:11434/v1/models (Ollama)
   - curl http://localhost:8080/v1/models (Comet/Opik if running)
   - Check .env for API keys

4. List MCP skills:
   ls ~/AI-Workspace/02-Skills/
   ls ~/.claude/skills/ 2>/dev/null || echo "No user skills"
   cat ~/AI-Workspace/02-Skills/\*/SKILL.md 2>/dev/null | head -100

5. System audit:
   npm run headless -- --step=0 --debug

## Continue only if Step 0 passes:

npm run headless -- --all --debug

## Error handling:

- If Ollama unavailable → use Comet/Opik API (if configured)
- If errors → suggest fixes using best available model
- NEVER use Anthropic API

## Final Status Report:

- Ollama model: [model name]
- API providers: [list]
- MCP skills: [count]
- All 8 steps: [passed/failed]
```

---

## Full Prompt (copy-paste for OpenCode)

```
Read AGENTS.md and SKILL.md from ~/shadow-stack-widget

Execute this exact workflow:

=== PHASE 1: System Audit ===
Run: npm run headless -- --step=0 --debug

=== PHASE 2: Ollama Models ===
1. Run: ollama list
2. Select best FREE model (qwen2.5:3b > llama3.2 > phi3 > mistral)
3. Run: ./select-model.sh

=== PHASE 3: API Providers (NO Anthropic) ===
Check these in order:
1. Ollama (always): curl http://localhost:11434/v1/models
2. Comet/Opik: curl http://localhost:8080/v1/models 2>/dev/null || echo "Not running"
3. OpenAI compatible: Check .env for OPENAI_API_KEY, OPENAI_BASE_URL
4. Other: Check for Groq, Mistral, Cohere, Vertex in .env

=== PHASE 4: MCP Skills ===
1. List skills: ls ~/AI-Workspace/02-Skills/
2. List user skills: ls ~/.claude/skills/ 2>/dev/null
3. Count total skills available
4. Note key skills for this project:
   - shadow-stack-widget skill
   - github-automation
   - slack-automation
   - Other relevant skills

=== PHASE 5: Environment ===
1. Check .env: cat ~/shadow-stack-widget/.env
2. Check COMET_ENDPOINT, COMET_API_KEY
3. Check for any API keys

=== PHASE 6: Run Full Stack ===
If Step 0 passes cleanly:
npm run headless -- --all --debug

=== REPORT FORMAT ===
```

## Session Status

### System

- Node: [version]
- Python: [version]
- Ollama: [version]
- Disk: [free/total]
- Memory: [pages free]

### Best Model

- Selected: [model name]
- Size: [GB]
- Status: [ready/not ready]

### API Providers

- Ollama: [available/not available]
- Comet/Opik: [available/not available]
- Others: [list]

### MCP Skills

- Total: [count]
- Key: [list relevant skills]

### Shadow Stack Steps

- Step 0: [passed/failed]
- Step 1-7: [pending/to run]

### Next Actions

1. [action]
2. [action]

```

```

---

## Scripts Reference

```bash
cd ~/shadow-stack-widget

# Auto-select best model
./select-model.sh

# System audit
./audit.sh

# Run specific step
./run-step.sh 0
./run-step.sh 1

# Full run with debug
npm run headless -- --all --debug

# Check providers
curl -s http://localhost:11434/v1/models | jq
curl -s http://localhost:8080/v1/models 2>/dev/null | jq || echo "Comet not running"

# List all skills
ls ~/AI-Workspace/02-Skills/ | wc -l
ls ~/.claude/skills/ 2>/dev/null | wc -l
```

---

## API Provider Priority (NO Anthropic)

1. **Ollama** (localhost:11434) — free, local, private
2. **Comet/Opik** (localhost:8080) — if configured
3. **Groq** (api.groq.com) — free tier, fast
4. **Mistral** (api.mistral.ai) — good free tier
5. **Cohere** (api.cohere.ai) — free tier
6. **OpenAI** — if key available
7. **Google Vertex** — if credentials configured

---

## Environment Variables to Check

```bash
# Ollama
OLLAMA_HOST=localhost:11434

# Comet/Opik
COMET_ENDPOINT=http://localhost:8080
COMET_API_KEY=

# OpenAI compatible
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1

# Groq
GROQ_API_KEY=

# Mistral
MISTRAL_API_KEY=

# Cohere
COHERE_API_KEY=
```
