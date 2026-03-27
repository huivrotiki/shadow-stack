import React, { useState } from 'react';

/**
 * Agent Cards — Glassmorphism control panel
 *
 * Extracted from shadow-stack-widget-1/app/agents/page.tsx
 * Converted to plain React JSX (no Next.js, no TypeScript).
 */

const AGENTS = [
  {
    id: 'local-qwen',
    name: 'Context Engine (Local)',
    role: 'Researcher',
    model: 'qwen:latest',
    status: 'online',
    description: 'Handles >5k long context tasks securely on-device.',
    color: '#10b981',
  },
  {
    id: 'groq-llama3',
    name: 'Logic Refactor (Groq)',
    role: 'Coder',
    model: 'llama-3-8b',
    status: 'online',
    description: 'Lightning fast execution for refactoring & fixes.',
    color: '#3b82f6',
  },
  {
    id: 'openrouter-gpt4',
    name: 'Universal Base',
    role: 'Generalist',
    model: 'gpt-4.1-mini',
    status: 'idle',
    description: 'Fallback agent for generic queries via API.',
    color: '#8b5cf6',
  },
];

const STATUS_STYLES = {
  online: {
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#10b981',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  active: {
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#3b82f6',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  idle: {
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.3)',
  },
  offline: {
    background: 'rgba(248, 113, 113, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(248, 113, 113, 0.3)',
  },
  busy: {
    background: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.idle;
  return (
    <span
      style={{
        ...style,
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {status}
    </span>
  );
}

function AgentCard({ agent }) {
  const isActive = agent.status === 'active';

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isActive
          ? '1px solid #3b82f6'
          : '1px solid rgba(51, 65, 85, 0.5)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: isActive ? '0 0 30px rgba(59, 130, 246, 0.2)' : 'none',
      }}
    >
      <StatusBadge status={agent.status} />

      <div
        style={{
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: agent.color,
        }}
      >
        {agent.role}
      </div>

      <h2
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: '#f8fafc',
        }}
      >
        {agent.name}
      </h2>

      <div
        style={{
          display: 'inline-block',
          fontFamily: "'Fira Code', monospace",
          background: 'rgba(0,0,0,0.3)',
          padding: '0.25rem 0.5rem',
          borderRadius: '6px',
          fontSize: '0.8rem',
          color: '#cbd5e1',
          marginBottom: '1.5rem',
        }}
      >
        {agent.model}
      </div>

      <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
        {agent.description}
      </p>
    </div>
  );
}

export default function AgentCards() {
  const [agents] = useState(AGENTS);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#020617',
        color: '#f8fafc',
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
        padding: '3rem',
        backgroundImage: [
          'radial-gradient(circle at 15% 50%, rgba(59, 130, 246, 0.15), transparent 25%)',
          'radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15), transparent 25%)',
        ].join(', '),
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            background: 'linear-gradient(to right, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem',
          }}
        >
          Agents Control
        </h1>
        <p
          style={{
            color: '#94a3b8',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          Monitor active agents and analyze real-time routing logic across
          Local, Groq, and OpenRouter engines.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
