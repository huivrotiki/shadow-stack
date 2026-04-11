import { useEffect, useState } from "react";

/**
 * OmniRoutePanel — зеркало OmniRoute :20130 через shadow-api proxy.
 * Запросы идут на /api/omniroute/* → :20130/api/* (CORS-safe).
 *
 * Показывает:
 *   - /health           — статус сервиса
 *   - /providers        — список провайдеров и их состояние
 *   - /combos           — комбо-стратегии
 *   - /usage/analytics  — аналитика использования
 */
const REFRESH_MS = 10_000;

function useOmniRoute(path) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/omniroute/${path}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    }
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [path]);

  return { data, err };
}

function Metric({ label, value, hint }) {
  return (
    <div className="omni-metric">
      <div className="omni-metric-label">{label}</div>
      <div className="omni-metric-value">{value ?? "—"}</div>
      {hint && <div className="omni-metric-hint">{hint}</div>}
    </div>
  );
}

export default function OmniRoutePanel() {
  const { data: health } = useOmniRoute("health");
  const { data: providers, err: provErr } = useOmniRoute("providers");
  const { data: combos } = useOmniRoute("combos");
  const { data: usage } = useOmniRoute("usage/analytics");

  const providerList = Array.isArray(providers?.providers)
    ? providers.providers
    : Array.isArray(providers)
      ? providers
      : [];
  const comboList = Array.isArray(combos?.combos)
    ? combos.combos
    : Array.isArray(combos)
      ? combos
      : [];

  return (
    <section id="omniroute" className="ds-panel omni-panel">
      <header className="ds-panel-head">
        <h2>OMNIROUTE :20130</h2>
        <span className={`ds-panel-status ${health?.status || "unknown"}`}>
          {health?.status || "unknown"}
        </span>
      </header>

      <div className="omni-metrics">
        <Metric
          label="providers"
          value={providerList.length}
          hint="active"
        />
        <Metric label="combos" value={comboList.length} hint="strategies" />
        <Metric
          label="requests"
          value={usage?.totalRequests ?? usage?.requests ?? 0}
          hint="total"
        />
        <Metric
          label="tokens"
          value={usage?.totalTokens ?? usage?.tokens ?? 0}
          hint="used"
        />
      </div>

      <div className="omni-split">
        <div className="omni-col">
          <div className="omni-col-head">PROVIDERS</div>
          {provErr && <div className="omni-err">error: {provErr}</div>}
          {providerList.length === 0 && !provErr && (
            <div className="omni-empty">no providers</div>
          )}
          {providerList.map((p, i) => (
            <div key={p.id || p.name || i} className="omni-provider-row">
              <span
                className={`omni-dot ${
                  p.status === "ok" || p.healthy ? "ok" : "err"
                }`}
              />
              <span className="omni-provider-name">
                {p.name || p.id || "unknown"}
              </span>
              <span className="omni-provider-meta">
                {p.models?.length ?? p.modelCount ?? ""}
              </span>
            </div>
          ))}
        </div>

        <div className="omni-col">
          <div className="omni-col-head">COMBOS</div>
          {comboList.length === 0 && <div className="omni-empty">no combos</div>}
          {comboList.map((c, i) => (
            <div key={c.id || c.name || i} className="omni-provider-row">
              <span className="omni-provider-name">
                {c.name || c.id || `combo-${i}`}
              </span>
              <span className="omni-provider-meta">
                {c.strategy || c.type || ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
