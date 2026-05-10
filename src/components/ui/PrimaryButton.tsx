import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({ children, className = '', ...props }: PrimaryButtonProps) {
  return (
    <button className={`btn-primary font-label-md text-label-md py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${className}`} {...props}>
      {children}
    </button>
  );
}
