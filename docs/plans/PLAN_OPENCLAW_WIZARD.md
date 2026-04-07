═══════════════════════════════════════
PLAN #1 — OpenClaw Deep Setup Wizard for Shadow Stack
═══════════════════════════════════════

Что делаем:
1. Review current OpenClaw configuration (openclaw.config.json) and team setup (openclaw-team.yaml)
2. Design an interactive CLI wizard using Node.js and inquirer.js to guide user through deep setup
3. Wizard steps:
   a. Prerequisites check: Node.js, Ollama, Doppler, Git
   b. API key configuration: Guide user to set up Doppler secrets for ANTHROPIC_API_KEY, OPENROUTER_API_KEY
   c. Provider configuration: Help user select priority order for Ollama (3B/7B), OpenRouter, Claude
   d. Team agent configuration: Allow customization of agent models, temperatures, and skill assignments
   e. MCP skills setup: Install and configure browser-use, memory, sequential-thinking skills
   f. Connection testing: Verify connectivity to all configured providers and Telegram bot
   g. Smoke test execution: Run end-to-end test to ensure agent can route queries correctly
4. Wizard will update configuration files based on user input:
   - openclaw.config.json (providers, routing, telegram settings)
   - openclaw-team.yaml (agent models, skills, temperature)
   - Create .env.example with required variables
5. Output format: Interactive CLI with colored prompts, progress bars, and validation
6. Integration: Wizard will be added to package.json as "setup:openclaw" script

ASSUMPTION: User has Node.js >=18, npm, and access to Shadow Stack Doppler project
START CONDITION: [ ] Подтвердить план

───────────────────────────────────────
IMPL — Реализация
───────────────────────────────────────

[Note: In plan mode, we do not implement. The user or a future session must implement the wizard based on this plan.]

───────────────────────────────────────
RUNBOOK — Как запустить
───────────────────────────────────────

[Note: To run the wizard, the user would execute:
   npm run setup:openclaw
   or
   node scripts/openclaw-wizard.js
]

───────────────────────────────────────
CHECKLIST — Что проверить
───────────────────────────────────────

[Note: The user should verify that:
   - Wizard completes without errors
   - openclaw.config.json and openclaw-team.yaml are updated correctly
   - OpenClaw gateway starts successfully
   - Telegram /openclaw command responds
   - Smoke test passes
]

═══════════════════════════════════════
