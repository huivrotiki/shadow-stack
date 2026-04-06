# CLAUDE-HEALTH-DASHBOARD.md — Health Dashboard v5.0 Spec
# Supplement to CLAUDE.md
# Last updated: 2026-03-27

---

## HEALTH DASHBOARD v5.0 SPEC

File: health-dashboard-v5/src/App.jsx
Deploy: Vercel → https://health-dashboard-v5.vercel.app

### HARD CONSTRAINTS (non-negotiable)

**EXACTLY 9 tabs in this order:**
```
0: Overview
1: AI Radar
2: State Machine
3: Router
4: RAM & Risk
5: Phases
6: Integrations
7: Logs
8: Settings
```

### Required Components

1. **Header** — py-[24px] px-[32px], gradient logo, [ONLINE] pulse dot, v5.0 badge
2. **AI Radar** — SVG only, 4 rings, crosshair, sweep animation, 8 pulsing dots
3. **RAM bars** — SegBar component, 16 segments, color-coded green→red
4. **Flow nodes** — rounded-[10px], hover:scale-[1.05], transition-transform
5. **Section titles** — Cormorant Garamond + flex-1 border-t
6. **NO placeholder tabs** — every tab renders real content

### Colors
```
--bg-primary:  #0A0A0A
--bg-surface:  #0D1117
--bg-elevated: #161B22
--blue:        #60a5fa
--green:       #34d399
--purple:      #a78bfa
--cyan:        #22d3ee
--red:         #f87171
--yellow:      #fbbf24
```

### Section Title Pattern (ALWAYS use this)
```jsx
const SectionTitle = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
    <h2 style={{ 
      fontFamily: "'Cormorant Garamond', serif", 
      fontSize: '24px', 
      fontWeight: 700,
      color: '#ffffff'
    }}>
      {title}
    </h2>
    <div style={{ flex: 1, borderTop: '1px solid #1f2937' }} />
  </div>
)
```

### AI Radar SVG Pattern
```jsx
const AIRadar = () => (
  <svg width="400" height="400" viewBox="0 0 400 400">
    <style>{`
      @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
      .sweep-group { transform-origin: 200px 200px; animation: sweep 4s linear infinite; }
      .dot { animation: dotPulse 2s ease-in-out infinite; }
    `}</style>
    {/* 4 concentric rings */}
    {/* Crosshair lines */}
    {/* Sweep with gradient */}
    {/* 8 pulsing dots */}
  </svg>
)
```

### SegBar Component Pattern
```jsx
const SegBar = ({ filled, total = 16, label, value }) => {
  const getColor = (i) => {
    const pct = filled / total
    if (i >= filled) return '#1f2937'  // gray-800
    if (pct > 0.85) return '#f87171'   // red
    if (pct > 0.65) return '#fbbf24'   // yellow
    if (pct > 0.40) return '#60a5fa'   // blue
    return '#34d399'                   // green
  }
  // render 16 blocks
}
```

### Deploy Checklist
- [ ] npm run build passes locally
- [ ] npm run preview works (check all 9 tabs)
- [ ] AI Radar SVG animates in preview
- [ ] vercel.json: { "framework": "vite", "outputDirectory": "dist" }
- [ ] vite.config: base: '/'

### vercel.json (must exist)
```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## SERVICES STATUS REFERENCE

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Express API | 3001 | /health |
| Telegram Bot | 4000 | /health |
| OmniRoute | 20130 | /v1/models |
| Shadow Router | 3002 | /health |
| Ollama | 11434 | /api/version |

### Check Commands
```bash
curl -s http://localhost:3001/health
curl -s http://localhost:4000/health
curl -s http://localhost:20130/v1/models
curl -s http://localhost:3002/health
curl -s http://localhost:11434/api/version
```