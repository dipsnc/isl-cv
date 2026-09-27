/**
 * use-mediapipe.ts
 *
 * Loads MediaPipe Hands via CDN, runs it on a <video> element at a capped
 * frame rate, and draws a lightweight skeleton onto a <canvas> overlay.
 *
 * Two perf/visual fixes vs. the previous version:
 *  1. The canvas is sized to its own rendered CSS box (not the camera's
 *     native capture resolution), so dot/line sizes look consistent no
 *     matter what resolution the webcam happens to negotiate.
 *  2. Inference is throttled to TARGET_FPS instead of running flat-out on
 *     every requestAnimationFrame tick, and uses the lite model
 *     (modelComplexity: 0) since this is just a visual overlay, not the
 *     thing making the actual prediction (cv-service does that).
 */
import { useEffect, useRef, useState, useCallback } from 'react';

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const KEY_POINTS = new Set([0, 4, 8, 12, 16, 20]);

// Radii are expressed as a fraction of canvas width, so they stay
// proportionate regardless of how big the camera box is rendered.
const DOT_RADIUS_KEY = 0.010;
const DOT_RADIUS_OTHER = 0.006;
const LINE_WIDTH = 0.0035;

const TARGET_FPS = 15;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

interface NormalizedLandmark { x: number; y: number; z: number }
interface HandsResults { multiHandLandmarks?: NormalizedLandmark[][] }

let handsInitPromise: Promise<unknown> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getHandsInstance(): Promise<unknown> {
  if (!handsInitPromise) {
    handsInitPromise = (async () => {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w.Hands) throw new Error('MediaPipe Hands not found after script load');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hands: any = new w.Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 0, // lite model — this is only driving the visual overlay
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      await hands.initialize();
      return hands;
    })();
  }
  return handsInitPromise;
}

export function useMediapipe(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [handsReady, setHandsReady] = useState(false);
  const [landmarkCount, setLandmarkCount] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handsRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const lastFrameTimeRef = useRef(0);

  // Keep the canvas's raster size matched to its own rendered CSS box
  // (not the video's native resolution) so drawing stays consistent and
  // we're not repainting a huge buffer every frame for no visual gain.
  const syncCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();
    window.addEventListener('resize', syncCanvasSize);
    return () => window.removeEventListener('resize', syncCanvasSize);
  }, [syncCanvasSize]);

  const drawResults = useCallback((canvas: HTMLCanvasElement, results: HandsResults) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const hands = results.multiHandLandmarks ?? [];
    setLandmarkCount(hands.length);

    const W = canvas.width;
    const H = canvas.height;
    const keyR = W * DOT_RADIUS_KEY;
    const otherR = W * DOT_RADIUS_OTHER;
    const lineW = Math.max(1, W * LINE_WIDTH);

    hands.forEach((landmarks) => {
      const px = (lm: NormalizedLandmark) => lm.x * W;
      const py = (lm: NormalizedLandmark) => lm.y * H;

      ctx.strokeStyle = 'rgba(139, 223, 171, 0.85)';
      ctx.lineWidth = lineW;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(px(landmarks[a]), py(landmarks[a]));
        ctx.lineTo(px(landmarks[b]), py(landmarks[b]));
        ctx.stroke();
      });

      landmarks.forEach((lm, i) => {
        const x = px(lm);
        const y = py(lm);
        const r = KEY_POINTS.has(i) ? keyR : otherR;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = KEY_POINTS.has(i) ? '#fff8ed' : 'rgba(255,248,237,0.85)';
        ctx.fill();
        ctx.strokeStyle = '#8bdfab';
        ctx.lineWidth = Math.max(1, lineW * 0.7);
        ctx.stroke();
      });
    });
  }, []);

  const processFrame = useCallback(
    async (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const hands = handsRef.current;
      if (!video || !canvas || !hands || !activeRef.current) return;

      if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL_MS) {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTimeRef.current = timestamp;

      if (video.readyState < 2) {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }

      syncCanvasSize();

      try {
        await hands.send({ image: video });
      } catch {
        // MediaPipe can occasionally throw if the frame isn't ready — safe to skip
      }
      if (activeRef.current) {
        rafRef.current = requestAnimationFrame(processFrame);
      }
    },
    [videoRef, syncCanvasSize],
  );

  useEffect(() => {
    let cancelled = false;
    getHandsInstance()
      .then((hands) => {
        if (cancelled) return;
        handsRef.current = hands;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (hands as any).onResults((results: HandsResults) => {
          const canvas = canvasRef.current;
          if (canvas) drawResults(canvas, results);
        });
        setHandsReady(true);
      })
      .catch((err) => console.error('[useMediapipe] init failed:', err));

    return () => {
      cancelled = true;
    };
  }, [drawResults]);

  const startLoop = useCallback(() => {
    if (!handsRef.current || activeRef.current) return;
    activeRef.current = true;
    lastFrameTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(processFrame);
  }, [processFrame]);

  const stopLoop = useCallback(() => {
    activeRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
    setLandmarkCount(0);
  }, []);

  useEffect(() => () => stopLoop(), [stopLoop]);

  return { canvasRef, handsReady, landmarkCount, startLoop, stopLoop };
}