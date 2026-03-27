#!/usr/bin/env node
const inquirer = require('inquirer');
const chalk = require('chalk').default;
const cliProgress = require('cli-progress');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('yamljs');

const CONFIG_PATH = path.resolve(__dirname, '../openclaw.config.json');
const TEAM_PATH = path.resolve(__dirname, '../openclaw-team.yaml');
const ENV_EXAMPLE_PATH = path.resolve(__dirname, '../.env.example');

async function main() {
  // Debug: log chalk to see its structure
  // console.log(chalk);
  console.log(chalk.blue.bold('\n🔧 OpenClaw Deep Setup Wizard for Shadow Stack\n'));

  // Step 1: Prerequisites check
  await checkPrerequisites();

  // Step 2: API key configuration
  const apiKeys = await configureApiKeys();

  // Step 3: Provider configuration
  const providerConfig = await configureProviders();

  // Step 4: Team agent configuration
  const teamConfig = await configureTeam();

  // Step 5: MCP skills setup
  const skillsConfig = await configureSkills();

  // Step 6: Connection testing
  await testConnections(apiKeys, providerConfig);

  // Step 7: Smoke test execution
  await runSmokeTest();

  // Step 8: Update configuration files
  await updateConfigurations(apiKeys, providerConfig, teamConfig, skillsConfig);

  console.log(chalk.green.bold('\n✅ OpenClaw Deep Setup completed successfully!\n'));
}

main().catch(err => {
  console.error('\n❌ Wizard failed:', err);
  process.exit(1);
});

async function checkPrerequisites() {
  console.log(chalk.bold('\n📋 Step 1: Prerequisites Check'));

  const checks = [
    { name: 'Node.js version', check: () => {
        const version = process.version;
        const major = parseInt(version.split('.')[0].slice(1));
        return major >= 18;
      }},
    { name: 'npm availability', check: () => {
        try {
          execSync('npm --version', { stdio: 'ignore' });
          return true;
        } catch (e) {
          return false;
        }
      }},
    { name: 'Ollama installation', check: () => {
        try {
          execSync('ollama --version', { stdio: 'ignore' });
          return true;
        } catch (e) {
          return false;
        }
      }},
    { name: 'Ollama service', check: () => {
        try {
          execSync('curl -s http://localhost:11434/api/tags', { stdio: 'ignore' });
          return true;
        } catch (e) {
          return false;
        }
      }},
    { name: 'Doppler CLI', check: () => {
        try {
          execSync('doppler --version', { stdio: 'ignore' });
          return true;
        } catch (e) {
          return false;
        }
      }},
    { name: 'Git installation', check: () => {
        try {
          execSync('git --version', { stdio: 'ignore' });
          return true;
        } catch (e) {
          return false;
        }
      }}
  ];

  for (const check of checks) {
    const result = check.check();
    if (result) {
      console.log(`  ${chalk.green('✅')} ${check.name}`);
    } else {
      console.log(`  ${chalk.red('❌')} ${check.name}`);
    }
  }

  // Ask user to continue if any critical checks fail
  const criticalChecks = ['Node.js version', 'npm availability'];
  const failedCritical = criticalChecks.filter(name => 
    !checks.find(c => c.name === name && c.check())
  );

  if (failedCritical.length > 0) {
    const { continueAnyway } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnyway',
        message: `Critical checks failed: ${failedCritical.join(', ')}. Continue anyway?`,
        default: false
      }
    ]);

    if (!continueAnyway) {
      throw new Error('Prerequisites check failed. Exiting.');
    }
  }
}

