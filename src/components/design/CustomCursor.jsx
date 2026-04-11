import { useEffect, useRef, useState } from "react";

const LERP_FACTOR = 0.1;
const INTERACTIVE_SELECTOR = "a, button, .sb-btn, .g-item, [role='button'], .speed-btn";

/**
 * CustomCursor — cinematic cursor with dot + lerp ring.
 * Ported from cyberbabyangel (TS → JSX).
 * Hides on touch devices. Grows on hover of interactive elements.
 */
export default function CustomCursor() {
  const [isTouch, setIsTouch] = useState(true);
  const [isBig, setIsBig] = useState(false);

  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(hover: none)");
    setIsTouch(mq.matches);
    const onChange = (e) => setIsTouch(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isTouch) return;
    document.documentElement.style.cursor = "none";
    return () => {
      document.documentElement.style.cursor = "";
    };
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;
    const onMouseMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${e.clientX - 2.5}px, ${e.clientY - 2.5}px)`;
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;
    const tick = () => {
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * LERP_FACTOR;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * LERP_FACTOR;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x - 20}px, ${ringPos.current.y - 20}px)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [isTouch]);

  useEffect(() => {
    if (isTouch) return;
    const onOver = (e) => {
      if (e.target?.closest(INTERACTIVE_SELECTOR)) setIsBig(true);
    };
    const onOut = (e) => {
      if (e.target?.closest(INTERACTIVE_SELECTOR)) setIsBig(false);
    };
    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
    };
  }, [isTouch]);

  if (isTouch) return null;

  return (
    <div className="cur">
      <div ref={dotRef} className="cur-d" />
      <div ref={ringRef} className={`cur-r${isBig ? " big" : ""}`} />
    </div>
  );
}
