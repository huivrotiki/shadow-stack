import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import designTokens from '../../design-tokens.json';
import SpeedControl from './dashboard/SpeedControl';
import ModelSelector from './dashboard/ModelSelector';
import { CliTerminalGrid } from './dashboard/CliTerminal';
import OmniRoutePanel from './dashboard/OmniRoutePanel';
import { Toast } from './design/Toast';
import CustomCursor from './design/CustomCursor';
const NeonOrb = lazy(() => import('./design/NeonOrb'));
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

// Polling hook for live updates (replaces WebSocket for Vercel serverless compatibility)
function useHealthPolling() {
  const [healthData, setHealthData] = useState(null);
  const [history, setHistory] = useState([]); // keep last 20 snapshots
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const base = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${base}/api/health`);
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json();
            setHealthData(data);
            setHistory(prev => [...prev.slice(-19), { timestamp: Date.now(), data }]);
            setConnected(true);
          } else {
            setConnected(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error('Health poll error:', e);
          setConnected(false);
        }
      }
    };
    
    poll();
    const interval = setInterval(poll, 7000); // Poll every 7 seconds
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  
  return { healthData, history, connected };
}
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);

      return () => {
        clearInterval(pingInterval);
        ws.close();
      };
    } catch (e) {
      console.error('WS connection error:', e);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup?.();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  // Fallback: fetch via HTTP if WebSocket not connected
  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/health');
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        // Also seed history with current snapshot
        setHistory(prev => {
          const newHistory = [...prev, { timestamp: Date.now(), data }];
          return newHistory.slice(-20);
        });
      }
    } catch (e) {
      console.error('HTTP fetch error:', e);
    }
  }, []);

  return { healthData, history, connected, fetchHealth };
}

// Status badge component
function StatusBadge({ status }) {
  const colors = {
    ONLINE: 'bg-green-500/20 text-green-400 border-green-500/30',
    IDLE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    OFFLINE: 'bg-red-500/20 text-red-400 border-red-500/30',
    CIRCUIT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };

  const icons = {
    ONLINE: '🟢',
    IDLE: '🟡',
    OFFLINE: '🔴',
    CIRCUIT: '🟠',
  };

  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-mono ${colors[status] || colors.OFFLINE}`}>
      {icons[status] || '⚪'} {status}
    </span>
  );
}

// Trend indicator
function TrendIndicator({ trend }) {
  if (trend === 'up' || trend === 'down') {
    const Icon = trend === 'up' ? TrendingUp : TrendingDown;
    const color = trend === 'up' ? 'text-green-400' : 'text-red-400';
    return <Icon className={`w-3 h-3 inline ${color}`} />;
  }
  return <Minus className="w-3 h-3 inline text-gray-500" />;
}

// Memoized provider row for performance
function ProviderRow({ provider, index }) {
  return (
    <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-900/50">
      <td className="py-3 px-3 font-mono text-gray-400">{provider.priority.toFixed(1)}</td>
      <td className="py-3 px-3">
        <div className="font-medium">{provider.name}</div>
        <div className="text-xs text-gray-500">{provider.model}</div>
      </td>
      <td className="py-3 px-3">
        <StatusBadge status={provider.status} />
      </td>
      <td className="py-3 px-3 font-mono">
        {provider.success_rate}% <TrendIndicator trend={provider.trend_success} />
      </td>
      <td className="py-3 px-3 font-mono">
        {provider.latency_ms ? `${provider.latency_ms}ms` : 'N/A'} <TrendIndicator trend={provider.trend_latency} />
      </td>
      <td className="py-3 px-3 font-mono text-gray-400">{provider.window_context}</td>
      <td className="py-3 px-3 text-gray-400">{provider.last_used || '-'}</td>
      <td className="py-3 px-3 font-mono">
        {provider.cost_per_mtok === 0 ? (
          <span className="text-green-400">$0</span>
        ) : (
          <span className="text-gray-400">${provider.cost_per_mtok}/M</span>
        )}
      </td>
    </tr>
  );
}

// Alert level component
function AlertLevel({ level, icon, message }) {
  const styles = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-300',
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };

  return (
    <div className={`px-3 py-2 rounded border text-sm ${styles[level] || styles.info}`}>
      <span className="mr-2">{icon}</span>
      {message}
    </div>
  );
}