async function configureApiKeys() {
  console.log(chalk.bold('\n🔑 Step 2: API Key Configuration'));

  // We'll guide the user to set these in Doppler, but we can also let them input for testing
  let answers = {};
  try {
    answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'anthropicKey',
        message: 'Enter your ANTHROPIC_API_KEY (or leave blank to skip):',
        validate: input => input.length === 0 || input.startsWith('sk-ant-') ? true : 'Must be a valid Anthropic API key'
      },
      {
        type: 'input',
        name: 'openrouterKey',
        message: 'Enter your OPENROUTER_API_KEY (or leave blank to skip):',
        validate: input => input.length === 0 || input.length > 0 ? true : 'Must be a non-empty string'
      }
    ]);
  } catch (err) {
    console.log(chalk.yellow('  Skipping API key configuration due to user interruption.'));
    // answers remains empty
  }

  return {
    anthropic: answers.anthropicKey || '',
    openrouter: answers.openrouterKey || ''
  };
}

async function configureProviders() {
  console.log(chalk.bold('\n⚙️ Step 3: Provider Configuration'));

  const providers = [
    { id: 'ollama-local', name: 'Ollama 3B (local)', model: 'qwen2.5:3b', type: 'ollama', baseUrl: 'http://localhost:11434' },
    { id: 'ollama-7b', name: 'Ollama 7B (local)', model: 'qwen2.5:7b', type: 'ollama', baseUrl: 'http://localhost:11434' },
    { id: 'openrouter', name: 'OpenRouter', model: 'anthropic/claude-3-haiku', type: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1' },
    { id: 'claude', name: 'Claude Code', model: 'claude-3-5-sonnet-20241022', type: 'anthropic' }
  ];

  const enabledProviders = [];
  for (const provider of providers) {
    const { enable } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enable',
        message: `Enable ${provider.name}?`,
        default: provider.id.startsWith('ollama') // Enable Ollama by default
      }
    ]);

    if (enable) {
      let priority;
      if (provider.id.startsWith('ollama')) {
        // For Ollama, ask about model
        const { modelChoice } = await inquirer.prompt([
          {
            type: 'list',
            name: 'modelChoice',
            message: `Select model for ${provider.name}:`,
            choices: [
              { name: 'qwen2.5:3b (3B)', value: 'qwen2.5:3b' },
              { name: 'qwen2.5:7b (7B)', value: 'qwen2.5:7b' },
              { name: 'llama3.2 (3B)', value: 'llama3.2' },
              { name: 'phi3 (3.8B)', value: 'phi3' }
            ]
          }
        ]);
        provider.model = modelChoice;
      }

      enabledProviders.push(provider);
    }
  }

  // Ask for priority order
  const priorityAnswers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'orderedProviders',
      message: 'Select providers in order of priority (highest first):',
      choices: enabledProviders.map(p => ({ name: p.name, value: p.id }))
    }
  ]);

  // Sort enabledProviders according to the priority order
  const sortedProviders = priorityAnswers.orderedProviders.map(id => 
    enabledProviders.find(p => p.id === id)
  );

  return { providers: sortedProviders };
}

