import { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Check, Eye, Hand, RotateCcw, Video, XCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/button';
import { useCamera } from '@/hooks/use-camera';
import { captureFrame, predictSign } from '@/lib/cv-api';
import { saveProgress } from '@/lib/progress';
import { signs } from '@/data/signs';
import type { SignId } from '@/types/sign';

type DetectState = 'idle' | 'detecting' | 'hand-detected' | 'success' | 'try-again';

// cv-service labels signs as HELLO / THANK_YOU / WATER / HELP / PLEASE (see cv-service/config.py).
// Our SignId is 'hello' | 'thank-you' | ... so this just needs case + dash-to-underscore.
function toCvLabel(signId: SignId) {
  return signId.toUpperCase().replace(/-/g, '_');
}

const CONFIDENCE_THRESHOLD = 0.6;

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
  const [detectState, setDetectState] = useState<DetectState>('idle');
  const [confidence, setConfidence] = useState(0);

  const markComplete = () => {
    const updated = { ...progress, [sign.id]: 100 };
    setProgress(updated);
    saveProgress(updated);
  };

  const showRetry = () => setDetectState('try-again');

  // Replaces the old setTimeout-based simulate(): grabs a real frame from the
  // <video> element and sends it to cv-service's POST /predict.
  const detectSign = async () => {
    if (!videoRef.current) return;
    setDetectState('detecting');

    const frame = await captureFrame(videoRef.current);
    if (!frame) {
      setDetectState('try-again');
      return;
    }

    try {
      const result = await predictSign(frame);

      if (!result.hand_detected) {
        setDetectState('try-again');
        return;
      }

      setDetectState('hand-detected');

      const isMatch = result.predicted_sign === toCvLabel(sign.id) && result.confidence >= CONFIDENCE_THRESHOLD;

      if (isMatch) {
        setConfidence(result.confidence);
        setDetectState('success');
      } else {
        setDetectState('try-again');
      }
    } catch (err) {
      console.error('cv-service /predict failed — is it running on VITE_CV_SERVICE_URL?', err);
      setDetectState('try-again');
    }
  };

  return (
    <AppShell active="/dashboard" user={localStorage.getItem('signlearn-user') || 'Aarav'} onSignOut={onSignOut}>
      <div className="animate-rise">
        <button data-testid="button-back-lesson" onClick={() => setLocation(`/lesson/${sign.id}`)} className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Back to lesson</button>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono-ui text-xs uppercase tracking-[.18em] text-primary">Practice studio</span>
            <h1 className="mt-3 font-display text-5xl tracking-[-.045em]">Your turn: {sign.name}</h1>
            <p className="mt-3 text-muted-foreground">There is no perfect attempt. Just an honest one.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary"><span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10"><Video size={15} /></span> Camera stays private</div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.28fr_.72fr]">
          <section className="relative min-h-[420px] overflow-hidden rounded-[30px] bg-[#173f38]">
            <video ref={videoRef} autoPlay muted playsInline className={`absolute inset-0 h-full w-full object-cover ${cameraState === 'ready' ? 'opacity-75' : 'opacity-0'}`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(119,183,151,.35),transparent_45%)]" />
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-[#fff8ed]/10 px-3 py-2 text-xs text-[#fff8ed]"><span className={`h-2 w-2 rounded-full ${cameraState === 'ready' ? 'bg-[#8bdfab]' : 'bg-[#f1c98b]'}`} />{cameraState === 'ready' ? 'Camera ready' : 'Preview mode'}</div>
            {detectState === 'success' ? (
              <div className="absolute inset-0 grid place-items-center bg-[#173f38]/65 p-6 text-center text-[#fff8ed]">
                <div>
                  <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#8bdfab] text-[#173f38]"><Check size={31} /></span>
                  <h2 className="mt-5 font-display text-4xl">Correct!</h2>
                  <p className="mt-2 text-lg font-semibold text-[#8bdfab]">{Math.round(confidence * 100)}% confidence</p>
                  <p className="mt-2 text-sm text-[#c0d3c8]">Great job! Your gesture matches {sign.name}.</p>
                  <Button testId="button-complete-practice" variant="light" className="mt-7" onClick={() => { markComplete(); setLocation('/progress'); }}>Save my progress <ArrowRight size={15} /></Button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                {detectState === 'detecting' ? (
                  <div className="rounded-2xl bg-[#fff8ed]/10 p-4 text-center text-sm text-[#fff8ed] animate-pulse-soft">Detecting your hand…</div>
                ) : detectState === 'hand-detected' ? (
                  <div className="rounded-2xl bg-[#fff8ed]/10 p-4 text-center text-sm text-[#fff8ed] animate-pulse-soft">Hand detected · Analyzing your gesture…</div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#fff8ed]/10 p-4 backdrop-blur-sm">
                    <p className="text-sm text-[#fff8ed]">{cameraState === 'ready' ? 'When you are ready, make the sign in frame.' : 'Camera access is optional in this preview.'}</p>
                    <Button testId="button-detect-sign" variant="light" onClick={detectSign} disabled={cameraState !== 'ready'}>Check my sign <Eye size={15} /></Button>
                  </div>
                )}
              </div>
            )}
          </section>
          <aside className="rounded-[30px] border border-border bg-card p-6 md:p-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">A quick reminder</span>
                <h2 className="mt-3 font-display text-3xl">{sign.name}</h2>
              </div>
              <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ backgroundColor: sign.tint, color: sign.accent }}><Hand size={20} /></div>
            </div>
            <div className="mt-7 space-y-4">
              {sign.steps.map((step, i) => (
                <div key={step} className={`flex gap-3 rounded-xl p-3 ${i === 0 ? 'bg-muted' : ''}`}>
                  <span className="font-mono-ui text-xs text-primary">0{i + 1}</span>
                  <p className="text-sm leading-5">{step}</p>
                </div>
              ))}
            </div>
            {cameraState === 'idle' && <Button testId="button-enable-camera" variant="secondary" className="mt-6 w-full" onClick={enableCamera}><Video size={16} /> Enable camera</Button>}
            {cameraState === 'requesting' && <div data-testid="status-camera-requesting" className="mt-6 rounded-2xl bg-muted p-4 text-center text-sm text-muted-foreground">Asking your browser for camera access…</div>}
            {cameraState === 'denied' && (
              <div className="mt-6 rounded-2xl border border-[#e7c6b7] bg-[#fff0e9] p-4 text-sm text-[#9a5138]">
                <div className="flex items-center gap-2 font-bold"><XCircle size={16} /> Camera unavailable</div>
                <p className="mt-2 leading-5">That is okay. Use the preview check below to keep practicing.</p>
                <Button testId="button-retry-camera" variant="ghost" className="mt-2 px-0 py-1 text-[#9a5138]" onClick={enableCamera}>Try camera again <RotateCcw size={14} /></Button>
              </div>
            )}
            {detectState === 'try-again' && (
              <div className="mt-6 rounded-2xl bg-[#fff0e9] p-4 text-sm text-[#9a5138]">
                <div className="flex items-center gap-2 font-bold"><RotateCcw size={15} /> Try Again</div>
                <p className="mt-2">Almost there. Adjust your hand position and try again.</p>
              </div>
            )}
            <button data-testid="button-show-retry" onClick={showRetry} className="mt-5 text-xs font-semibold text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">Need another try?</button>
            <div className="mt-8 border-t border-border pt-5">
              <p className="text-xs leading-5 text-muted-foreground">Your video is used only in this browser preview and is never uploaded — each frame is sent to your local cv-service just to get a prediction back.</p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
