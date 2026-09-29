import React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, WarningTriangle, InfoCircle } from 'iconoir-react';

export function Alert({ variant = 'info', title, children, className, onClose }) {
  const configs = {
    info: {
      border: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200',
      icon: <InfoCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />,
    },
    success: {
      border: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
      icon: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      border: 'border-rose-500/30 bg-rose-950/25 text-rose-200',
      icon: <WarningTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    },
    warning: {
      border: 'border-amber-500/30 bg-amber-950/20 text-amber-200',
      icon: <WarningTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
  };

  const current = configs[variant] || configs.info;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 rounded-xl border p-4 text-sm shadow-sm transition-all',
        current.border,
        className
      )}
    >
      {current.icon}
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <div className="text-xs sm:text-sm leading-relaxed opacity-95">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-xs opacity-70 hover:opacity-100 hover:underline ml-2"
        >
          Fechar
        </button>
      )}
    </div>
  );
}