async function configureTeam() {
  console.log(chalk.bold('\n👥 Step 4: Team Agent Configuration'));

  // Load current team config to preserve structure
  let teamConfig;
  try {
    teamConfig = yaml.load(TEAM_PATH);
  } catch (e) {
    console.error(chalk.red('Failed to load openclaw-team.yaml'), e);
    teamConfig = { version: "1.0", agents: {} };
  }

  const agentRoles = [
    { id: 'orchestrator', name: 'Orchestrator', description: 'Decides which agent handles each task. Routes work based on domain.' },
    { id: 'coder', name: 'Coder', description: 'Writes providers, Playwright integration, CDP, server code.' },
    { id: 'telegram_dev', name: 'Telegram_dev', description: 'Bot commands, dashboards, inline keyboards, rate limiting.' },
    { id: 'reviewer', name: 'Reviewer', description: 'Reviews for memory leaks, page.close() patterns, security issues.' },
    { id: 'deployer', name: 'Deployer', description: 'Startup scripts, smoke tests, environment validation.' }
  ];

  const availableModels = [
    'claude-sonnet-4',
    'claude-haiku-4',
    'claude-opus-4',
    'claude-3-5-sonnet-20241022'
  ];

  const availableSkills = [
    'shadow-router',
    'ralph-loop',
    'telegram-bot'
  ];

  const updatedAgents = {};

  for (const role of agentRoles) {
    console.log(chalk.bold(`\nConfiguring ${role.name}:`));
    console.log(chalk.dim(role.description));

    let model, temperature, skills;

    // Model selection
    const { modelChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'modelChoice',
        message: `Select model for ${role.name}:`,
        choices: availableModels.map(m => ({ name: m, value: m }))
      }
    ]);
    model = modelChoice;

    // Temperature
    const { temp } = await inquirer.prompt([
      {
        type: 'number',
        name: 'temp',
        message: `Set temperature (0.0-1.0) for ${role.name}:`,
        default: 0.2,
        min: 0,
        max: 1,
        step: 0.1
      }
    ]);
    temperature = temp;

    // Skills
    const { skillChoices } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'skillChoices',
        message: `Select skills for ${role.name}:`,
        choices: availableSkills.map(s => ({ name: s, value: s }))
      }
    ]);
    skills = skillChoices;

    // Ensure at least one skill
    if (skills.length === 0) {
      console.log(chalk.yellow(`Warning: ${role.name} has no skills assigned. Assigning default skill: shadow-router`));
      skills = ['shadow-router'];
    }

    updatedAgents[role.id] = { model, temperature, skills };
  }

  // Merge with existing config to preserve any other structure
  teamConfig.agents = updatedAgents;
  return teamConfig;
}

async function configureSkills() {
  console.log(chalk.bold('\n🔧 Step 5: MCP Skills Setup'));

  const skills = [
    { name: 'browser-use', description: 'Browser automation via Playwright MCP server' },
    { name: 'memory', description: 'Memory management for agent context' },
    { name: 'sequential-thinking', description: 'Sequential thinking and reasoning' }
  ];

  const installedSkills = [];

  for (const skill of skills) {
    console.log(chalk.bold(`\n${skill.name}:`));
    console.log(chalk.dim(skill.description));

    const { install } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: `Install/setup ${skill.name}?`,
        default: true
      }
    ]);

    if (install) {
      // In a real wizard, we would actually install the skill here
      // For now, we'll just note that it's selected
      installedSkills.push(skill.name);
      console.log(chalk.green(`  ✅ ${skill.name} marked for installation`));
    } else {
      console.log(chalk.yellow(`  ⏭️  ${skill.name} skipped`));
    }
  }

  return { skills: installedSkills };
}

async function testConnections(apiKeys, providerConfig) {
  console.log(chalk.bold('\n🔌 Step 6: Connection Testing'));

  // Test Ollama
  try {
    execSync('curl -s http://localhost:11434/api/tags', { stdio: 'ignore' });
    console.log(chalk.green('  ✅ Ollama connection successful'));
  } catch (e) {
    console.log(chalk.red('  ❌ Ollama connection failed'));
  }

  // Test OpenRouter (if key provided)
  if (apiKeys.openrouter) {
    try {
      const response = execSync(`curl -s -H "Authorization: Bearer ${apiKeys.openrouter}" -H "Content-Type: application/json" -d '{"model":"anthropic/claude-3-haiku","messages":[{"role":"user","content":"test"}],"max_tokens":5}' https://openrouter.ai/api/v1/chat/completions`, { stdio: 'ignore' });
      console.log(chalk.green('  ✅ OpenRouter connection successful'));
    } catch (e) {
      console.log(chalk.red('  ❌ OpenRouter connection failed'));
    }
  }

  // Test Claude (if key provided)
  if (apiKeys.anthropic) {
    try {
      const response = execSync(`curl -s -H "x-api-key: ${apiKeys.anthropic}" -H "anthropic-version: 2023-06-01" -H "content-type: application/json" -d '{"model":"claude-3-5-sonnet-20241022","max_tokens":5,"messages":[{"role":"user","content":"test"}]}' https://api.anthropic.com/v1/messages`, { stdio: 'ignore' });
      console.log(chalk.green('  ✅ Claude API connection successful'));
    } catch (e) {
      console.log(chalk.red('  ❌ Claude API connection failed'));
    }
  }

  // Test OpenClaw gateway (if running)
  try {
    const response = execSync('curl -s http://localhost:18789/health', { stdio: 'ignore' });
    const health = JSON.parse(response);
    if (health.ok && health.status === 'live') {
      console.log(chalk.green('  ✅ OpenClaw gateway is running and healthy'));
    } else {
      console.log(chalk.yellow('  ⚠️  OpenClaw gateway responded but health check failed:', health));
    }
  } catch (e) {
    console.log(chalk.yellow('  ⚠️  OpenClaw gateway is not running or not accessible'));
  }
}

