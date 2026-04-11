import { useEffect, useRef, useState } from "react";

/**
 * CliTerminal — одно терминальное окно с логами pm2-сервиса.
 * Polling каждые POLL_MS. Server: GET /api/logs/:service → { lines: string[] }
 */
const POLL_MS = 3000;

export default function CliTerminal({ service, title }) {
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState(null);
  const [live, setLive] = useState(true);
  const bottomRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function tick() {
      if (cancelled || !live) return;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/logs/${service}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setLines(Array.isArray(data.lines) ? data.lines : []);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled && e.name !== "AbortError") setErr(e.message);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    }
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [service, live]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [lines]);

  return (
    <div className="cli-terminal">
      <div className="cli-head">
        <span className="cli-title">{title || service}</span>
        <span className="cli-meta">
          {err ? <span className="cli-err">• {err}</span> : null}
          <button
            type="button"
            className="cli-toggle"
            onClick={() => setLive((v) => !v)}
            title={live ? "pause" : "resume"}
          >
            {live ? "⏸" : "▶"}
          </button>
        </span>
      </div>
      <div className="cli-body">
        {lines.length === 0 && !err && (
          <div className="cli-empty">waiting for logs…</div>
        )}
        {lines.map((line, i) => (
          <div key={i} className="cli-line">
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

/** CliTerminalGrid — 3 окна одновременно */
export function CliTerminalGrid() {
  return (
    <div className="cli-grid">
      <CliTerminal service="shadow-api" title="shadow-api :3001" />
      <CliTerminal service="free-models-proxy" title="free-models-proxy :20129" />
      <CliTerminal service="omniroute-kiro" title="omniroute :20130" />
    </div>
  );
}
