import { useEffect, useState } from "react";
import { showToast } from "../design/Toast";

const PROFILES = [
  { id: "slow", label: "SLOW", hint: "local-first, Ollama 3b" },
  { id: "medium", label: "MEDIUM", hint: "shadow/auto cascade" },
  { id: "fast", label: "FAST", hint: "cloud premium only" },
];

/**
 * SpeedControl — 3 кнопки выбора режима скорости.
 * GET /api/speed  → { profile }
 * POST /api/speed → { profile } (whitelist на сервере)
 */
export default function SpeedControl() {
  const [active, setActive] = useState("medium");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/speed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.current && setActive(d.current))
      .catch(() => {});
  }, []);

  async function pick(id) {
    if (id === active || loading) return;
    const prev = active;
    setActive(id);
    setLoading(true);
    try {
      const res = await fetch("/api/speed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speed: id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showToast(`speed → ${id}`);
    } catch (err) {
      setActive(prev);
      showToast(`speed update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="speed-control">
      <div className="speed-control-label">SPEED PROFILE</div>
      <div className="speed-btns">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`speed-btn${active === p.id ? " active" : ""}`}
            disabled={loading}
            onClick={() => pick(p.id)}
            title={p.hint}
          >
            <span className="speed-btn-label">{p.label}</span>
            <span className="speed-btn-hint">{p.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
