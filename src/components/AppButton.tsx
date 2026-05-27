import React from 'react';

export function AppButton({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  id,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <button
      id={id}
      disabled={disabled}
      onClick={onClick}
      className={`
      rounded-full py-4 px-12 transition-all font-medium text-lg flex items-center justify-center gap-2
      ${variant === 'primary'
          ? 'bg-slate-100 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98]'
          : variant === 'secondary'
            ? 'bg-slate-800/80 text-white border border-white/10 active:scale-[0.98]'
            : variant === 'ghost'
              ? 'bg-white/5 text-white border border-white/10 opacity-70'
              : 'bg-transparent border border-white/30 text-white hover:bg-white/5 active:scale-[0.98]'}
      ${disabled ? 'opacity-20 cursor-not-allowed' : 'hover:brightness-110'}
      ${className}
    `}
    >
      {children}
    </button>
  );
}
