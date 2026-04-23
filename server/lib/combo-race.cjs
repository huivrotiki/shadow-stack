// server/lib/combo-race.cjs — Race Strategy Combo Model
// Запускает несколько моделей параллельно, возвращает первый успешный ответ

class ComboRaceModel {
  constructor(gateway) {
    this.gateway = gateway;
    this.name = 'combo-race';
    
    // Топ-3 самых быстрых модели (по бенчмарку)
    this.models = [
      { id: 'gr-llama8b', provider: 'groq', model: 'llama-3.1-8b-instant' },
      { id: 'ms-small', provider: 'mistral', model: 'ministral-8b-latest' },
      { id: 'cb-llama70b', provider: 'cerebras', model: 'llama3.1-70b' },
    ];
    // Timeout per model = 3s (быстрые модели должны отвечать за 1с)
    this.timeout = 3000;
  }

  async call(messages, options = {}) {
    const startTime = Date.now();
    
    // Создаём промисы для всех моделей
    const promises = this.models.map(async (model) => {
      const modelStart = Date.now();
      try {
        const result = await this.gateway.ask(messages, {
          model: model.id,
          providerOrder: [model.provider],
          keepLast: 5,
          timeout: options.timeout || 2000, // 2s timeout per model
        });
        
        return {
          success: true,
          model: model.id,
          content: result.content || result.text || '',
          latency: Date.now() - modelStart,
          provider: model.provider,
        };
      } catch (error) {
        // Reject failed attempts so Promise.race skips them
        throw {
          success: false,
          model: model.id,
          error: error.message,
          latency: Date.now() - modelStart,
        };
      }
    });

    // True race: return first successful result
    try {
      const winner = await Promise.race(promises);
      return {
        content: winner.content,
        model: `combo-race (${winner.model})`,
        provider: 'combo',
        latency: Date.now() - startTime,
        strategy: 'race',
        winner: winner.model,
      };
    } catch (firstError) {
      // If first fails, wait for any success
      const results = await Promise.allSettled(promises);
      const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      if (successful.length > 0) {
        const winner = successful[0];
        return {
          content: winner.content,
          model: `combo-race (${winner.model})`,
          provider: 'combo',
          latency: Date.now() - startTime,
          strategy: 'race-fallback',
          winner: winner.model,
        };
      }

      // All models failed
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason);
      
      throw new Error(`All combo models failed: ${errors.map(e => `${e.model}: ${e.error}`).join(', ')}`);
    }
  }
}

module.exports = { ComboRaceModel };
