'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Postać w canvasie WebGL: displacement włosów sterowany maską, przenikanie
 * między dwiema teksturami dłoni. Fallback na `<img>` bez WebGL i przy
 * prefers-reduced-motion. Uzasadnienie liczb i tor alfy — `docs/scena.md`.
 */

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;   // dłoń otwarta
uniform sampler2D uTex2;  // dłoń zaciśnięta (jabłko z niej wymazane)
uniform sampler2D uMask;
uniform float uTime;
uniform float uAmp;
uniform float uMix;       // 0 = otwarta, 1 = zaciśnięta
varying vec2 vUv;

void main() {
  float m = texture2D(uMask, vUv).r;
  m = smoothstep(0.05, 0.60, m);

  // okresy są dobrane do zasięgu maski (vUv.y 0.05–0.35)
  float w =
      sin(vUv.y * 28.0 + uTime * 0.85) * 0.60
    + sin(vUv.y * 46.0 - uTime * 1.35) * 0.20
    + sin(vUv.x * 10.0 + uTime * 0.60) * 0.20;

  float wy = sin(vUv.x * 8.0 + uTime * 1.05) * 0.30
           + sin(vUv.y * 5.0 - uTime * 0.75) * 0.18;

  vec2 off = vec2(w * 0.019, wy * 0.007) * m * uAmp;

  vec2 uv = clamp(vUv + off, 0.001, 0.999);
  vec4 c = mix(texture2D(uTex, uv), texture2D(uTex2, uv), uMix);

  // despill oliwkowej obwódki, bramkowany alfą (liście muszą zostać zielone)
  vec3 straight = c.rgb / max(c.a, 0.0039);
  float cap = (straight.r + straight.b) * 0.5 * 1.06;
  float halo = 1.0 - smoothstep(0.75, 0.98, c.a);
  straight.g = mix(straight.g, min(straight.g, cap), halo);

  gl_FragColor = vec4(straight * c.a, c.a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

function texFromImage(gl: WebGLRenderingContext, img: HTMLImageElement, premultiply = false) {
  const t = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  return t;
}

type Props = {
  src: string;
  /** druga tekstura postaci – przenikanie sterowane przez mixRef */
  src2: string;
  mask: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  /** 0..1, czytane co klatkę; timeline GSAP-a pisze do .current */
  mixRef?: React.RefObject<number>;
};

export default function HairCanvas({
  src,
  src2,
  mask,
  alt,
  className,
  width,
  height,
  mixRef,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setFailed(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
    });
    if (!gl) {
      setFailed(true);
      return;
    }

    let raf = 0;
    let disposed = false;
    let program: WebGLProgram | null = null;

    const load = (url: string) =>
      new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.crossOrigin = 'anonymous';
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = url;
      });

    Promise.all([load(src), load(src2), load(mask)])
      .then(([imgTex, imgTex2, imgMask]) => {
        if (disposed) return;

        const vs = compile(gl, gl.VERTEX_SHADER, VERT);
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) {
          setFailed(true);
          return;
        }

        program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
          setFailed(true);
          return;
        }
        gl.useProgram(program);

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        const loc = gl.getAttribLocation(program, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

        const tTex = texFromImage(gl, imgTex, true);
        const tTex2 = texFromImage(gl, imgTex2, true);
        const tMask = texFromImage(gl, imgMask);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tTex);
        gl.uniform1i(gl.getUniformLocation(program, 'uTex'), 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tMask);
        gl.uniform1i(gl.getUniformLocation(program, 'uMask'), 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, tTex2);
        gl.uniform1i(gl.getUniformLocation(program, 'uTex2'), 2);

        const uTime = gl.getUniformLocation(program, 'uTime');
        const uAmp = gl.getUniformLocation(program, 'uAmp');
        const uMix = gl.getUniformLocation(program, 'uMix');

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);

        let visible = true;
        const io = new IntersectionObserver(
          ([e]) => {
            visible = e.isIntersecting;
          },
          { rootMargin: '100px' }
        );
        io.observe(canvas);

        const t0 = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          if (!visible) return;
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform1f(uTime, (now - t0) / 1000);
          gl.uniform1f(uAmp, window.innerWidth < 700 ? 0.6 : 1.0);
          gl.uniform1f(uMix, mixRef?.current ?? 0);
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        };
        raf = requestAnimationFrame(frame);

        return () => io.disconnect();
      })
      .catch(() => setFailed(true));

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (program) gl.deleteProgram(program);
    };
  }, [src, src2, mask, width, height, mixRef]);

  if (failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={src} alt={alt} width={width} height={height} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={alt}
      style={{ width: '100%', height: 'auto', aspectRatio: `${width} / ${height}` }}
    />
  );
}
