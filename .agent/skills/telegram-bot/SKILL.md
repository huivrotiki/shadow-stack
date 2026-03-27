# Telegram Bot — Skill

> Bot commands, live dashboard, rate limiting, inline keyboards.

## Commands

| Command | Description | Response Type |
|---------|-------------|---------------|
| `/help` | List all commands | Static text |
| `/route <query>` | Show routing decision | Static text |
| `/status` | System status | Editable (live) |
| _(text)_ | Route through smartQuery | AI response |

## Live Dashboard (`/status`)

Use `editMessageText` to update status message in-place:

```js
const msg = await bot.sendMessage(chatId, 'Loading status...');
const status = getStatus();
await bot.editMessageText(formatStatus(status), {
  chat_id: chatId,
  message_id: msg.message_id,
  parse_mode: 'Markdown'
});
```

## Rate Limit

- 1 message per second per user
- Track in Map: `{ userId: lastMessageTimestamp }`
- On violation: send "Rate limited. Please wait." and ignore

## Inline Keyboards

For `/status`:
```js
{
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Refresh', callback_data: 'status_refresh' }],
      [{ text: 'Logs', callback_data: 'status_logs' }]
    ]
  }
}
```

## Error Handling

- Bot token missing → log error, skip bot start
- Network error → retry 3x with backoff
- Unknown command → respond with "Unknown command. Try /help"

## Pattern: Command Registration

```js
bot.onText(/\/help/, (msg) => {
  bot.sendMessage(msg.chat.id, HELP_TEXT, { parse_mode: 'Markdown' });
});

bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    handleTextMessage(msg);
  }
});
```
