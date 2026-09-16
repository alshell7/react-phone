"use client";
// Adapted from ElevenLabs UI Orb (MIT). Shader in orb-shader.ts.
// Uses Three directly to keep React 18/19 support; no React renderer dependency.
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { useReducedMotion } from "../../react/use-reduced-motion.ts";
import { fragmentShader, vertexShader } from "./orb-shader.ts";
import { usePhoneTheme } from "../theme.tsx";

export interface OrbProps {
  colors?: [string, string];
  seed?: number;
  /** Animation multiplier, clamped to 0–2. Zero freezes motion. */
  speed?: number;
  animate?: boolean;
  state?: string;
  appearance?: "light" | "dark";
  /** Audio levels normalized to 0–1. CallOrb supplies the current call levels. */
  getInputVolume?: () => number;
  getOutputVolume?: () => number;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

const clamp = (n: number): number =>
  Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;

/** ElevenLabs' animated Orb shader, lazy loaded with a static WebGL fallback. */
export function Orb({
  colors,
  seed = 7,
  speed = 1,
  animate = true,
  state = "idle",
  appearance = "light",
  getInputVolume,
  getOutputVolume,
  size = 112,
  className,
  style,
}: OrbProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<"loading" | "webgl" | "fallback">(
    "loading",
  );
  const reduced = useReducedMotion();
  const theme = usePhoneTheme();
  const [palette, setPalette] = useState<[string, string]>([
    "#2e5945",
    "#b8daa2",
  ]);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const accent = canvasRef.current
      ? getComputedStyle(canvasRef.current).color
      : "#2e5945";
    const rgb = (color: string): [number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#2e5945";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return [data[0], data[1], data[2]];
    };
    const base = rgb(colors?.[0] ?? accent);
    const light = colors
      ? rgb(colors[1])
      : base.map((n) => Math.round(n + (255 - n) * 0.65));
    setPalette([`rgb(${base.join(",")})`, `rgb(${light.join(",")})`]);
  }, [colors?.[0], colors?.[1], theme.accent, theme.appearance]);
  const live = useRef({
    colors: palette,
    speed,
    animate,
    appearance,
    getInputVolume,
    getOutputVolume,
    reduced,
  });
  live.current = {
    colors: palette,
    speed,
    animate,
    appearance,
    getInputVolume,
    getOutputVolume,
    reduced,
  };
  useEffect(() => {
    let disposed = false;
    let release = () => {};
    const canvas = canvasRef.current;
    if (!canvas) return;
    setRenderer("loading");
    const fallback = () => {
      if (!disposed) setRenderer("fallback");
    };
    void Promise.all([import("three"), import("./orb-texture.ts")])
      .then(([THREE, { orbTextureUrl }]) => {
        if (disposed) return;
        let gl: InstanceType<typeof THREE.WebGLRenderer>;
        try {
          gl = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            premultipliedAlpha: true,
          });
        } catch {
          fallback();
          return;
        }
        // Keep upstream noise and shaders together; the texture is bundled locally.
        let randomSeed = seed | 0;
        const random = () => {
          randomSeed = (randomSeed + 0x9e3779b9) | 0;
          let t = Math.imul(randomSeed ^ (randomSeed >>> 16), 0x21f0aaad);
          t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
          return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
        };
        let textureReady = false;
        const texture = new THREE.TextureLoader().load(
          orbTextureUrl,
          () => {
            textureReady = true;
            if (!disposed) setRenderer("webgl");
          },
          undefined,
          fallback,
        );
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        const uniforms = {
          uColor1: new THREE.Uniform(new THREE.Color(live.current.colors[0])),
          uColor2: new THREE.Uniform(new THREE.Color(live.current.colors[1])),
          uOffsets: new THREE.Uniform(
            new Float32Array(
              Array.from({ length: 7 }, () => random() * Math.PI * 2),
            ),
          ),
          uPerlinTexture: new THREE.Uniform(texture),
          uTime: new THREE.Uniform(0),
          uAnimation: new THREE.Uniform(0.1),
          uInverted: new THREE.Uniform(0),
          uInputVolume: new THREE.Uniform(0),
          uOutputVolume: new THREE.Uniform(0),
          uOpacity: new THREE.Uniform(1),
        };
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 10);
        camera.position.z = 5;
        const geometry = new THREE.CircleGeometry(3.5, 64);
        const material = new THREE.ShaderMaterial({
          uniforms,
          fragmentShader,
          vertexShader,
          transparent: true,
        });
        scene.add(new THREE.Mesh(geometry, material));
        let frame = 0;
        let last = 0;
        let visible = true;
        let motion = 0.1;
        const color1 = new THREE.Color();
        const color2 = new THREE.Color();
        const resize = () => {
          const bounds = canvas.getBoundingClientRect();
          gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
          gl.setSize(
            Math.max(1, bounds.width),
            Math.max(1, bounds.height),
            false,
          );
        };
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        const intersection = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
        });
        intersection.observe(canvas);
        resize();
        const draw = (now: number) => {
          if (disposed) return;
          frame = requestAnimationFrame(draw);
          if (!textureReady || document.hidden || !visible || now - last < 33)
            return;
          const delta = Math.min((now - last) / 1000, 0.05);
          last = now;
          const config = live.current;
          const rate =
            config.animate && !config.reduced
              ? Math.max(0, Math.min(2, config.speed))
              : 0;
          uniforms.uInputVolume.value +=
            (clamp(rate > 0 ? (config.getInputVolume?.() ?? 0) : 0) -
              uniforms.uInputVolume.value) *
            0.2;
          uniforms.uOutputVolume.value +=
            (clamp(rate > 0 ? (config.getOutputVolume?.() ?? 0) : 0) -
              uniforms.uOutputVolume.value) *
            0.2;
          motion +=
            (0.1 +
              (1 - Math.pow(uniforms.uOutputVolume.value - 1, 2)) * 0.9 -
              motion) *
            0.12;
          uniforms.uTime.value += delta * 0.5 * rate;
          uniforms.uAnimation.value += delta * motion * rate;
          // Useful runtime diagnostics without retaining any audio samples.
          canvas.dataset.phase = uniforms.uAnimation.value.toFixed(3);
          canvas.dataset.inputLevel = uniforms.uInputVolume.value.toFixed(3);
          canvas.dataset.outputLevel = uniforms.uOutputVolume.value.toFixed(3);
          uniforms.uColor1.value.copy(color1.set(config.colors[0]));
          uniforms.uColor2.value.copy(color2.set(config.colors[1]));
          uniforms.uInverted.value = config.appearance === "dark" ? 1 : 0;
          gl.render(scene, camera);
        };
        const onLost = (event: Event) => {
          event.preventDefault();
          fallback();
          cancelAnimationFrame(frame);
        };
        const onRestored = () => {
          if (!disposed) {
            setRenderer("webgl");
            frame = requestAnimationFrame(draw);
          }
        };
        canvas.addEventListener("webglcontextlost", onLost);
        canvas.addEventListener("webglcontextrestored", onRestored);
        frame = requestAnimationFrame(draw);
        release = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          intersection.disconnect();
          canvas.removeEventListener("webglcontextlost", onLost);
          canvas.removeEventListener("webglcontextrestored", onRestored);
          geometry.dispose();
          material.dispose();
          texture.dispose();
          gl.dispose();
          gl.forceContextLoss();
        };
      })
      .catch(fallback);
    return () => {
      disposed = true;
      release();
    };
  }, [seed]);
  return (
    <div
      className={className}
      data-orb=""
      data-renderer={renderer}
      data-state={state}
      data-animated={animate && !reduced && speed > 0}
      data-colors={palette.join(";")}
      role="img"
      aria-label={`Voice orb: ${state}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        maxWidth: "100%",
        flexShrink: 0,
        color: "var(--az-accent, #2e5945)",
        ...style,
      }}
    >
      {renderer !== "webgl" && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "7%",
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 25%, ${palette[1]}, ${palette[0]})`,
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          opacity: renderer === "webgl" ? 1 : 0,
        }}
      />
    </div>
  );
}
