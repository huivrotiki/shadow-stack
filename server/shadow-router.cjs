const express = require('express');
const app = express();
const port = 3002;

// Mock implementation of Shadow Router
// In a real implementation, this would use Playwright to connect to Chrome via CDP
// and route prompts to various LLM web UIs.

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shadow-router' });
});

app.get('/ram', (req, res) => {
  // Mock RAM data - in reality, this would check system RAM
  const freeRAM = Math.floor(Math.random() * 100) + 50; // Random between 50-150 MB
  res.json({ freeRAM, threshold: 400 });
});

app.get('/route/:target/:prompt', (req, res) => {
  const { target, prompt } = req.params;
  
  // Check RAM first (mock)
  const freeRAM = Math.floor(Math.random() * 100) + 50;
  if (freeRAM < 400) {
    return res.json({ error: 'LOW_RAM', freeRAM, threshold: 400 });
  }
  
  // Mock response based on target
  const responses = {
    claude: `Claude response to: "${prompt}"`,
    chatgpt: `ChatGPT response to: "${prompt}"`,
    gemini: `Gemini response to: "${prompt}"`,
    grok: `Grok response to: "${prompt}"`
  };
  
  const response = responses[target] || `Unknown target: ${target}`;
  res.json({ target, prompt, response, timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Shadow Router listening on port ${port}`);
});

module.exports = app;