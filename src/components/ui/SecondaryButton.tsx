import React from 'react';

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SecondaryButton({ children, className = '', ...props }: SecondaryButtonProps) {
  return (
    <button className={`btn-secondary font-label-md text-label-md py-4 px-8 rounded-xl whitespace-nowrap transition-all active:scale-[0.98] ${className}`} {...props}>
      {children}
    </button>
  );
}
