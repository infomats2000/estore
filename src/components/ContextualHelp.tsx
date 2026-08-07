import React from 'react';
import { CircleHelp } from 'lucide-react';

interface ContextualHelpProps {
  line1: React.ReactNode;
  line2: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function ContextualHelp({ line1, line2, compact = false, className = '' }: ContextualHelpProps) {
  return (
    <div
      className={`flex items-start gap-2 border border-sky-200 bg-sky-50 text-slate-700 dark:border-sky-900/70 dark:bg-sky-950/30 dark:text-slate-200 ${compact ? 'rounded-lg px-3 py-2' : 'rounded-xl px-4 py-3'} ${className}`}
      role="note"
      aria-label="Help"
    >
      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
      <div className="min-w-0 text-xs leading-5">
        <p>{line1}</p>
        <p className="text-slate-500 dark:text-slate-400">{line2}</p>
      </div>
    </div>
  );
}
