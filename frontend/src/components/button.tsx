import type { ReactNode } from 'react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  testId,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'light';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  testId: string;
}) {
  const variants = {
    primary:
      'bg-primary text-primary-foreground shadow-[0_8px_20px_hsl(var(--primary)/.18)] hover:-translate-y-0.5',
    secondary: 'bg-secondary text-secondary-foreground hover:-translate-y-0.5',
    ghost: 'text-foreground hover:bg-muted',
    light: 'bg-[#fff8ed] text-[#173f38] hover:bg-[#f1c98b]',
  };

  return (
    <button
      type={type}
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}