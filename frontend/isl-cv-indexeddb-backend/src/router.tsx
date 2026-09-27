import { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';
import { Landing } from '@/pages/landing';
import { Auth } from '@/pages/auth';
import { Dashboard } from '@/pages/dashboard';
import { Lesson } from '@/pages/lesson';
import { Practice } from '@/pages/practice';
import { ProgressPage } from '@/pages/progress-page';
import { clearSession, type SessionUser } from '@/lib/auth';
import type { SignId } from '@/types/sign';

function RedirectToAuth() {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation('/auth'); }, [setLocation]);
  return <div className="grid min-h-[100dvh] place-items-center bg-background text-sm text-muted-foreground">Taking you to your learning space…</div>;
}

export function Router({
  session,
  setSession,
  progress,
  setProgress,
}: {
  session: SessionUser | null;
  setSession: (session: SessionUser | null) => void;
  progress: Record<SignId, number>;
  setProgress: (progress: Record<SignId, number>) => void;
}) {
  const user = session?.name ?? null;
  const signOut = () => { clearSession(); setSession(null); };

  return (
    <Switch>
      <Route path="/"><Landing signedIn={!!session} /></Route>
      <Route path="/auth"><Auth onAuthenticated={setSession} /></Route>
      <Route path="/dashboard">{user ? <Dashboard progress={progress} user={user} onSignOut={signOut} /> : <RedirectToAuth />}</Route>
      <Route path="/lesson/:signId">{user ? <Lesson progress={progress} onSignOut={signOut} /> : <RedirectToAuth />}</Route>
      <Route path="/practice/:signId">{user ? <Practice progress={progress} setProgress={setProgress} onSignOut={signOut} /> : <RedirectToAuth />}</Route>
      <Route path="/progress">{user ? <ProgressPage progress={progress} onSignOut={signOut} /> : <RedirectToAuth />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}
