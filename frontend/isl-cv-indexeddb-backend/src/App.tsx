import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Router } from '@/router';
import { getSession, type SessionUser } from '@/lib/auth';
import { getProgress, saveProgress } from '@/lib/progress';
import { initialProgress } from '@/data/signs';
import type { SignId } from '@/types/sign';

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<SessionUser | null>(() => getSession());
  const [progress, setProgressState] = useState<Record<SignId, number>>(initialProgress);

  // Whenever the logged-in user changes, load *their* progress out of
  // IndexedDB (falls back to the starter values if they're new / logged out).
  useEffect(() => {
    let cancelled = false;
    if (session) {
      getProgress(session.email).then((p) => { if (!cancelled) setProgressState(p); });
    } else {
      setProgressState(initialProgress);
    }
    return () => { cancelled = true; };
  }, [session?.email]);

  const setProgress = (next: Record<SignId, number>) => {
    setProgressState(next);
    if (session) saveProgress(session.email, next);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary resetKey={session?.email ?? null}>
            <Router session={session} setSession={setSession} progress={progress} setProgress={setProgress} />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
