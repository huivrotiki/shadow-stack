import express from 'express';
import { omniRoute } from './router/auto-router';
import { callTelegramGPT, callTelegramDeepSeek } from './router/providers';

const app = express();
app.use(express.json());

app.post('/v1/chat/completions', async (req, res) => {
  const messages = req.body.messages as Array<{ role: string; content: string }>;
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  try {
    const text = await omniRoute(prompt);
    res.json({
      choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }],
      model: 'omni-router',
    });
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});

// ZeroClaw Gateway endpoints
app.post('/ask-gpt', async (req, res) => {
  try {
    const text = await callTelegramGPT(req.body.prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});

app.post('/ask-deepseek', async (req, res) => {
  try {
    const text = await callTelegramDeepSeek(req.body.prompt);
    res.json({ result: text });
  } catch (e) {
    res.status(503).json({ error: (e as Error).message });
  }
});

app.listen(20128, () => console.log('[OMNI] http://localhost:20128/v1'));
