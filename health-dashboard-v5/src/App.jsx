import { useState, useEffect, useRef } from 'react'

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161b22',
  border: '#1f2937',
  text: '#ffffff',
  dim: '#6b7280',
  blue: '#60a5fa',
  cyan: '#22d3ee',
  green: '#34d399',
  yellow: '#fbbf24',
  orange: '#f97316',
  red: '#f87171',
  purple: '#a78bfa',
  pink: '#f472b6',
}

// ═══════════════════════════════════════════════════════════════════
// SECTION TITLE — reusable component
// ═══════════════════════════════════════════════════════════════════
const SectionTitle = ({ title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
    <h2 style={{ 
      fontFamily: "'Cormorant Garamond', serif", 
      fontSize: '24px', 
      fontWeight: 700,
      color: C.text,
      whiteSpace: 'nowrap'
    }}>
      {title}
    </h2>
    <div style={{ flex: 1, borderTop: `1px solid ${C.border}` }} />
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// AI RADAR — Animated SVG
// ═══════════════════════════════════════════════════════════════════
const AIRadar = () => {
  const dots = [
    { cx: 260, cy: 130, color: C.green, delay: 0 },
    { cx: 310, cy: 220, color: C.red, delay: 0.3 },
    { cx: 150, cy: 280, color: C.blue, delay: 0.6 },
    { cx: 230, cy: 310, color: C.purple, delay: 0.9 },
    { cx: 120, cy: 170, color: C.yellow, delay: 1.2 },
    { cx: 320, cy: 160, color: C.green, delay: 1.5 },
    { cx: 170, cy: 100, color: C.red, delay: 1.8 },
    { cx: 280, cy: 280, color: C.blue, delay: 2.1 },
  ]
  
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
      <div style={{ fontSize: '10px', color: C.dim, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
        AI Radar — Agent Activity
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="400" height="400" viewBox="0 0 400 400">
          <style>{`
            @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes dotPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }
            .sweep-group { transform-origin: 200px 200px; animation: sweep 4s linear infinite; }
            .dot { animation: dotPulse 2s ease-in-out infinite; }
          `}</style>
          
          {/* Background */}
          <rect width="400" height="400" fill={C.bg} rx="8"/>
          
          {/* Concentric rings */}
          {[40, 80, 120, 160].map(r => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" stroke={C.border} strokeWidth="1"/>
          ))}
          
          {/* Crosshair */}
          <line x1="200" y1="40" x2="200" y2="360" stroke={C.border} strokeWidth="1"/>
          <line x1="40" y1="200" x2="360" y2="200" stroke={C.border} strokeWidth="1"/>
          <line x1="87" y1="87" x2="313" y2="313" stroke="#111827" strokeWidth="1"/>
          <line x1="313" y1="87" x2="87" y2="313" stroke="#111827" strokeWidth="1"/>
          
          {/* Sweep gradient */}
          <defs>
            <radialGradient id="sweepGrad" cx="0" cy="0" r="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={C.cyan} stopOpacity="0.5"/>
              <stop offset="100%" stopColor={C.cyan} stopOpacity="0"/>
            </radialGradient>
          </defs>
          <g className="sweep-group">
            <path d="M200,200 L200,40 A160,160 0 0,1 312,256 Z" fill="url(#sweepGrad)"/>
            <line x1="200" y1="200" x2="200" y2="40" stroke={C.cyan} strokeWidth="1.5" opacity="0.8"/>
          </g>
          
          {/* Animated dots */}
          {dots.map((d, i) => (
            <g key={i} className="dot" style={{ animationDelay: `${d.delay}s` }}>
              <circle cx={d.cx} cy={d.cy} r="10" fill={d.color} opacity="0.12"/>
              <circle cx={d.cx} cy={d.cy} r="4" fill={d.color} style={{ filter: `drop-shadow(0 0 5px ${d.color})` }}/>
            </g>
          ))}
          
          {/* Center */}
          <circle cx="200" cy="200" r="4" fill={C.cyan} style={{ filter: 'drop-shadow(0 0 8px #22d3ee)' }}/>
          <circle cx="200" cy="200" r="1.5" fill="white"/>
          
          {/* Range labels */}
          {[
            { x: 205, y: 162, t: '40' },
            { x: 205, y: 122, t: '80' },
            { x: 205, y: 82, t: '120' },
            { x: 205, y: 44, t: '160' },
          ].map((l, i) => (
            <text key={i} x={l.x} y={l.y} fill="#374151" fontSize="9" fontFamily="monospace">{l.t}</text>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', fontSize: '11px' }}>
        <span style={{ color: C.green }}>● Active: 3</span>
        <span style={{ color: C.yellow }}>● Idle: 1</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SEGMENTED RAM BAR
// ═══════════════════════════════════════════════════════════════════
const SegBar = ({ filled, total = 16, label, value }) => {
  const getColor = (i) => {
    const pct = filled / total
    if (i >= filled) return '#1f2937'
    if (pct > 0.85) return C.red
    if (pct > 0.65) return C.yellow
    if (pct > 0.40) return C.blue
    return C.green
  }
  
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ color: C.dim, fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color: C.text, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
      </div>
      <div style={{ display: 'flex', gap: '2px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: '12px',
            height: '20px',
            borderRadius: '2px',
            backgroundColor: getColor(i),
            transition: 'background-color 0.3s'
          }}/>
        ))}
      </div>
    </div>
  )
}

// RAM Monitor with SegBars
const RAMMonitor = () => (
  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
    <div style={{ fontSize: '10px', color: C.dim, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
      System Resources
    </div>
    <SegBar label="RAM" value="5.4 / 8.0 GB" filled={11} />
    <SegBar label="CPU" value="42%" filled={7} total={16} />
    <SegBar label="Bandwidth" value="36 GB/s" filled={14} total={16} />
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// HEADER — Rebuilt
// ═══════════════════════════════════════════════════════════════════
const Header = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-GB', { hour12: false }))
  
  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false })), 1000)
    return () => clearInterval(t)
  }, [])
  
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 32px',
      borderBottom: `1px solid ${C.border}`,
      background: C.surface
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontSize: '18px',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: "'Cormorant Garamond', serif"
        }}>
          Shadow Stack
        </span>
        <span style={{ color: C.dim, fontSize: '13px', fontFamily: "'JetBrains Mono', monospace" }}>
          Health Monitor
        </span>
      </div>
      
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: C.green,
          animation: 'pulse 2s infinite',
          boxShadow: '0 0 6px #34d399'
        }}/>
        <span style={{ color: C.green, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 'bold', letterSpacing: '0.1em' }}>
          ONLINE
        </span>
        <span style={{ color: C.dim, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", marginLeft: '8px' }}>
          {time}
        </span>
      </div>
      
      {/* Version */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: '4px', padding: '4px 12px' }}>
        <span style={{ color: C.dim, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>v5.0</span>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TABS — 9 tabs exactly
// ═══════════════════════════════════════════════════════════════════
const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: '00. Overview' },
    { id: 'radar', label: '01. AI Radar' },
    { id: 'state', label: '02. State Machine' },
    { id: 'router', label: '03. Router' },
    { id: 'ram', label: '04. RAM & Risk' },
    { id: 'phases', label: '05. Phases' },
    { id: 'integ', label: '06. Integrations' },
    { id: 'logs', label: '07. Logs' },
    { id: 'settings', label: '08. Settings' },
  ]
  
  return (
    <nav style={{ display: 'flex', gap: '4px', padding: '16px 32px', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            background: activeTab === tab.id ? C.surface2 : 'transparent',
            border: activeTab === tab.id ? `1px solid ${C.blue}` : '1px solid transparent',
            color: activeTab === tab.id ? C.blue : C.dim,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s'
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SERVICE CARD
// ═══════════════════════════════════════════════════════════════════
const ServiceCard = ({ name, port, status }) => {
  const isOnline = status === 'online'
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      padding: '20px',
      borderRadius: '12px',
      transition: 'all 0.3s',
      cursor: 'pointer'
    }}>
      <div style={{ fontSize: '10px', color: C.dim, textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
        {name}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '28px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: C.text }}>
          :{port}
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '12px',
          background: isOnline ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)'
        }}>
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isOnline ? C.green : C.red,
            boxShadow: isOnline ? `0 0 6px ${C.green}` : `0 0 6px ${C.red}`,
            animation: isOnline ? 'pulse 2s infinite' : 'none'
          }}/>
          <span style={{ fontSize: '11px', color: isOnline ? C.green : C.red, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// FLOW NODE — Reusable
// ═══════════════════════════════════════════════════════════════════
const FlowNode = ({ label, color = C.cyan }) => (
  <div style={{
    background: C.surface,
    border: `1px solid ${color}`,
    borderRadius: '10px',
    padding: '16px 20px',
    fontWeight: 600,
    textAlign: 'center',
    minWidth: '140px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    boxShadow: `0 0 12px ${color}22`,
    color: C.text
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
  >
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, margin: '0 auto 8px', boxShadow: `0 0 6px ${color}` }}/>
    {label}
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// TAB COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// Overview Tab
const OverviewTab = () => {
  const services = [
    { name: 'Express API', port: '3001', status: 'online' },
    { name: 'Telegram Bot', port: '4000', status: 'online' },
    { name: 'OpenClaw', port: '18789', status: 'online' },
    { name: 'Shadow Router', port: '3002', status: 'online' },
    { name: 'Ollama', port: '11434', status: 'online' },
  ]
  
  return (
    <div style={{ padding: '32px' }}>
      {/* Top Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '32px' }}>
        <AIRadar />
        <RAMMonitor />
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '10px', color: C.dim, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
            Quick Stats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Services', value: '5/5', color: C.green },
              { label: 'Uptime', value: '2h 34m', color: C.cyan },
              { label: 'API Calls', value: '1,247', color: C.blue },
              { label: 'Cost Today', value: '$0.042', color: C.purple },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: C.dim, fontSize: '13px' }}>{s.label}</span>
                <span style={{ color: s.color, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Request Pipeline */}
      <div style={{ marginBottom: '32px' }}>
        <SectionTitle title="Request Flow Pipeline" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {['USER', 'OpenClaw', 'Router', 'Ollama/OpenRouter', 'Response'].map((label, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FlowNode label={label} color={i === 0 ? C.blue : i === arr.length - 1 ? C.green : C.cyan} />
              {i < arr.length - 1 && <span style={{ color: C.dim, fontSize: '20px' }}>→</span>}
            </div>
          ))}
        </div>
      </div>
      
      {/* Services Grid */}
      <div>
        <SectionTitle title="System Overview" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
          {services.map(s => (
            <ServiceCard key={s.name} {...s} />
          ))}
        </div>
      </div>
    </div>
  )
}

// AI Radar Tab
const RadarTab = () => (
  <div style={{ padding: '32px' }}>
    <SectionTitle title="AI Radar — Full View" />
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
      <div style={{ transform: 'scale(1.2)' }}>
        <AIRadar />
      </div>
    </div>
  </div>
)

// State Machine Tab
const StateMachineTab = () => {
  const nodes = [
    { label: 'Realtime Raw Context', color: C.blue },
    { label: 'Semantic Understanding', color: C.purple },
    { label: 'Curated Context', color: C.green },
  ]
  
  return (
    <div style={{ padding: '32px' }}>
      <SectionTitle title="State Machine" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginTop: '40px' }}>
        {nodes.map((node, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${node.color}`,
              borderRadius: '10px',
              padding: '16px 20px',
              fontWeight: 600,
              textAlign: 'center',
              minWidth: '180px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              boxShadow: `0 0 12px ${node.color}22`
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: node.color, margin: '0 auto 8px', boxShadow: `0 0 6px ${node.color}` }}/>
              <span style={{ color: C.text, fontSize: '13px' }}>{node.label}</span>
            </div>
            {i < arr.length - 1 && <span style={{ color: C.dim, fontSize: '24px', fontWeight: 300 }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// Router Tab
const RouterTab = () => {
  const [logs, setLogs] = useState([
    { time: '21:04:17', provider: 'Ollama:qwen2.5:3b', latency: '12ms', cost: '$0.0000' },
    { time: '21:04:16', provider: 'OpenRouter:gemini-flash', latency: '89ms', cost: '$0.0001' },
    { time: '21:04:15', provider: 'OpenRouter:claude-haiku', latency: '156ms', cost: '$0.0003' },
    { time: '21:04:14', provider: 'Ollama:qwen2.5:3b', latency: '15ms', cost: '$0.0000' },
  ])
  const [input, setInput] = useState('')
  
  const handleRoute = () => {
    if (!input.trim()) return
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const provider = input.startsWith('/local') ? 'Ollama:qwen2.5:3b' : input.startsWith('/premium') ? 'OpenRouter:claude-sonnet' : 'OpenRouter:gemini-flash'
    const latency = input.startsWith('/local') ? '12ms' : input.startsWith('/premium') ? '210ms' : '89ms'
    const cost = input.startsWith('/local') ? '$0.0000' : input.startsWith('/premium') ? '$0.0030' : '$0.0001'
    setLogs([{ time, provider, latency, cost }, ...logs])
    setInput('')
  }
  
  return (
    <div style={{ padding: '32px' }}>
      <SectionTitle title="Router Simulator" />
      <div style={{
        background: '#000',
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px',
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {/* Terminal header */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.red }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.yellow }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: C.green }} />
          <span style={{ color: C.dim, marginLeft: '8px', fontSize: '11px' }}>shadow-router@v5.0</span>
        </div>
        {/* Logs */}
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px 80px', gap: '16px', padding: '8px 0', borderBottom: `1px solid ${C.border}`, color: C.green }}>
            <span style={{ color: C.dim }}>[{log.time}]</span>
            <span>→ {log.provider}</span>
            <span style={{ color: C.yellow }}>{log.latency}</span>
            <span style={{ color: C.cyan }}>{log.cost}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleRoute()}
          placeholder="Enter prompt (use /local, /cheap, /premium)"
          style={{
            flex: 1,
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '10px',
            padding: '14px 20px',
            color: C.green,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button onClick={handleRoute} style={{
          padding: '14px 32px',
          background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
          borderRadius: '10px',
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '14px'
        }}>
          Route
        </button>
      </div>
    </div>
  )
}

// RAM & Risk Tab
const RAMTab = () => (
  <div style={{ padding: '32px' }}>
    <SectionTitle title="RAM & Risk Analysis" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <RAMMonitor />
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '10px', color: C.dim, textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '1px' }}>
          Risk Assessment
        </div>
        {[
          { label: 'Memory Leak', level: 'Low', color: C.green },
          { label: 'API Rate Limit', level: 'Medium', color: C.yellow },
          { label: 'Disk Space', level: 'Low', color: C.green },
          { label: 'Network Latency', level: 'High', color: C.red },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.text, fontSize: '13px' }}>{r.label}</span>
            <span style={{ color: r.color, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{r.level}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// Phases Tab
const PhasesTab = () => {
  const phases = [
    { phase: 'Phase 1: Init', status: 'DONE', color: C.green },
    { phase: 'Phase 2: Routing', status: 'ACTIVE', color: C.cyan },
    { phase: 'Phase 3: Escalation', status: 'IDLE', color: C.dim },
    { phase: 'Phase 4: Deploy', status: 'IDLE', color: C.dim },
  ]
  
  return (
    <div style={{ padding: '32px' }}>
      <SectionTitle title="System Phases" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
        {phases.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '16px'
          }}>
            <span style={{ color: C.text, fontFamily: "'JetBrains Mono', monospace", fontSize: '14px' }}>{p.phase}</span>
            <span style={{
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '12px',
              color: p.color,
              border: `1px solid ${p.color}`,
              boxShadow: p.status === 'ACTIVE' ? `0 0 8px ${p.color}66` : 'none'
            }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Integrations Tab
const IntegrationsTab = () => {
  const integrations = [
    { name: 'Ollama', status: 'ACTIVE', color: C.green, port: ':11434' },
    { name: 'OpenRouter', status: 'ACTIVE', color: C.cyan, port: 'cloud' },
    { name: 'OpenClaw', status: 'ACTIVE', color: C.green, port: ':18789' },
    { name: 'Telegram Bot', status: 'ACTIVE', color: C.blue, port: ':4000' },
    { name: 'Shadow Router', status: 'ACTIVE', color: C.purple, port: ':3002' },
    { name: 'Vercel', status: 'ACTIVE', color: C.blue, port: 'cloud' },
  ]
  
  return (
    <div style={{ padding: '32px' }}>
      <SectionTitle title="API Integrations" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
        {integrations.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: C.text, fontSize: '14px', fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: C.dim, fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>{p.port}</div>
            </div>
            <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, padding: '4px 10px', borderRadius: '12px', color: p.color, border: `1px solid ${p.color}55` }}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Logs Tab
const LogsTab = () => {
  const logs = [
    { time: '23:04:17', level: 'INFO', msg: 'Express API listening on :3001' },
    { time: '23:04:16', level: 'INFO', msg: 'OpenClaw connected to 15 providers' },
    { time: '23:04:15', level: 'SUCCESS', msg: 'Telegram Bot started (polling mode)' },
    { time: '23:04:14', level: 'INFO', msg: 'Shadow Router initialized on :3002' },
    { time: '23:04:13', level: 'INFO', msg: 'Ollama models: qwen2.5:3b, llama3.2' },
    { time: '23:04:12', level: 'WARNING', msg: 'OpenRouter API key not set in env' },
    { time: '23:04:11', level: 'SUCCESS', msg: 'Health Dashboard v5.0 deployed' },
  ]
  
  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return C.red
      case 'WARNING': return C.yellow
      case 'SUCCESS': return C.green
      default: return C.blue
    }
  }
  
  return (
    <div style={{ padding: '32px' }}>
      <SectionTitle title="System Logs" />
      <div style={{
        background: '#000',
        border: `1px solid ${C.border}`,
        borderRadius: '12px',
        padding: '20px',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '13px'
      }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ color: C.dim }}>{log.time}</span>
            <span style={{
              color: getLevelColor(log.level),
              background: `${getLevelColor(log.level)}20`,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600
            }}>
              {log.level}
            </span>
            <span style={{ color: C.text }}>{log.msg}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Settings Tab
const SettingsTab = () => (
  <div style={{ padding: '32px' }}>
    <SectionTitle title="Settings" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.text }}>API Configuration</div>
        {[
          { label: 'Ollama URL', value: 'localhost:11434', color: C.cyan },
          { label: 'OpenClaw URL', value: 'localhost:18789', color: C.cyan },
          { label: 'OpenRouter Key', value: 'sk-or-v1-***...***', color: C.green },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: C.dim, fontSize: '13px' }}>{s.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: s.color }}>{s.value}</span>
          </div>
        ))}
      </div>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '24px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: C.text }}>Telegram Bot</div>
        {[
          { label: 'Status', value: '● Online', color: C.green },
          { label: 'Mode', value: 'Polling', color: C.cyan },
          { label: 'Chat ID', value: '8115830507', color: C.purple },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ color: C.dim, fontSize: '13px' }}>{s.label}</span>
            <span style={{ fontSize: '12px', color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
)

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  
  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />
      case 'radar': return <RadarTab />
      case 'state': return <StateMachineTab />
      case 'router': return <RouterTab />
      case 'ram': return <RAMTab />
      case 'phases': return <PhasesTab />
      case 'integ': return <IntegrationsTab />
      case 'logs': return <LogsTab />
      case 'settings': return <SettingsTab />
      default: return <OverviewTab />
    }
  }
  
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.5); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${C.bg}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.dim}; }
      `}</style>
      <Header />
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderTab()}
    </div>
  )
}
