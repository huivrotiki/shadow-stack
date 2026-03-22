import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

// 1. Config
const token = process.env.TELEGRAM_TOKEN;
const proxyGroupChatId = process.env.DEEPSEEK_PROXY_CHAT_ID || process.env.PROXY_CHAT_ID;
const proxyBotUsername = process.env.DEEPSEEK_PROXY_BOT_USERNAME || 'deepseek_gidbot';

if (!token) {
  console.error('❌ Missing TELEGRAM_TOKEN in .env');
  process.exit(1);
}

// 2. State & Initialization
const bot = new TelegramBot(token, { polling: true });
const requestMap = new Map(); // message_id_in_group -> { originalChatId, originalMsgId }

console.log('🚀 Shadow Stack Bot is starting (Group Proxy Mode)...');

// 3. Handlers
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  // Handler for /ai - Initial request
  if (text.startsWith('/ai ')) {
    const query = text.slice(4).trim();
    if (!query) return bot.sendMessage(chatId, '❓ Usage: /ai <text>');

    if (!proxyGroupChatId) {
      return bot.sendMessage(chatId, '⚠️ Proxy Group Chat ID not configured in .env');
    }

    try {
      // Forward to group. To trigger some bots, you might need to mention them or just post
      // Assuming @deepseek_gidbot or similar picks up group queries
      const forwardedMsg = await bot.sendMessage(proxyGroupChatId, `${query}`);
      
      // Store the mapping to forward the response later
      requestMap.set(forwardedMsg.message_id, {
        originalChatId: chatId,
        originalMsgId: msg.message_id
      });

      bot.sendMessage(chatId, '⏳ Forwarded to AI Group. Awaiting response...');
    } catch (e) {
      bot.sendMessage(chatId, `❌ Error forwarding: ${e.message}`);
    }
  }

  // Handler for responses in the group
  if (msg.chat.id.toString() === proxyGroupChatId?.toString()) {
    // If it's a reply to one of our messages
    if (msg.reply_to_message) {
      const mapping = requestMap.get(msg.reply_to_message.message_id);
      if (mapping) {
        // This is a response to our query!
        // Mention the original user and forward the text
        bot.sendMessage(mapping.originalChatId, `🤖 <b>AI Response:</b>\n\n${text}`, {
          parse_mode: 'HTML',
          reply_to_message_id: mapping.originalMsgId
        });
        
        // Optionally keep mapping if history is needed, but for simple request/reply:
        // requestMap.delete(msg.reply_to_message.message_id); 
      }
    }
  }

  // Help command
  if (text === '/help' || text === '/start') {
    bot.sendMessage(chatId, 
      '🤖 <b>Shadow Stack AI Bridge</b>\n\n' +
      '/ai <your query> — Forward query to AI group proxy\n' +
      '/status — Check project status\n' +
      '/help — This message',
      { parse_mode: 'HTML' }
    );
  }
});

// 4. Status Command
bot.onText(/\/status/, async (msg) => {
  bot.sendMessage(msg.chat.id, '📊 Status: Online, linked to proxy group: ' + proxyGroupChatId);
});
