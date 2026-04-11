import { useEffect, useState } from "react";

/**
 * Loader — cinematic intro loader with progress bar.
 * Ported from cyberbabyangel (TS → JSX).
 * Fades out after 2s, removed from DOM after 3s.
 */
export default function Loader({ name = "SHADOW ROUTER" }) {
  const [visible, setVisible] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setDone(true), 2000);
    const removeTimer = setTimeout(() => setVisible(false), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`loader${done ? " out" : ""}`}>
      <span className="l-name">{name}</span>
      <div className="l-bar">
        <div className="l-fill" />
      </div>
    </div>
  );
}
