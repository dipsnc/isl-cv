import { useLocation, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, ChevronRight, Play } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/button';
import { signs } from '@/data/signs';
import { getSessionUserName } from '@/lib/auth';
import type { SignId } from '@/types/sign';

export function Lesson({
  progress,
  onSignOut,
}: {
  progress: Record<SignId, number>;
  onSignOut: () => void;
}) {
  const params = useParams<{ signId: string }>();
  const sign = signs.find((item) => item.id === params.signId) || signs[0];
  const [, setLocation] = useLocation();

  return (
    <AppShell
      active="/dashboard"
      user={getSessionUserName()}
      onSignOut={onSignOut}
    >
      <div className="animate-rise">
        <button
          data-testid="button-back-dashboard"
          onClick={() => setLocation('/dashboard')}
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back to overview
        </button>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <section>
            <div
              style={{ backgroundColor: sign.tint }}
              className="group relative flex min-h-[390px] items-center justify-center overflow-hidden rounded-[32px] md:min-h-[500px]"
            >
              <span
                className="absolute left-7 top-7 font-mono-ui text-xs uppercase tracking-[.18em]"
                style={{ color: sign.accent }}
              >
                Lesson / 0{signs.indexOf(sign) + 1}
              </span>

              <div className="relative h-72 w-64">
                <img
                  src={sign.image}
                  alt={`ISL sign for ${sign.name}`}
                  className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              <button
                data-testid="button-play-demonstration"
                className="absolute bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-[#fff8ed] text-primary shadow-lg transition hover:scale-105"
              >
                <Play size={20} fill="currentColor" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Watch the movement slowly, then make it yours.</span>
              <span className="font-mono-ui">{sign.duration}</span>
            </div>
          </section>

          <section className="flex flex-col justify-center">
            <span className="font-mono-ui text-xs uppercase tracking-[.2em] text-primary">
              Sign {String(signs.indexOf(sign) + 1).padStart(2, '0')} of 05
            </span>

            <h1 className="mt-4 font-display text-6xl tracking-[-.05em] md:text-7xl">
              {sign.name}
            </h1>

            <p className="mt-2 font-display text-xl text-primary">
              {sign.phonetic}
            </p>

            <p className="mt-7 max-w-md text-base leading-7 text-muted-foreground">
              {sign.description}
            </p>

            <div className="mt-9 space-y-4">
              {sign.steps.map((step, i) => (
                <div
                  key={step}
                  className="flex gap-4 border-t border-border pt-4"
                >
                  <span className="font-mono-ui text-xs text-primary">
                    0{i + 1}
                  </span>

                  <p className="text-sm leading-6">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                testId="button-practice-sign"
                onClick={() => setLocation(`/practice/${sign.id}`)}
              >
                {progress[sign.id] === 100
                  ? 'Practice again'
                  : 'Try it yourself'}
                <ArrowRight size={16} />
              </Button>

              <Button
                testId="button-next-sign"
                variant="ghost"
                onClick={() =>
                  setLocation(
                    `/lesson/${
                      signs[(signs.indexOf(sign) + 1) % signs.length].id
                    }`
                  )
                }
              >
                Next sign
                <ChevronRight size={16} />
              </Button>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
