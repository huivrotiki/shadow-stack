import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import TelegramBot from 'node-telegram-bot-api';
import { getNextGeminiKey } from '../lib/key-pool';

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });

// ── Tier 1: inline fallback chain (Gemini → Groq via OR → StepFun via OR) ──

export async function callWithFallback(prompt: string): Promise<string> {
  const providers = [
    () => generateText({ model: google('gemini-2.0-flash-exp', { apiKey: getNextGeminiKey() } as any), prompt }),
    () => generateText({ model: openrouter('meta-llama/llama-3.3-70b-instruct:free'), prompt }),
    () => generateText({ model: openrouter('stepfun/step-3-5-flash:free'), prompt }),
  ];
  for (const fn of providers) {
    try {
      const { text } = await fn();
      return text;
    } catch (err) {
      console.warn('[PROVIDERS] fallback step failed:', (err as Error).message);
    }
  }
  throw new Error('All Tier-1 providers failed');
}

export async function callGemini(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: google('gemini-2.0-flash-exp', { apiKey: getNextGeminiKey() } as any),
    prompt,
  });
  return text;
}

export async function callGroq(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: openrouter('meta-llama/llama-3.3-70b-instruct:free'),
    prompt,
  });
  return text;
}

export async function callDeepSeekFree(prompt: string): Promise<string> {
  const { text } = await generateText({
    model: openrouter('stepfun/step-3-5-flash:free'),
    prompt,
  });
  return text;
}

// ── Tier 2: Telegram Shadow Layer ──────────────────────────────────────────

const tgBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!);
const GROUP_ID = Number(process.env.TELEGRAM_GROUP_ID);

function chunkPrompt(prompt: string, maxLen = 3500): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < prompt.length; i += maxLen) chunks.push(prompt.slice(i, i + maxLen));
  return chunks;
}

export async function warmAndAsk(
  bot: '@chatgpt_gidbot' | '@deepseek_gidbot',
  prompt: string,
  timeoutMs = 30000
): Promise<string> {
  for (const chunk of chunkPrompt(prompt)) {
    await tgBot.sendMessage(GROUP_ID, `${bot} ${chunk}`);
    await new Promise(r => setTimeout(r, 1000));
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      tgBot.removeListener('message', handler);
      reject(new Error('Telegram timeout 30s'));
    }, timeoutMs);

    function handler(msg: any) {
      if (msg.chat.id === GROUP_ID && msg.from?.username?.includes('gidbot') && msg.text) {
        clearTimeout(timer);
        tgBot.removeListener('message', handler);
        resolve(msg.text);
      }
    }
    tgBot.on('message', handler);
  });
}

export const callTelegramGPT = (p: string) => warmAndAsk('@chatgpt_gidbot', p);
export const callTelegramDeepSeek = (p: string) => warmAndAsk('@deepseek_gidbot', p);