// Main Health Dashboard Component
export default function HealthDashboard({ onClose }) {
  // Design tokens bootstrap
  const dsColors = designTokens?.colors || {};
  const dsBodyFont = designTokens?.typography?.body || 'system-ui, sans-serif';
  // Theme list for Cycle 2 quick UI polish
  const THEMES = [
    { name: 'Midnight Galaxy', colors: { bg: '#0d1117', surface: '#161b22', surface2: '#1c2333', border: '#30363d', text: '#e6edf3', textDim: '#8b949e', blue: '#58a6ff', green: '#3fb950', orange: '#f0883e' } },
    { name: 'Ocean Depths', colors: { bg: '#0b1a2b', surface: '#132033', surface2: '#1a2a3a', border: '#1e3a57', text: '#e8f0f7', textDim: '#7a9bb6', blue: '#4fa3ff', green: '#2fb75a', orange: '#e07a2a' } },
    { name: 'Modern Minimalist', colors: { bg: '#0f1115', surface: '#171a1f', surface2: '#1e232a', border: '#2b323b', text: '#eef2f6', textDim: '#9aa6b2', blue: '#5b9bd5', green: '#4caf50', orange: '#ff7043' } }
  ];
  const [themeIndex, setThemeIndex] = useState(0);
  const currentTheme = THEMES[themeIndex] || THEMES[0];
  const dsColorsTheme = currentTheme.colors;
  const dsVars = {
    '--ds-bg': dsColorsTheme.bg,
    '--ds-surface': dsColorsTheme.surface,
    '--ds-surface2': dsColorsTheme.surface2,
    '--ds-border': dsColorsTheme.border,
    '--ds-text': dsColorsTheme.text,
    '--ds-text-dim': dsColorsTheme.textDim,
    '--ds-blue': dsColorsTheme.blue,
    '--ds-green': dsColorsTheme.green,
    '--ds-orange': dsColorsTheme.orange
  };
  const rootStyle = {
    background: dsColorsTheme.bg,
    color: dsColorsTheme.text,
    fontFamily: dsBodyFont
  };
  // (duplicate dsVars block removed to keep a single theme var injection)
  const { healthData, history, connected, fetchHealth } = useHealthWebSocket();
  const [activeTab, setActiveTab] = useState('overview');
  const [statsPeriod, setStatsPeriod] = useState('hour');
  const [cleaning, setCleaning] = useState(false);

  // Cleanup handler
  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const res = await fetch('http://localhost:3001/api/health/cleanup', {
        method: 'POST',
      });
      if (res.ok) {
        const result = await res.json();
        alert(`Cleanup complete: ${result.deleted?.length || 0} files deleted`);
        fetchHealth();
      }
    } catch (e) {
      console.error('Cleanup error:', e);
    }
    setCleaning(false);
  };

  // Refresh handler
  const handleRefresh = () => {
    fetchHealth();
  };

  if (!healthData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
          <p className="text-gray-400">Loading health data...</p>
          <button
            onClick={fetchHealth}
            className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded"
          >
            Try HTTP Fetch
          </button>
        </div>
      </div>
    );
  }

  const { system, providers, recent, alerts, savings } = healthData;

  return (
    <>
      {/* Cinematic background (cyberbabyangel port) */}
      <Suspense fallback={null}>
        <NeonOrb bgColor="#060606" orbColor="#e8e4df" noiseVal={0.18} />
      </Suspense>
      <div className="grain" aria-hidden="true" />
      <Toast />
      <CustomCursor />

    <div style={{...rootStyle, ...dsVars}} className="min-h-screen text-white relative" data-dashboard-root>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 text-cyan-400" />
                <h1 className="text-xl font-bold">SHADOW STACK ORCHESTRATOR v5.1</h1>
              </div>
              <span className="text-xs text-gray-500">LIVE STATUS</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                {connected ? (
                  <><Wifi className="w-4 h-4 text-green-400" /> <span className="text-green-400">Live</span></>
                ) : (
                  <><WifiOff className="w-4 h-4 text-red-400" /> <span className="text-red-400">Offline</span></>
                )}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 rounded hover:bg-gray-800 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setThemeIndex((i) => (i + 1) % (THEMES?.length || 1))}
                className="ml-2 p-2 rounded bg-gray-800 hover:bg-gray-700 text-sm"
                title={`Switch theme: ${currentTheme?.name ?? ''}`}
              >
                Theme: {currentTheme?.name ?? 'Theme'}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">
            {new Date(healthData.timestamp).toLocaleString()} — {system.hostname}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2" role="tablist" aria-label="Health dashboard sections">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'providers', label: 'Providers' },
            { id: 'activity', label: 'Activity' },
            { id: 'alerts', label: `Alerts (${alerts?.length || 0})` },
          ].map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* SYSTEM METRICS */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MemoryStick className="w-5 h-5 text-cyan-400" />
            SYSTEM METRICS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* RAM */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase">RAM</span>
                <span className={`text-lg font-bold ${
                  system.ram.status === 'ok' ? 'text-green-400' :
                  system.ram.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {system.ram.percent}%
                </span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {system.ram.used_mb}<span className="text-sm text-gray-500">/{system.ram.total_mb}MB</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    system.ram.status === 'ok' ? 'bg-green-500' :
                    system.ram.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${system.ram.percent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Free: {system.ram.free_mb}MB
              </div>
            </div>

            {/* CPU */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase">CPU</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {system.cpu.percent}%
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-purple-500"
                  style={{ width: `${system.cpu.percent}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {system.cpu.cores} cores
              </div>
            </div>

            {/* Uptime */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase">Uptime</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold mb-1">
                {system.uptime.formatted}
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(system.uptime.seconds / 3600)} hours
              </div>
            </div>

            {/* Disk */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono uppercase">DISK</span>
                <HardDrive className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-lg font-bold mb-1">
                {system.disk.logs_mb}MB
              </div>
              <div className="text-xs text-gray-500">
                Logs ({system.disk.debug_files} debug screenshots)
              </div>
            </div>
          </div>

          {/* Queue Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-500 block">Queue</span>
              <span className="text-lg font-mono">0/3</span>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-500 block">Active</span>
              <span className="text-lg font-mono">0</span>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-500 block">Browser Tabs</span>
              <span className="text-lg font-mono">0/1</span>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
              <span className="text-xs text-gray-500 block">Platform</span>
              <span className="text-lg font-mono">{system.platform}/{system.arch}</span>
            </div>
          </div>
        </section>

        {/* PROVIDERS STATUS */}
        {(activeTab === 'overview' || activeTab === 'providers') && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              PROVIDERS STATUS (Smart Cascade)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs font-mono uppercase border-b border-gray-800">
                    <th className="text-left py-2 px-3">PRI</th>
                    <th className="text-left py-2 px-3">PROVIDER</th>
                    <th className="text-left py-2 px-3">STATUS</th>
                    <th className="text-left py-2 px-3">SUCCESS</th>
                    <th className="text-left py-2 px-3">LATENCY</th>
                    <th className="text-left py-2 px-3">CONTEXT</th>
                    <th className="text-left py-2 px-3">LAST USED</th>
                    <th className="text-left py-2 px-3">COST</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p, i) => (
                    <ProviderRow provider={p} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* RECENT ACTIVITY */}
        {(activeTab === 'overview' || activeTab === 'activity') && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              RECENT ACTIVITY (Last {recent?.length || 0})
            </h2>
            {recent && recent.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs font-mono uppercase border-b border-gray-800">
                      <th className="text-left py-2 px-3">TIME</th>
                      <th className="text-left py-2 px-3">PROVIDER</th>
                      <th className="text-left py-2 px-3">STATUS</th>
                      <th className="text-left py-2 px-3">LATENCY</th>
                      <th className="text-left py-2 px-3">PROMPT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={r.id || i} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                        <td className="py-2 px-3 font-mono text-gray-400">{r.time}</td>
                        <td className="py-2 px-3">{r.provider}</td>
                        <td className="py-2 px-3">{r.status}</td>
                        <td className="py-2 px-3 font-mono">{r.latency_ms}ms</td>
                        <td className="py-2 px-3 text-gray-400 truncate max-w-[200px]">{r.prompt_preview}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">No recent activity</div>
            )}
          </section>
        )}

        {/* SAVINGS TRACKER */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-400" />
            SAVINGS TRACKER
          </h2>
          <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-800/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-green-400">{savings.requests_today}</div>
                <div className="text-sm text-gray-400">Total Requests</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-300">{savings.free_requests}</div>
                <div className="text-sm text-gray-400">Free Requests</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-red-400">${savings.est_cost_gpt4o}</div>
                <div className="text-sm text-gray-400">Est. GPT-4o Cost</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">{savings.saved_percent}%</div>
                <div className="text-sm text-gray-400">Saved</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              You saved <span className="text-green-400 font-bold">${savings.saved_amount}</span> by using free providers
            </div>
          </div>
        </section>

        {/* ALERTS */}
        {(activeTab === 'overview' || activeTab === 'alerts') && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              ALERTS & WARNINGS
            </h2>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <AlertLevel key={i} {...alert} />
                ))}
              </div>
            ) : (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-green-300">
                <CheckCircle className="w-5 h-5 inline mr-2" />
                All systems normal — no alerts
              </div>
            )}
          </section>
        )}

        {/* ACTIONS */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              REFRESH
            </button>
            <button
              onClick={() => setStatsPeriod('hour')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                statsPeriod === 'hour' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Hourly
            </button>
            <button
              onClick={() => setStatsPeriod('day')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                statsPeriod === 'day' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              Daily
            </button>
            <button
              onClick={handleCleanup}
              disabled={cleaning}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {cleaning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              CLEAN
            </button>
          </div>
        </section>

        {/* ─── Shadow Router extensions (cyberbabyangel design) ──────────────── */}
        <section id="router-controls" className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpeedControl />
            <ModelSelector />
          </div>
        </section>

        <section id="omniroute-mirror" className="max-w-7xl mx-auto px-4 py-6">
          <OmniRoutePanel />
        </section>

        <section id="terminals" className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-lg font-bold mb-3 text-gray-300">CLI TERMINALS</h2>
          <CliTerminalGrid />
        </section>
      </main>
    </div>
    </>
  );
}
