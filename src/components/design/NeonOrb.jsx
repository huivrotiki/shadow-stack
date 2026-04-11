import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * NeonOrb — GLSL simplex-noise orb background.
 *
 * Ported from cyberbabyangel project (blissful-bhabha worktree).
 * TypeScript → JSX, removed next/dynamic wrapper.
 *
 * Full-screen PlaneGeometry(2,2) with OrthographicCamera.
 * Custom fragment shader: organic blob via 4-octave FBM,
 * mouse-reactive vortex, film grain, scroll parallax + blur.
 */
export default function NeonOrb({
  bgColor = "#060606",
  orbColor = "#e8e4df",
  noiseVal = 0.18,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /* ─── Renderer ─────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
    });

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geo = new THREE.PlaneGeometry(2, 2);

    /* ─── GLSL ─────────────────────────────────────────────── */
    const vert = `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
    `;

    const frag = `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2  uRes;
      uniform vec2  uMouse;
      uniform float uNoiseVal;
      uniform vec3  uBgColor;
      uniform vec3  uLightColor;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.7928429140016 - 0.8537347209531 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.xxx * 2.0;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0)) +
          i.y + vec4(0.0, i1.y, i2.y, 1.0)) +
          i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 1.0 / 7.0;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 105.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      float fbm(vec3 p) {
        return snoise(p) * 0.52
             + snoise(p * 2.03 + vec3(3.1, 0.4, 1.7)) * 0.26
             + snoise(p * 4.15 - vec3(0.3, 2.1, 0.8)) * 0.13
             + snoise(p * 8.2 + vec3(1.4, 3.2, 0.5)) * 0.06;
      }

      void main() {
        vec2 uv = vUv;
        vec2 p = uv * 2.0 - 1.0;
        p.x *= uRes.x / uRes.y;

        vec2 m = uMouse * 2.0 - 1.0;
        m.x *= uRes.x / uRes.y;
        float md = length(p - m);
        vec2 mdir = md > 0.0 ? normalize(p - m) : vec2(0.0);
        float pull = exp(-md * 1.7) * 0.30;
        p -= mdir * pull;

        float t = uTime * 0.10;
        vec2 q = p - vec2(0.02, 0.02);
        float a = atan(q.y, q.x);
        float r = length(q);
        float n = fbm(vec3(q * 1.15, t));

        float contour = 0.55
          + sin(a + 0.55) * 0.11
          + cos(a * 2.25 - 0.8) * 0.08
          + sin(a * 4.8 + t * 0.35) * 0.04
          + n * 0.25;

        float mask = smoothstep(contour + 0.22, contour - 0.015, r);
        float halo = smoothstep(contour + 0.52, contour + 0.02, r) * 0.45;

        vec3 bg    = uBgColor;
        vec3 light = uLightColor;
        vec3 silver = light * 1.2;
        vec3 dark   = mix(bg, light, 0.15);
        vec3 shadow = mix(bg, light, 0.1);

        float topGlow = smoothstep(0.72, -0.76, q.y + q.x * 0.25 + n * 0.35);
        float sideMix = smoothstep(-0.9, 0.9, q.x + n * 0.22);
        float lowShad = smoothstep(-0.15, 1.05, -q.x * 0.48 + q.y * 0.82 + n * 0.25);

        vec3 orb = mix(dark, silver, sideMix);
        orb = mix(orb, light, topGlow * 0.95);
        orb = mix(orb, shadow, lowShad * 0.48);

        float core = smoothstep(0.4, 0.0, r);
        orb += vec3(0.5) * core;

        float vortex = smoothstep(0.01, 0.25, md);
        orb = mix(vec3(0.0), orb, vortex * 0.9 + 0.1);

        vec3 final_col = mix(bg, orb, mask);
        final_col += vec3(0.22) * halo;

        float grain = fract(sin(dot(uv + fract(uTime * 0.55), vec2(127.1, 311.7))) * 43758.5453);
        final_col += (grain - 0.5) * uNoiseVal;

        gl_FragColor = vec4(clamp(final_col, 0.0, 1.0), 1.0);
      }
    `;

    const mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uNoiseVal: { value: noiseVal },
        uBgColor: { value: new THREE.Color(bgColor) },
        uLightColor: { value: new THREE.Color(orbColor) },
      },
    });

    scene.add(new THREE.Mesh(geo, mat));

    function onResize() {
      renderer.setSize(window.innerWidth, window.innerHeight);
      mat.uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    const targetMouse = new THREE.Vector2(0.5, 0.5);

    function onMouseMove(e) {
      targetMouse.x = e.clientX / window.innerWidth;
      targetMouse.y = 1 - e.clientY / window.innerHeight;
    }
    function onTouchMove(e) {
      if (e.touches[0]) {
        targetMouse.x = e.touches[0].clientX / window.innerWidth;
        targetMouse.y = 1 - e.touches[0].clientY / window.innerHeight;
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const clock = new THREE.Clock();
    let frameId;

    function frame() {
      frameId = requestAnimationFrame(frame);
      mat.uniforms.uTime.value = clock.getElapsedTime();
      mat.uniforms.uMouse.value.lerp(targetMouse, 0.07);
      renderer.render(scene, camera);
    }
    frame();

    const orbBlurMax = 4;
    let rafPending = false;

    function updateOrbParallax() {
      if (!container) return;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(window.scrollY / max, 1);
      const blurAmt = progress * orbBlurMax;
      container.style.transform = `translateY(${window.scrollY * -0.08}px) scale(${1 + progress * 0.05})`;
      container.style.filter = blurAmt > 0.1 ? `blur(${blurAmt}px)` : "none";
      rafPending = false;
    }
    function onScroll() {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(updateOrbParallax);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    updateOrbParallax();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll);
      renderer.dispose();
      mat.dispose();
      geo.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [bgColor, orbColor, noiseVal]);

  return <div ref={containerRef} className="orb-bg" />;
}
