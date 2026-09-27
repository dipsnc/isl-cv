import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Router } from '@/router';
import { getStoredProgress } from '@/lib/progress';
import type { SignId } from '@/types/sign';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState<string | null>(() => localStorage.getItem('signlearn-user'));
  const [progress, setProgress] = useState<Record<SignId, number>>(() => getStoredProgress());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary resetKey={user}>
            <Router user={user} setUser={setUser} progress={progress} setProgress={setProgress} />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
