import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Hand,
  RotateCcw,
  Sparkles,
  Video,
  XCircle,
  Zap,
} from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/button';
import { useCamera } from '@/hooks/use-camera';
import { useMediapipe } from '@/hooks/use-mediapipe';
import { captureFrame, predictSign } from '@/lib/cv-api';
import { getSessionUserName } from '@/lib/auth';
import { signs } from '@/data/signs';
import type { SignId } from '@/types/sign';

function toCvLabel(signId: SignId) {
  return signId.toUpperCase();
}

const CONFIDENCE_THRESHOLD = 0.55;
const POLL_INTERVAL_MS = 1200;
// Require several consecutive matching frames before declaring success —
// stops one lucky/jittery frame from firing a false positive.
const REQUIRED_MATCH_STREAK = 3;
// Only surface a "try again" nudge after sustained misses, not every poll.
const MISSES_BEFORE_NUDGE = 4;

const SUCCESS_MESSAGES = ['Nailed it!', 'Brilliant!', 'Correct!', 'Great job!', 'Excellent!'];
const TRY_AGAIN_MESSAGES = [
  "Almost there — adjust your fingers.",
  'Hold the sign steady in frame.',
  "Try again — you've got this!",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

type DetectState = 'idle' | 'live' | 'success' | 'nudge' | 'no-hand' | 'error';

export function Practice({
  progress,
  setProgress,
  onSignOut,
}: {
  progress: Record<SignId, number>;
  setProgress: (p: Record<SignId, number>) => void;
  onSignOut: () => void;
}) {
  const params = useParams<{ signId: string }>();
  const sign = signs.find((item) => item.id === params.signId) || signs[0];
  const [, setLocation] = useLocation();

  const { cameraState, videoRef, enableCamera } = useCamera();
  const { canvasRef, landmarkCount, startLoop: startLandmarkLoop, stopLoop: stopLandmarkLoop } = useMediapipe(videoRef);

  const [detectState, setDetectState] = useState<DetectState>('idle');
  const [confidence, setConfidence] = useState(0);
  const [predictedLabel, setPredictedLabel] = useState<string | null>(null);
  // Messages are picked once per state transition, not re-rolled every poll —
  // that churn was part of what made the sidebar/HUD jump around.
  const [successMsg, setSuccessMsg] = useState('');
  const [nudgeMsg, setNudgeMsg] = useState('');

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSuccessRef = useRef(false);
  const matchStreakRef = useRef(0);
  const missStreakRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const markComplete = useCallback(() => {
    const updated = { ...progress, [sign.id]: 100 };
    setProgress(updated); // App.tsx's setProgress wrapper persists this to IndexedDB
  }, [progress, sign.id, setProgress]);

  const runPredict = useCallback(async () => {
    if (!videoRef.current || isSuccessRef.current) return;

    const frame = await captureFrame(videoRef.current);
    if (!frame) return;

    try {
      const result = await predictSign(frame);
      if (isSuccessRef.current) return;

      const conf = result.confidence ?? 0;
      setConfidence(conf);
      setPredictedLabel(result.predicted_sign);

      if (!result.hand_detected) {
        matchStreakRef.current = 0;
        missStreakRef.current = 0;
        setDetectState('no-hand');
        return;
      }

      const isMatch = result.predicted_sign === toCvLabel(sign.id) && conf >= CONFIDENCE_THRESHOLD;

      if (isMatch) {
        missStreakRef.current = 0;
        matchStreakRef.current += 1;

        if (matchStreakRef.current >= REQUIRED_MATCH_STREAK) {
          isSuccessRef.current = true;
          stopPolling();
          setDetectState('success');
          setSuccessMsg(pick(SUCCESS_MESSAGES));
          markComplete();
        } else {
          setDetectState('live');
        }
      } else {
        matchStreakRef.current = 0;
        missStreakRef.current += 1;
        if (missStreakRef.current >= MISSES_BEFORE_NUDGE) {
          setDetectState('nudge');
          setNudgeMsg(pick(TRY_AGAIN_MESSAGES));
        } else {
          setDetectState('live');
        }
      }
    } catch (err) {
      console.error('/predict failed:', err);
      setDetectState('error');
    }
  }, [videoRef, sign.id, markComplete, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();
    isSuccessRef.current = false;
    matchStreakRef.current = 0;
    missStreakRef.current = 0;
    pollingRef.current = setInterval(runPredict, POLL_INTERVAL_MS);
  }, [runPredict, stopPolling]);

  useEffect(() => {
    enableCamera();
    return () => {
      stopPolling();
      stopLandmarkLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cameraState === 'ready') {
      startLandmarkLoop();
      const t = setTimeout(() => {
        startPolling();
        setDetectState('live');
      }, 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraState]);

  useEffect(() => {
    isSuccessRef.current = false;
    matchStreakRef.current = 0;
    missStreakRef.current = 0;
    setDetectState(cameraState === 'ready' ? 'live' : 'idle');
    setConfidence(0);
    setPredictedLabel(null);
    if (cameraState === 'ready') startPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sign.id]);

  const handleRetry = () => {
    isSuccessRef.current = false;
    matchStreakRef.current = 0;
    missStreakRef.current = 0;
    setDetectState('live');
    setConfidence(0);
    setPredictedLabel(null);
    startPolling();
  };

  const confPct = Math.round(confidence * 100);
  const confColor =
    detectState === 'success' ? '#8bdfab' : confPct >= 70 ? '#f1c98b' : confPct >= 40 ? '#e0ae65' : '#c88';

  return (
    <AppShell active="/dashboard" user={getSessionUserName()} onSignOut={onSignOut}>
      <div className="animate-rise">
        <button
          data-testid="button-back-lesson"
          onClick={() => {
            stopPolling();
            stopLandmarkLoop();
            setLocation(`/lesson/${sign.id}`);
          }}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Back to lesson
        </button>

        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono-ui text-xs uppercase tracking-[.18em] text-primary">Practice studio</span>
            <h1 className="mt-3 font-display text-5xl tracking-[-.045em]">Your turn: {sign.name}</h1>
            <p className="mt-3 text-muted-foreground">Show the sign — detection runs live with hand tracking.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10"><Video size={15} /></span>
            Camera stays private
          </div>
        </div>

        {/* items-start is the key layout fix: without it, this grid stretches
            the camera column to match whatever height the sidebar happens to
            be at, so every sidebar content change visibly resized the camera. */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.28fr_.72fr]">
          {/* Fixed aspect ratio instead of min-height — the camera box now has
              a stable size that nothing else on the page can push around. */}
          <section className="relative aspect-video min-h-[360px] overflow-hidden rounded-[30px] bg-[#0e2620]">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                cameraState === 'ready' ? 'opacity-80' : 'opacity-0'
              }`}
            />
            <canvas
              ref={canvasRef}
              style={{ transform: 'scaleX(-1)' }}
              className="absolute inset-0 h-full w-full pointer-events-none"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(75,153,129,.2),transparent_55%)] pointer-events-none" />

            <div className="absolute left-5 top-5 flex flex-col gap-2 pointer-events-none">
              <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs text-[#fff8ed] backdrop-blur-sm">
                <span className={`h-2 w-2 rounded-full ${cameraState === 'ready' ? 'bg-[#8bdfab] animate-pulse' : 'bg-[#f1c98b]'}`} />
                {cameraState === 'ready' ? 'Live' : cameraState === 'requesting' ? 'Starting…' : 'Camera off'}
              </div>
              {cameraState === 'ready' && (
                <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs text-[#fff8ed] backdrop-blur-sm">
                  <Hand size={12} />
                  {landmarkCount === 0 ? 'No hands' : landmarkCount === 1 ? '1 hand tracked' : '2 hands tracked'}
                </div>
              )}
            </div>

            {/* Bottom HUD: fixed min-height so the confidence bar showing up
                or the status text changing length never resizes this box. */}
            {cameraState === 'ready' && detectState !== 'success' && (
              <div className="absolute inset-x-0 bottom-0 p-5 pointer-events-none">
                <div className="min-h-[76px] rounded-2xl bg-black/50 px-5 py-4 backdrop-blur-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono-ui text-[10px] uppercase tracking-widest text-[#fff8ed]/60">
                      {predictedLabel ? `Detected — ${predictedLabel}` : 'Watching…'}
                    </span>
                    <span className="font-mono-ui text-sm font-bold" style={{ color: confColor }}>{confPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${confPct}%`, backgroundColor: confColor }} />
                  </div>
                  {detectState === 'nudge' && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-[#e0ae65]">
                      <Zap size={11} /> {nudgeMsg}
                    </p>
                  )}
                </div>
              </div>
            )}

            {detectState === 'success' && (
              <div className="absolute inset-0 grid place-items-center bg-[#0e2620]/85 p-6 text-center text-[#fff8ed] backdrop-blur-sm">
                <div>
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#8bdfab] text-[#0e2620]"><Check size={38} strokeWidth={3} /></span>
                  <h2 className="mt-6 font-display text-5xl">{successMsg}</h2>
                  <p className="mt-2 text-lg font-semibold text-[#8bdfab]">{confPct}% confidence</p>
                  <p className="mt-2 text-sm text-[#c0d3c8]">
                    Your sign matches <span className="font-semibold text-[#fff8ed]">{sign.name}</span> — progress saved!
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <Button testId="button-complete-practice" variant="light" onClick={() => setLocation('/progress')}>
                      View my progress <ArrowRight size={15} />
                    </Button>
                    <button
                      onClick={() => {
                        const next = signs[(signs.indexOf(sign) + 1) % signs.length];
                        stopPolling();
                        stopLandmarkLoop();
                        setLocation(`/practice/${next.id}`);
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[#fff8ed]/25 px-5 py-3 text-sm font-semibold text-[#fff8ed] transition hover:bg-[#fff8ed]/10"
                    >
                      Next sign <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {cameraState !== 'ready' && cameraState !== 'requesting' && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <div>
                  <Video size={36} className="mx-auto text-[#fff8ed]/30 mb-3" />
                  <p className="text-sm text-[#fff8ed]/50">Enable camera to see hand tracking</p>
                </div>
              </div>
            )}
            {cameraState === 'requesting' && (
              <div className="absolute inset-0 grid place-items-center">
                <p className="text-sm text-[#fff8ed]/60 animate-pulse">Waiting for camera permission…</p>
              </div>
            )}
          </section>

          <aside className="flex flex-col gap-5 rounded-[30px] border border-border bg-card p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">How to sign</span>
                <h2 className="mt-3 font-display text-3xl">{sign.name}</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl shrink-0" style={{ backgroundColor: sign.tint, color: sign.accent }}>
                <span className="font-display text-xl font-bold">{sign.id.toUpperCase()}</span>
              </div>
            </div>

            <div className="space-y-3">
              {sign.steps.map((step, i) => (
                <div key={step} className={`flex gap-3 rounded-xl p-3 ${i === 0 ? 'bg-muted' : ''}`}>
                  <span className="font-mono-ui text-xs text-primary shrink-0">0{i + 1}</span>
                  <p className="text-sm leading-5">{step}</p>
                </div>
              ))}
            </div>

            {cameraState === 'idle' && (
              <Button testId="button-enable-camera" variant="secondary" className="w-full" onClick={enableCamera}>
                <Video size={16} /> Enable camera
              </Button>
            )}
            {cameraState === 'requesting' && (
              <div data-testid="status-camera-requesting" className="rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">
                Asking your browser for camera access…
              </div>
            )}
            {cameraState === 'denied' && (
              <div className="rounded-2xl border border-[#e7c6b7] bg-[#fff0e9] p-4 text-sm text-[#9a5138]">
                <div className="flex items-center gap-2 font-bold"><XCircle size={16} /> Camera unavailable</div>
                <p className="mt-2 leading-5">Grant camera access in your browser settings to use live detection.</p>
                <Button testId="button-retry-camera" variant="ghost" className="mt-2 px-0 py-1 text-[#9a5138]" onClick={enableCamera}>
                  Try again <RotateCcw size={14} />
                </Button>
              </div>
            )}
            {detectState === 'success' && (
              <div className="rounded-2xl bg-[#d9ece1] p-4 text-sm text-[#28766a]">
                <div className="flex items-center gap-2 font-bold text-base"><Sparkles size={16} /> Well done!</div>
                <p className="mt-1 leading-5">You matched <strong>{sign.name}</strong> at {confPct}% confidence.</p>
              </div>
            )}
            {detectState === 'error' && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <p className="font-bold">CV service not reachable</p>
                <p className="mt-1 text-xs">Make sure cv-service is running on port 8000.</p>
                <button onClick={handleRetry} className="mt-2 text-xs font-semibold underline underline-offset-4">Retry</button>
              </div>
            )}

            <div className="mt-auto border-t border-border pt-4">
              <p className="text-xs leading-5 text-muted-foreground">
                Landmark tracking runs locally in your browser. Frames are sent only to your local cv-service — never uploaded.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
