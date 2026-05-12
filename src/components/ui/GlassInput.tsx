import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

export function GlassInput({ icon, label, id, className = '', ...props }: GlassInputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  return (
    <div className="relative flex-1">
      {label && <label htmlFor={inputId} className="sr-only">{label}</label>}
      {icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant flex items-center">
          {icon}
        </span>
      )}
      <input 
        id={inputId}
        className={`w-full input-glass rounded-xl py-4 ${icon ? 'pl-12' : 'pl-4'} pr-4 font-body-md text-body-md focus:ring-0 min-h-[44px] ${className}`} 
        {...props} 
      />
    </div>
  );
}
