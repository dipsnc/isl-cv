import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, CircleHelp } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/button';

export function Auth({ onLogin }: { onLogin: (name: string) => void }) {
  const [, setLocation] = useLocation();
  const register = new URLSearchParams(window.location.search).get('mode') === 'register';
  const [isRegister, setIsRegister] = useState(register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isRegister && (!name || !confirmPassword))) {
      setError('Please fill in the details above to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Use at least 6 characters for your password.');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError('Those passwords do not match yet.');
      return;
    }
    onLogin(isRegister ? name : (email.split('@')[0] || 'Aarav'));
    setLocation('/dashboard');
  };
  return <main className="grain grid min-h-[100dvh] bg-[#edf4ed] lg:grid-cols-[.92fr_1.08fr]">
    <section className="relative hidden overflow-hidden bg-[#173f38] p-10 text-[#fff8ed] lg:flex lg:flex-col lg:justify-between"><Brand light /><div className="relative z-10 max-w-lg pb-10"><span className="font-mono-ui text-xs uppercase tracking-[.2em] text-[#f1c98b]">A gentle beginning</span><h1 className="mt-5 font-display text-7xl leading-[.92] tracking-[-.06em]">Learning a language starts with listening.</h1><p className="mt-7 max-w-sm text-base leading-7 text-[#b6d0c3]">There is no rush here. Just one sign, one try, one new way to say “I see you.”</p></div><div className="absolute -bottom-28 -right-16 h-80 w-80 rounded-full border-[55px] border-[#f1c98b]/20" /><div className="absolute right-16 top-36 h-28 w-28 rotate-12 rounded-[40%] bg-[#f1c98b]/20" /></section>
    <section className="flex flex-col px-5 py-6 md:px-12 lg:px-20"><div className="flex items-center justify-between"><div className="lg:hidden"><Brand /></div><button data-testid="button-auth-back" onClick={() => setLocation('/')} className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Back home</button></div><div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12"><span className="font-mono-ui text-xs uppercase tracking-[.2em] text-primary">{isRegister ? 'Your learning space' : 'Welcome back'}</span><h2 className="mt-4 font-display text-5xl tracking-[-.045em]">{isRegister ? 'Start with one sign.' : 'Good to see you again.'}</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">{isRegister ? 'Create a free space for your first five signs.' : 'Pick up where your hands left off.'}</p><div className="mt-8 grid grid-cols-2 rounded-full bg-muted p-1"><button data-testid="button-auth-login-mode" onClick={() => { setIsRegister(false); setError(''); }} className={`rounded-full py-2.5 text-sm font-semibold transition ${!isRegister ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Log in</button><button data-testid="button-auth-register-mode" onClick={() => { setIsRegister(true); setError(''); }} className={`rounded-full py-2.5 text-sm font-semibold transition ${isRegister ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>Register</button></div><form onSubmit={submit} className="mt-8 space-y-4">{isRegister && <label className="block text-sm font-semibold">Your name<input data-testid="input-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="What should we call you?" className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>}<label className="block text-sm font-semibold">Email<input data-testid="input-email" autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label><label className="block text-sm font-semibold">Password<input data-testid="input-password" autoComplete={isRegister ? 'new-password' : 'current-password'} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>{isRegister && <label className="block text-sm font-semibold">Confirm password<input data-testid="input-confirm-password" autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Enter your password again" className="mt-2 w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" /></label>}{error && <p data-testid="status-auth-error" className="flex items-center gap-2 text-sm text-destructive"><CircleHelp size={15} />{error}</p>}<Button type="submit" testId="button-auth-submit" className="mt-2 w-full">{isRegister ? 'Create my learning space' : 'Continue learning'} <ArrowRight size={16} /></Button></form><button data-testid="button-demo-login" onClick={() => { onLogin('Aarav'); setLocation('/dashboard'); }} className="mt-5 w-full rounded-2xl border border-primary/20 bg-primary/5 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary/10">Try the preview as Aarav</button><p className="mt-7 text-center text-xs leading-5 text-muted-foreground">By continuing, you are making space for a new way to communicate.</p></div></section>
  </main>;
}
