import { Link, useLocation } from 'wouter';
import { Award, ChevronRight, Star, ArrowRight, Check } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { ProgressBar } from '@/components/progress-bar';
import { Button } from '@/components/button';
import { signs } from '@/data/signs';
import type { SignId } from '@/types/sign';

export function Dashboard({ progress, user, onSignOut }: { progress: Record<SignId, number>; user: string; onSignOut: () => void }) {
  const [, setLocation] = useLocation();
  const completed = signs.filter((s) => progress[s.id] === 100).length;
  const next = signs.find((s) => progress[s.id] < 100) || signs[0];
  const averageAccuracy = 92;
  const xp = 120;
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <AppShell active="/dashboard" user={user} onSignOut={onSignOut}>
      <div className="animate-rise">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="font-mono-ui text-xs uppercase tracking-[.18em] text-primary">{today}</p>
            <h1 className="mt-3 font-display text-5xl tracking-[-.045em] md:text-6xl">Hello, {user.split(' ')[0]}.</h1>
            <p className="mt-3 text-muted-foreground">Your next small step is ready when you are.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#e2c797] bg-[#fcf0d9] px-4 py-2.5 text-sm font-semibold text-[#89622b]">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f1c98b]">
              <Star size={13} fill="currentColor" />
            </span>
            3 day learning streak
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="relative overflow-hidden rounded-[28px] bg-[#173f38] p-7 text-[#fff8ed] md:p-9">
            <div className="relative z-10 max-w-md">
              <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#f1c98b]">Continue your path</span>
              <h2 className="mt-5 font-display text-4xl leading-[.98] md:text-5xl">
                {progress[next.id] > 0 ? `Keep practising ${next.name}.` : `Meet ${next.name}.`}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#b6d0c3]">
                {progress[next.id] > 0 ? 'You have already found the rhythm. One more practice makes it yours.' : next.description}
              </p>
              <Button testId="button-continue-lesson" variant="light" className="mt-7" onClick={() => setLocation(`/lesson/${next.id}`)}>
                {progress[next.id] > 0 ? 'Continue lesson' : 'Start this sign'} <ArrowRight size={15} />
              </Button>
            </div>
            <div className="absolute -right-12 -top-16 h-64 w-64 rounded-full border-[42px] border-[#f1c98b]/15" />
            <div className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-[#4b9981]/25" />
          </section>

          <section className="rounded-[28px] border border-border bg-card p-7 md:p-9">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">Your progress</span>
                <p className="mt-4 font-display text-6xl tracking-[-.06em] text-primary">
                  {Math.round(signs.reduce((a, s) => a + progress[s.id], 0) / signs.length)}
                  <span className="text-3xl">%</span>
                </p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d9ece1] text-primary">
                <Award size={22} />
              </div>
            </div>
            <ProgressBar value={Math.round(signs.reduce((a, s) => a + progress[s.id], 0) / signs.length)} />
            <div className="mt-5 flex justify-between text-xs text-muted-foreground">
              <span>{completed} of {signs.length} signs completed</span>
              <Link href="/progress" data-testid="link-view-progress" className="font-bold text-primary">View details</Link>
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs text-muted-foreground">Signs completed</p>
            <p className="mt-2 font-display text-3xl">{completed}<span className="text-lg text-muted-foreground"> / {signs.length}</span></p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs text-muted-foreground">Average accuracy</p>
            <p className="mt-2 font-display text-3xl text-primary">{averageAccuracy}%</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs text-muted-foreground">XP earned</p>
            <p className="mt-2 font-display text-3xl text-[#bd633f]">{xp}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <p className="text-xs text-muted-foreground">Practice streak</p>
            <p className="mt-2 font-display text-3xl">3<span className="text-lg text-muted-foreground"> days</span></p>
          </div>
        </div>

        <div className="mt-14 flex items-end justify-between gap-4">
          <div>
            <span className="font-mono-ui text-xs uppercase tracking-[.18em] text-primary">Your starter set</span>
            <h2 className="mt-3 font-display text-4xl tracking-[-.04em]">Keep going, gently.</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">Letters A–D · your pace</span>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {signs.map((sign, i) => (
            <button
              data-testid={`card-dashboard-sign-${sign.id}`}
              key={sign.id}
              onClick={() => setLocation(`/lesson/${sign.id}`)}
              className="group rounded-[24px] border border-border bg-card p-3 text-left transition hover:-translate-y-1 hover:shadow-[0_14px_30px_hsl(var(--foreground)/.08)]"
            >
              <div style={{ backgroundColor: sign.tint }} className="relative grid aspect-[1.25] place-items-center overflow-hidden rounded-[18px]">
                <span className="absolute left-3 top-3 font-mono-ui text-[10px]" style={{ color: sign.accent }}>0{i + 1}</span>
                <div className="h-16 w-14 rounded-[55%_45%_45%_55%]" style={{ backgroundColor: sign.accent }}>
                  <span className="relative -top-8 left-1/2 block h-11 w-4 -translate-x-1/2 rounded-full" style={{ backgroundColor: sign.accent }} />
                </div>
                {progress[sign.id] === 100 && (
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#fff8ed] text-primary">
                    <Check size={13} />
                  </span>
                )}
              </div>
              <div className="px-1 pb-1 pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl">{sign.name}</h3>
                  <ChevronRight size={16} className="text-muted-foreground transition group-hover:translate-x-1" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{progress[sign.id] === 0 ? 'Not started' : progress[sign.id] === 100 ? 'Completed' : `${progress[sign.id]}% practiced`}</span>
                  <span>{sign.duration}</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={progress[sign.id]} color={progress[sign.id] === 100 ? 'bg-primary' : 'bg-[#e0ae65]'} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
