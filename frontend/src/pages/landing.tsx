import { useLocation } from 'wouter';
import { ArrowRight, Sparkles, Video } from 'lucide-react';
import { Brand } from '@/components/brand';
import { Button } from '@/components/button';
import { signs } from '@/data/signs';

export function Landing({ signedIn }: { signedIn: boolean }) {
  const [, setLocation] = useLocation();
  return <main className="grain min-h-[100dvh] overflow-hidden bg-background">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-10">
      <Brand />
      <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground md:flex">
        <a href="#how-it-works" data-testid="link-how-it-works">How it works</a>
        <a href="#library" data-testid="link-library">Sign library</a>
        <a href="#why-signlearn" data-testid="link-why-signlearn">Why SignLearn</a>
      </nav>
      <div className="flex items-center gap-2">
        {signedIn ? <Button testId="button-go-dashboard" variant="ghost" onClick={() => setLocation('/dashboard')}>My learning <ArrowRight size={15} /></Button> : <><Button testId="button-log-in" variant="ghost" onClick={() => setLocation('/auth')}>Log in</Button><Button testId="button-start-learning" onClick={() => setLocation('/auth?mode=register')}>Start learning <ArrowRight size={15} /></Button></>}
      </div>
    </header>

    <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 md:grid-cols-[1.03fr_.97fr] md:px-10 md:pb-28 md:pt-20">
      <div className="relative z-10 animate-rise">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d9bd8b] bg-[#fcf0d9] px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#89622b]"><Sparkles size={13} /> Your first sign starts here</div>
        <h1 className="max-w-2xl font-display text-[clamp(3.45rem,8vw,7.25rem)] leading-[.91] tracking-[-.065em] text-foreground">Make space<br /><em className="text-primary">to be understood.</em></h1>
        <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">Learn Indian Sign Language one useful gesture at a time. Watch, try, and build the confidence to connect.</p>
        <div className="mt-9 flex flex-wrap items-center gap-3"><Button testId="button-hero-start" onClick={() => setLocation('/auth?mode=register')}>Learn your first sign <ArrowRight size={17} /></Button><Button testId="button-hero-login" variant="ghost" onClick={() => setLocation('/auth')}>I already have an account</Button></div>
        <div className="mt-12 flex items-center gap-5 text-sm text-muted-foreground"><div className="flex -space-x-2">{['AR', 'NS', 'PK', ''].map((initial, i) => <span key={i} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-background text-[10px] font-bold ${i === 3 ? 'bg-[#f1c98b] text-[#173f38]' : 'bg-primary/15 text-primary'}`}>{i === 3 ? '+2k' : initial}</span>)}</div><span>Learners making their first connection</span></div>
      </div>
      <div className="relative min-h-[440px] md:min-h-[560px]">
        <div className="absolute right-2 top-1 h-[390px] w-[92%] rounded-[42%_58%_54%_46%/42%_39%_61%_58%] bg-[#d6e7dc] md:h-[500px]" />
        <div className="absolute right-0 top-6 h-[330px] w-[88%] rounded-[44%_56%_58%_42%/44%_39%_61%_56%] bg-[#bdd9cd] md:h-[440px]" />
        <div className="absolute left-1 top-10 z-10 w-[75%] rotate-[-5deg] rounded-3xl border border-white/60 bg-[#f8e6ca] p-5 shadow-[0_28px_60px_rgba(37,81,67,.16)] animate-float md:left-10 md:w-[67%] md:p-7">
          <div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#89622b]">Lesson 01 / 05</span><span className="rounded-full bg-[#f4d39b] px-2 py-1 text-[10px] font-bold text-[#805b2a]">4 min</span></div>
          <div className="mt-8 grid aspect-[1.18] place-items-center rounded-2xl bg-[#fcefdc]"><div className="relative h-36 w-32"><div className="absolute bottom-0 left-1/2 h-24 w-20 -translate-x-1/2 rounded-[55%_45%_45%_55%] bg-[#bd633f]" /><div className="absolute left-[43%] top-0 h-28 w-8 rotate-[12deg] rounded-full bg-[#bd633f]" /><div className="absolute left-[63%] top-7 h-24 w-8 rotate-[27deg] rounded-full bg-[#bd633f]" /><div className="absolute left-[73%] top-16 h-20 w-7 rotate-[38deg] rounded-full bg-[#bd633f]" /><div className="absolute left-[22%] top-12 h-20 w-8 rotate-[-25deg] rounded-full bg-[#bd633f]" /></div></div>
          <div className="mt-5"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#a16e40]">Today’s sign</span><h3 className="mt-1 font-display text-3xl text-[#173f38]">Hello</h3></div>
        </div>
        <div className="absolute bottom-14 right-0 z-20 rounded-2xl border border-[#e0c7a0] bg-[#fff8ed] p-4 shadow-[0_18px_35px_rgba(37,81,67,.14)] md:bottom-20 md:right-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Video size={18} /></span><div><p className="text-xs font-bold text-foreground">Practice with feedback</p><p className="mt-0.5 text-[11px] text-muted-foreground">No perfect hands needed</p></div></div></div>
        <span className="absolute bottom-5 left-7 font-display text-7xl text-primary/20 md:bottom-9 md:left-0">01</span>
      </div>
    </section>

    <section id="how-it-works" className="border-y border-border/70 bg-[#edf4ed] px-5 py-20 md:px-10 md:py-28"><div className="mx-auto max-w-7xl"><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><span className="font-mono-ui text-xs uppercase tracking-[.2em] text-primary">A kinder way to learn</span><h2 className="mt-4 max-w-md font-display text-5xl leading-[.98] tracking-[-.04em] md:text-6xl">Small steps.<br /><span className="text-primary">Real progress.</span></h2></div><div className="grid gap-5 sm:grid-cols-3">{[{ n: '01', title: 'See it', body: 'Clear demonstrations show what each movement should feel like.' }, { n: '02', title: 'Try it', body: 'Practice at your own pace with a camera when you are ready.' }, { n: '03', title: 'Keep it', body: 'A gentle streak and visible progress make the next sign feel close.' }].map((item) => <div key={item.n} className="border-t-2 border-primary/30 pt-4"><span className="font-mono-ui text-xs text-primary">{item.n}</span><h3 className="mt-7 font-display text-3xl">{item.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p></div>)}</div></div></div></section>
    <section id="library" className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28"><div className="flex flex-wrap items-end justify-between gap-6"><div><span className="font-mono-ui text-xs uppercase tracking-[.2em] text-primary">The starter shelf</span><h2 className="mt-3 font-display text-5xl tracking-[-.04em] md:text-6xl">Five signs to open with.</h2></div><Button testId="button-library-start" variant="secondary" onClick={() => setLocation('/auth?mode=register')}>See the full path <ArrowRight size={15} /></Button></div><div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{signs.map((sign, i) => <button data-testid={`card-sign-${sign.id}`} key={sign.id} onClick={() => setLocation(`/lesson/${sign.id}`)} className="group text-left"><div style={{ backgroundColor: sign.tint }} className="relative aspect-[.83] overflow-hidden rounded-[28px] p-4 transition-transform duration-300 group-hover:-translate-y-2"><span className="font-mono-ui text-[10px] uppercase tracking-[.15em]" style={{ color: sign.accent }}>0{i + 1}</span><div className="absolute bottom-7 left-1/2 h-24 w-20 -translate-x-1/2 rounded-[50%_50%_40%_45%]" style={{ backgroundColor: sign.accent }}><span className="absolute -top-12 left-2 h-16 w-6 rotate-[-12deg] rounded-full" style={{ backgroundColor: sign.accent }} /><span className="absolute -top-10 left-10 h-14 w-6 rotate-[16deg] rounded-full" style={{ backgroundColor: sign.accent }} /></div></div><h3 className="mt-3 font-display text-2xl">{sign.name}</h3><p className="text-xs text-muted-foreground">{sign.phonetic}</p></button>)}</div></section>
    <section id="why-signlearn" className="bg-[#173f38] px-5 py-20 text-[#fff8ed] md:px-10 md:py-24"><div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-[1fr_.85fr] md:items-end"><div><span className="font-mono-ui text-xs uppercase tracking-[.2em] text-[#f1c98b]">Made for the beginning</span><h2 className="mt-5 max-w-2xl font-display text-5xl leading-[.97] tracking-[-.04em] md:text-7xl">Your hands already know how to learn.</h2></div><div><p className="text-lg leading-8 text-[#c0d3c8]">SignLearn keeps the first step simple: friendly lessons, useful signs, and enough room to make mistakes without feeling watched.</p><Button testId="button-footer-start" variant="light" className="mt-7" onClick={() => setLocation('/auth?mode=register')}>Begin with Hello <ArrowRight size={15} /></Button></div></div></section>
    <footer className="flex flex-wrap items-center justify-between gap-4 bg-[#173f38] px-5 pb-8 text-sm text-[#9fbbb0] md:px-10"><span>© 2026 SignLearn</span><span>Learning ISL, one connection at a time.</span></footer>
  </main>;
}
