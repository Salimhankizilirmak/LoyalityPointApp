import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
}

export function GlassPanel({ children, elevated = false, className = '', ...props }: GlassPanelProps) {
  const baseClass = elevated ? 'glass-panel-elevated' : 'glass-panel';
  return (
    <div className={`${baseClass} rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