async function runSmokeTest() {
  console.log(chalk.bold('\n💨 Step 7: Smoke Test Execution'));

  try {
    // Run the smoke test script
    const result = execSync('npm run smoke', { stdio: 'pipe', encoding: 'utf8' });
    console.log(chalk.green('  ✅ Smoke test passed:'));
    console.log(result);
  } catch (e) {
    console.log(chalk.red('  ❌ Smoke test failed:'));
    console.log(e.stdout || e.stderr || e.message);
    // Don't fail the wizard for smoke test failure, just warn
    console.log(chalk.yellow('  Note: You can troubleshoot and re-run the smoke test later.'));
  }
}

async function updateConfigurations(apiKeys, providerConfig, teamConfig, skillsConfig) {
  console.log(chalk.bold('\n💾 Step 8: Updating Configuration Files'));

  // Backup original files
  const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupConfig = `${CONFIG_PATH}.backup-${backupTimestamp}`;
  const backupTeam = `${TEAM_PATH}.backup-${backupTimestamp}`;
  fs.copyFileSync(CONFIG_PATH, backupConfig);
  fs.copyFileSync(TEAM_PATH, backupTeam);
  console.log(chalk.dim(`  Backed up original config to ${backupConfig}`));
  console.log(chalk.dim(`  Backed up original team to ${backupTeam}`));

  // Update openclaw.config.json
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  
  // Update providers
  config.providers = providerConfig.providers.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    baseUrl: p.baseUrl,
    model: p.model,
    priority: providerConfig.providers.indexOf(p) + 1, // 1-based index
    costPerToken: p.type === 'ollama' ? 0 : 0.0001, // Placeholder
    maxTokens: 8192,
    ...(p.type === 'openrouter' || p.type === 'anthropic' ? { envKey: p.type === 'openrouter' ? 'OPENROUTER_API_KEY' : 'ANTHROPIC_API_KEY' } : {})
  }));

  // Update skills paths (assuming they are in ./skills/)
  config.skills = skillsConfig.skills.map(skill => ({
    name: skill,
    path: `./skills/${skill}`
  }));

  // Write updated config
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  console.log(chalk.green('  ✅ Updated openclaw.config.json'));

  // Update openclaw-team.yaml
  fs.writeFileSync(TEAM_PATH, yaml.dump(teamConfig));
  console.log(chalk.green('  ✅ Updated openclaw-team.yaml'));

  // Create .env.example
  const envExample = [
    '# Shadow Stack Environment Variables Example',
    '# Copy this to .env and fill in your actual values',
    '',
    '# Required for OpenClaw providers',
    `ANTHROPIC_API_KEY=${apiKeys.anthropic || 'your_anthropic_key_here'}`,
    `OPENROUTER_API_KEY=${apiKeys.openrouter || 'your_openrouter_key_here'}`,
    '',
    '# Optional: For Comet/Opik error reporting',
    '# COMET_ENDPOINT=http://localhost:8080/api/fix',
    '# COMET_API_KEY=your_comet_key_here',
    '',
    '# Other Shadow Stack variables',
    '# SHADOW_LOG=/tmp/shadow-widget.log'
  ].join('\n');

  fs.writeFileSync(ENV_EXAMPLE_PATH, envExample);
  console.log(chalk.green('  ✅ Created .env.example'));

  console.log(chalk.dim('  Note: Remember to set your API keys in Doppler or .env file.'));
}