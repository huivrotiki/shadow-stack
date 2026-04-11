import { lazy, Suspense } from "react";
import CustomCursor from "./design/CustomCursor";
import Loader from "./design/Loader";
import { Toast } from "./design/Toast";

// NeonOrb тяжёлый (Three.js + GLSL shader) — lazy чтобы не блокировать first paint
const NeonOrb = lazy(() => import("./design/NeonOrb"));

/**
 * DashboardShell — layer cake layout:
 *   z:0     → NeonOrb (GLSL shader)
 *   z:10    → page content
 *   z:500   → top nav (mix-blend-mode: difference)
 *   z:2000  → toast
 *   z:9970  → grain overlay (SVG turbulence)
 *   z:9999  → intro loader (fades after 2s)
 *   z:10000 → custom cursor (dot + ring)
 */
export default function DashboardShell({ children }) {
  return (
    <div className="dashboard-shell">
      <Suspense fallback={null}>
        <NeonOrb bgColor="#060606" orbColor="#e8e4df" noiseVal={0.18} />
      </Suspense>

      <div className="grain" aria-hidden="true" />

      <nav className="ds-nav">
        <div className="ds-nav-brand">SHADOW ROUTER</div>
        <div className="ds-nav-links">
          <a href="#overview">overview</a>
          <a href="#providers">providers</a>
          <a href="#omniroute">omniroute</a>
          <a href="#terminals">cli</a>
          <a href="#activity">activity</a>
        </div>
        <div className="ds-nav-status">
          <span className="ds-nav-dot" /> live
        </div>
      </nav>

      <main className="ds-main">{children}</main>

      <Toast />
      <Loader name="SHADOW ROUTER" />
      <CustomCursor />
    </div>
  );
}
