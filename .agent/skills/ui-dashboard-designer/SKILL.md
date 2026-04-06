---
name: ui-dashboard-designer
description: Генерация pixel-perfect интерфейсов по дизайн-токенам — от токенов к React компонентам
tags: [ui-generation, design-tokens, react, pixel-perfect]
triggers:
  - "создай ui"
  - "ui-dashboard-designer"
  - "generate component"
  - "дизайн токены"
---

# UI Dashboard Designer Skill

## Concept

Генерирует React компоненты из дизайн-токенов:
- Цвета
- Типографика
- Отступы
- Тени
- Анимации

**Pipeline:**
1. **Read Tokens** — загрузка дизайн-токенов
2. **Generate Styles** — CSS/Tailwind из токенов
3. **Build Components** — React компоненты
4. **Test** — визуальные тесты
5. **Export** — готовые файлы

## Architecture

```
.agent/skills/ui-dashboard-designer/
├── SKILL.md              # Этот файл
├── scripts/
│   ├── generate.sh       # Главный скрипт
│   └── tokens.json       # Дизайн-токены
├── data/
│   └── SESSION.json      # Состояние
└── generated/            # Сгенерированные компоненты
    └── <name>/
        ├── Component.jsx
        ├── Component.css
        └── stories.jsx
```

## Design Tokens

```json
{
  "colors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "background": "#0F172A",
    "surface": "#1E293B",
    "text": "#F8FAFC"
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px",
    "xl": "32px"
  },
  "typography": {
    "fontFamily": "Inter, system-ui, sans-serif",
    "fontSize": {
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px"
    }
  }
}
```

## Usage

### Генерация компонента

```bash
# Базовый вызов
.agent/skills/ui-dashboard-designer/scripts/generate.sh <name> <type>

# Пример: Status Card
.agent/skills/ui-dashboard-designer/scripts/generate.sh StatusCard card

# Пример: Metrics Dashboard
.agent/skills/ui-dashboard-designer/scripts/generate.sh MetricsDashboard dashboard
```

## Component Types

| Type | Description | Example |
|------|-------------|---------|
| card | Карточка с данными | StatusCard, MetricCard |
| dashboard | Панель с виджетами | MetricsDashboard |
| table | Таблица с данными | LogsTable |
| chart | График/диаграмма | RamChart |
| form | Форма ввода | SettingsForm |
| button | Кнопка | PrimaryButton |
| input | Поле ввода | SearchInput |
| modal | Модальное окно | ConfirmModal |

## Example: Status Card

**Input:**
```bash
generate.sh StatusCard card
```

**Output:**
```jsx
// StatusCard.jsx
export function StatusCard({ status, label, icon }) {
  return (
    <div className="status-card" data-status={status}>
      <span className="icon">{icon}</span>
      <div className="content">
        <h3>{label}</h3>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>
    </div>
  );
}
```

```css
/* StatusCard.css */
.status-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.badge-ok { background: #10B981; color: white; }
.badge-warning { background: #F59E0B; color: white; }
.badge-error { background: #EF4444; color: white; }
```

## Integration with Health Dashboard

Существующий health-dashboard (`:5175`) использует:
- Vite + React
- 9 tabs с мониторингом
- WebSocket + HTTP fallback

Новые компоненты можно интегрировать:
```bash
# Скопировать в dashboard
cp .agent/skills/ui-dashboard-designer/generated/StatusCard/* health-dashboard-v5/src/components/
```

## Fallback Strategy

1. **Если генерация не удалась:**
   - Проверь дизайн-токены
   - Используй дефолтные токены
2. **Если стили сломаны:**
   - Проверь CSS переменные
   - Используй Tailwind fallback
3. **Если компонент не рендерится:**
   - Проверь импорты
   - Запусти `npm run dev` для проверки

## Benefits

- **Pixel-perfect:** Точное соответствие дизайн-токенам
- **Consistent:** Единая система дизайна
- **Reusable:** Компоненты переиспользуются
- **Testable:** Визуальные тесты включены

## Known Issues

- Требует Vite/React окружение
- CSS переменные должны быть определены
- Tailwind должен быть настроен
