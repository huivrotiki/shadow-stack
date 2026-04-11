import { useEffect, useState } from "react";
import { showToast } from "../design/Toast";

/**
 * ModelSelector — единый dropdown для всех моделей.
 * Источники:
 *   - shadow  → /api/models         (free-models-proxy :20129, ~113 моделей)
 *   - omni    → /api/omniroute/models/catalog  (OmniRoute :20130, ~4 модели)
 *
 * При смене — POST /api/route/default { model }  (сохраняется на сервере)
 */
export default function ModelSelector() {
  const [shadow, setShadow] = useState([]);
  const [omni, setOmni] = useState([]);
  const [selected, setSelected] = useState("shadow/auto");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [s, o] = await Promise.all([
          fetch("/api/models").then((r) => (r.ok ? r.json() : { data: [] })),
          fetch("/api/omniroute/models/catalog")
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null),
        ]);
        if (!alive) return;
        const shadowList = Array.isArray(s?.data)
          ? s.data.map((m) => m.id || m.name).filter(Boolean)
          : [];
        const omniList = Array.isArray(o?.models)
          ? o.models.map((m) => m.id || m.name).filter(Boolean)
          : Array.isArray(o?.data)
            ? o.data.map((m) => m.id || m.name).filter(Boolean)
            : [];
        setShadow(shadowList);
        setOmni(omniList);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  async function onChange(e) {
    const model = e.target.value;
    setSelected(model);
    try {
      await fetch("/api/route/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model }),
      });
      showToast(`default → ${model}`);
    } catch {
      showToast("failed to update default model");
    }
  }

  return (
    <div className="model-selector">
      <div className="model-selector-label">
        DEFAULT MODEL
        <span className="model-counts">
          {loading ? "…" : `${shadow.length + omni.length} total`}
        </span>
      </div>
      <select
        className="model-select"
        value={selected}
        onChange={onChange}
        disabled={loading}
      >
        <option value="shadow/auto">shadow/auto (cascade)</option>
        {shadow.length > 0 && (
          <optgroup label={`shadow :20129 (${shadow.length})`}>
            {shadow.map((id) => (
              <option key={`s-${id}`} value={id}>
                {id}
              </option>
            ))}
          </optgroup>
        )}
        {omni.length > 0 && (
          <optgroup label={`omniroute :20130 (${omni.length})`}>
            {omni.map((id) => (
              <option key={`o-${id}`} value={id}>
                {id}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
