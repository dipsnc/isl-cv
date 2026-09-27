import { Hand } from 'lucide-react';
import { Link } from 'wouter';

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" data-testid="link-brand" className={`flex items-center gap-2.5 ${light ? 'text-[#fffaf2]' : 'text-foreground'}`}>
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${light ? 'bg-[#f1c98b] text-[#173f38]' : 'bg-primary text-primary-foreground'}`}><Hand size={18} strokeWidth={2.4} /></span>
    <span className="font-display text-[1.35rem] font-semibold tracking-[-.03em]">SignLearn</span>
  </Link>;
}
