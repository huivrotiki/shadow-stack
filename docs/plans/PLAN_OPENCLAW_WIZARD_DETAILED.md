
═══════════════════════════════════════
PLAN #1 — OpenClaw Deep Setup Wizard for Shadow Stack (Detailed Sub-steps)
═══════════════════════════════════════

Что делаем:
1. Review current OpenClaw configuration and team setup
   1.1. Examine openclaw.config.json structure and current values
   1.2. Examine openclaw-team.yaml structure and current agent definitions
   1.3. Identify which parts are safe to customize vs. required for Shadow Stack
   1.4. Document current configuration as baseline

2. Design and implement interactive CLI wizard
   2.1. Initialize Node.js project for wizard (if separate) or add to existing scripts
   2.2. Install inquirer.js and any required dependencies (chalk, cli-progress, etc.)
   2.3. Create wizard framework with step navigation (next/back/exit)
   2.4. Implement input validation for each prompt type
   2.5. Add error handling and recovery mechanisms
   2.6. Create configuration update functions for JSON/YAML files
   2.7. Add logging and progress tracking throughout wizard

3. Wizard step-by-step implementation:
   3.1 Prerequisites check
       3.1.1. Check Node.js version (>=18)
       3.1.2. Check npm availability
       3.1.3. Check for Ollama installation and service status
       3.1.4. Check Doppler CLI installation and login status
       3.1.5. Check Git installation and repository status
       3.1.6. Display results with pass/fail indicators and guidance for fixes

   3.2 API key configuration
       3.2.1. Explain required API keys (ANTHROPIC_API_KEY, OPENROUTER_API_KEY)
       3.2.2. Guide user to Doppler project setup if needed
       3.2.3. Provide instructions for setting secrets via Doppler CLI or dashboard
       3.2.4. Option to test key validity with provider APIs
       3.2.5. Store validated keys temporarily for configuration

   3.3 Provider configuration
       3.3.1. Explain available providers: Ollama 3B, Ollama 7B, OpenRouter, Claude
       3.3.2. Allow user to enable/disable each provider
       3.3.3. For enabled providers, allow setting priority order (1-4)
       3.3.4. For Ollama, allow model selection (qwen2.5:3b, qwen2.5:7b, etc.)
       3.3.5. Validate that at least one provider is enabled and prioritized
       3.3.6. Show preview of final provider fallback chain

   3.4 Team agent configuration
       3.4.1. Review 5-agent team structure from openclaw-team.yaml
       3.4.2. For each agent (Orchestrator, Coder, Telegram_dev, Reviewer, Deployer):
           - Allow model selection (claude-sonnet-4, claude-haiku-4, claude-opus-4, etc.)
           - Allow temperature adjustment (0.0-1.0 with recommended values)
           - Allow skill assignment from available skills list
           - Show brief description of agent role
       3.4.3. Validate that each agent has at least one skill assigned
       3.4.4. Preview final team configuration

   3.5 MCP skills setup
       3.5.1. Explain MCP (Model Context Protocol) and its role
       3.5.2. List available skills: browser-use, memory, sequential-thinking
       3.5.3. For each skill:
           - Explain purpose and capabilities
           - Check if already installed
           - Offer to install/update via npm
           - Verify installation success
       3.5.4. Configure skill paths in openclaw.config.json
       3.5.5. Test basic functionality of each installed skill

   3.6 Connection testing
       3.6.1. Test connectivity to each enabled provider:
           - Ollama: HTTP request to localhost:11434
           - OpenRouter: API request with test key (if provided)
           - Claude: API request with test key (if provided)
       3.6.2. Test OpenClaw gateway startup and health endpoint
       3.6.3. Test Telegram bot connectivity (if configured)
       3.6.4. Display connection results with latency and status
       3.6.5. Offer to retry failed connections or skip non-critical ones

   3.7 Smoke test execution
       3.7.1. Explain what the smoke test validates
       3.7.2. Run Shadow Stack smoke test script (scripts/smoke-test.sh)
       3.7.3. Capture and display results
       3.7.4. If failed, offer to view logs or retry
       3.7.5. Confirm overall system readiness

4. Configuration file updates
   4.1. Update openclaw.config.json:
        - providers section with user-selected priorities and models
        - routing rules and fallback chain
        - skills paths
        - telegram notification settings
   4.2. Update openclaw-team.yaml:
        - agent models, temperatures, and skills
        - preserve version and routing structure
   4.3. Generate .env.example with required variables:
        - ANTHROPIC_API_KEY
        - OPENROUTER_API_KEY
        - (Optional) COMET_ENDPOINT, COMET_API_KEY
   4.4. Create backup of original configurations before changes

5. Wizard output and user experience
   5.1. Use chalk for colored output and visual feedback
   5.2. Implement progress bars for multi-step operations
   5.3. Add clear instructions and examples for each prompt
   5.4. Include validation with helpful error messages
   5.5. Allow non-linear navigation (next/back/exit at any step)
   5.6. Provide summary before final confirmation
   5.7. Offer to save configuration or discard changes

6. Integration and deployment
   6.1. Add setup script to package.json:
        "setup:openclaw": "node scripts/openclaw-wizard.js"
   6.2. Create scripts/openclaw-wizard.js as entry point
   6.3. Include wizard dependencies in package.json or devDependencies
   6.4. Document usage in README.md
   6.5. Ensure wizard can be run multiple times for reconfiguration

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
   - Configuration backups were created
   - All selected providers are functional
   - Team agents are properly configured
]

═══════════════════════════════════════

