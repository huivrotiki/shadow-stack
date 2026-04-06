---
name: vibeguard
description: Автоматическая защита секретов и PII-данных перед отправкой в облачные LLM
tags: [security, secrets, pii-protection]
triggers:
  - "protect secrets"
  - "hide tokens"
  - "sanitize output"
---

# VibeGuard — Secrets & PII Protection

## Concept

Автоматически скрывает чувствительные данные перед отправкой в облачные LLM:
- API keys
- Tokens
- Passwords
- Email addresses
- Phone numbers
- Credit card numbers

## Implementation

### 1. Pattern Detection

Регулярные выражения для обнаружения:
```javascript
const patterns = {
  apiKey: /[A-Za-z0-9_-]{32,}/,
  token: /sk-[A-Za-z0-9]{48}/,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  phone: /\+?[1-9]\d{1,14}/,
  creditCard: /\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}/
};
```

### 2. Replacement Strategy

```javascript
function sanitize(text) {
  return text
    .replace(patterns.apiKey, '[API_KEY_REDACTED]')
    .replace(patterns.token, '[TOKEN_REDACTED]')
    .replace(patterns.email, '[EMAIL_REDACTED]')
    .replace(patterns.phone, '[PHONE_REDACTED]')
    .replace(patterns.creditCard, '[CC_REDACTED]');
}
```

### 3. Whitelist

Некоторые значения безопасны:
```javascript
const whitelist = [
  'shadow-free-proxy-local-dev-key',  // Локальный dev key
  'example@example.com',               // Placeholder
  '123-456-7890'                       // Example phone
];
```

## Usage

### Manual Sanitization

```bash
# Перед отправкой в LLM
echo "My API key is sk-abc123..." | .agent/skills/vibeguard/scripts/sanitize.sh
# Output: My API key is [TOKEN_REDACTED]
```

### Automatic Protection

OpenCode автоматически применяет VibeGuard:
1. Перед отправкой в cloud provider
2. При логировании
3. При сохранении в файлы

## Integration

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit
git diff --cached | .agent/skills/vibeguard/scripts/check-secrets.sh
if [ $? -ne 0 ]; then
  echo "❌ Secrets detected! Commit blocked."
  exit 1
fi
```

### Runtime Protection

```javascript
// Wrap LLM calls
async function safeLLMCall(prompt) {
  const sanitized = sanitize(prompt);
  const response = await llm.ask(sanitized);
  return response;
}
```

## Configuration

`.agent/skills/vibeguard/config.json`:
```json
{
  "enabled": true,
  "patterns": ["apiKey", "token", "email"],
  "whitelist": ["shadow-free-proxy-local-dev-key"],
  "logLevel": "warn"
}
```

## Benefits

- **Безопасность:** Секреты не попадают в облако
- **Compliance:** GDPR/CCPA совместимость
- **Автоматизация:** Работает без вмешательства
- **Прозрачность:** Логирует все замены

## Example

**Input:**
```
My Anthropic API key is sk-ant-abc123xyz and email is user@example.com
```

**Output:**
```
My Anthropic API key is [TOKEN_REDACTED] and email is [EMAIL_REDACTED]
```

## Known Limitations

- Не защищает от контекстных утечек (например, "мой пароль — это слово 'password'")
- Требует регулярного обновления паттернов
- Может ложно срабатывать на похожие строки
