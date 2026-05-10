import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function GlassInput({ icon, className = '', ...props }: GlassInputProps) {
  return (
    <div className="relative flex-1">
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center">
          {icon}
        </span>
      )}
      <input 
        className={`w-full input-glass rounded-xl py-4 ${icon ? 'pl-12' : 'pl-4'} pr-4 font-body-md text-body-md focus:ring-0 ${className}`} 
        {...props} 
      />
    </div>
  );
}
