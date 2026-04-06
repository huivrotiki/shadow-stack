// server/lib/combo-race.cjs — Race Strategy Combo Model
// Запускает несколько моделей параллельно, возвращает первый успешный ответ

class ComboRaceModel {
  constructor(gateway) {
    this.gateway = gateway;
    this.name = 'combo-race';
    
    // Топ-3 самых быстрых модели
    this.models = [
      { id: 'gr-llama8b', provider: 'groq', model: 'llama-3.1-8b-instant' },
      { id: 'gr-gpt-oss20', provider: 'groq', model: 'openai/gpt-oss-20b' },
      { id: 'gr-compound', provider: 'groq', model: 'groq/compound' },
    ];
  }

  async call(messages, options = {}) {
    const startTime = Date.now();
    
    // Создаём промисы для всех моделей
    const promises = this.models.map(async (model) => {
      try {
        const result = await this.gateway.ask(messages, {
          model: model.id,
          providerOrder: [model.provider],
          keepLast: 5,
          timeout: options.timeout || 5000,
        });
        
        return {
          success: true,
          model: model.id,
          content: result.content || result.text || '',
          latency: Date.now() - startTime,
          provider: model.provider,
        };
      } catch (error) {
        return {
          success: false,
          model: model.id,
          error: error.message,
          latency: Date.now() - startTime,
        };
      }
    });

    // Promise.race — возвращает первый успешный результат
    const results = await Promise.allSettled(promises);
    
    // Находим первый успешный ответ
    const successful = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value)
      .sort((a, b) => a.latency - b.latency);

    if (successful.length > 0) {
      const winner = successful[0];
      return {
        content: winner.content,
        model: `combo-race (${winner.model})`,
        provider: 'combo',
        latency: winner.latency,
        strategy: 'race',
        candidates: successful.length,
      };
    }

    // Все модели упали — возвращаем ошибку
    const errors = results
      .filter(r => r.status === 'fulfilled' && !r.value.success)
      .map(r => r.value);
    
    throw new Error(`All combo models failed: ${errors.map(e => `${e.model}: ${e.error}`).join(', ')}`);
  }
}

module.exports = { ComboRaceModel };
