import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export type AdminButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function AdminButton({ variant = 'primary', className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: AdminButtonVariant }) {
  const variants: Record<AdminButtonVariant, string> = {
    primary: 'border-blue-700 bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
    danger: 'border-red-700 bg-red-600 text-white hover:bg-red-700',
    ghost: 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
  };
  return <button {...props} className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} />;
}

export function AdminFormField({ label, help, error, required, children }: { label: string; help?: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block space-y-1.5 text-left">
    <span className="block text-xs font-bold text-blue-700 dark:text-blue-400">{label}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}</span>
    {children}
    {error ? <span className="block text-xs text-red-600" role="alert">{error}</span> : help ? <span className="block text-[11px] leading-4 text-slate-500">{help}</span> : null}
  </label>;
}

export function AdminDialog({ open, title, help, onClose, children, footer, size = 'md', destructive = false }: { open: boolean; title: string; help?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; destructive?: boolean }) {
  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);
  const titleId = React.useId();
  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };
  return <div className="fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-slate-950/65 p-4 pt-[8vh] backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <div ref={panelRef} tabIndex={-1} className={`w-full ${widths[size]} max-h-[84vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-700">
        <div>
          <h2 id={titleId} className={`text-base font-black ${destructive ? 'text-red-700' : 'text-slate-950 dark:text-white'}`}>{title}</h2>
          {help && <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{help}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Close ${title}`}><X className="h-4 w-4" /></button>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/60">{footer}</div>}
    </div>
  </div>;
}

export function AdminConfirmDialog({ open, title, message, confirmLabel = 'Confirm', onConfirm, onClose, destructive = false }: { open: boolean; title: string; message: string; confirmLabel?: string; onConfirm: () => void | Promise<void>; onClose: () => void; destructive?: boolean }) {
  return <AdminDialog open={open} title={title} help={destructive ? 'Review this action carefully before continuing.' : undefined} onClose={onClose} size="sm" destructive={destructive} footer={<><AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton><AdminButton variant={destructive ? 'danger' : 'primary'} onClick={() => void onConfirm()}>{confirmLabel}</AdminButton></>}>
    <div className="flex gap-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
      {destructive && <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />}
      <p>{message}</p>
    </div>
  </AdminDialog>;
}

export function AdminInputDialog({ open, title, help, label, value, onChange, onConfirm, onClose, confirmLabel = 'Continue', type = 'text', min, required = true }: { open: boolean; title: string; help?: string; label: string; value: string; onChange: (value: string) => void; onConfirm: () => void | Promise<void>; onClose: () => void; confirmLabel?: string; type?: 'text' | 'number' | 'password'; min?: number; required?: boolean }) {
  const canSubmit = !required || value.trim().length > 0;
  return <AdminDialog open={open} title={title} help={help} onClose={onClose} size="sm" footer={<><AdminButton variant="secondary" onClick={onClose}>Cancel</AdminButton><AdminButton disabled={!canSubmit} onClick={() => void onConfirm()}>{confirmLabel}</AdminButton></>}>
    <AdminFormField label={label} required={required}>
      <input autoFocus type={type} min={min} value={value} onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && canSubmit) void onConfirm(); }} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
    </AdminFormField>
  </AdminDialog>;
}

export function AdminTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`responsive-table-shell overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${className}`}><table className="responsive-data-table w-full border-collapse text-left text-sm">{children}</table></div>;
}

export function AdminPageHeader({ icon, title, section, line1, line2, actions, breadcrumbs }: { icon?: React.ReactNode; title: string; section?: string; line1: string; line2?: string; actions?: React.ReactNode; breadcrumbs?: string[] }) {
  return <header className="admin-page-header mb-4 flex flex-wrap items-start gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
    {icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">{icon}</div>}
    <div className="min-w-0 flex-1">
      {breadcrumbs && breadcrumbs.length > 0 && <nav aria-label="Breadcrumb" className="mb-1.5 flex flex-wrap items-center gap-1 text-[10px] font-semibold text-slate-400">
        {breadcrumbs.map((crumb, index) => <React.Fragment key={`${crumb}-${index}`}><span className={index === breadcrumbs.length - 1 ? 'text-slate-600 dark:text-slate-300' : ''}>{crumb}</span>{index < breadcrumbs.length - 1 && <span aria-hidden="true">›</span>}</React.Fragment>)}
      </nav>}
      <div className="flex flex-wrap items-baseline gap-x-3"><h1 className="truncate text-xl font-black text-slate-950 dark:text-white sm:text-2xl">{title}</h1>{section && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{section}</span>}</div>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{line1}</p>
      {line2 && <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{line2}</p>}
    </div>
    {actions && <>
      <div className="admin-page-actions hidden items-center gap-2 sm:flex">{actions}</div>
      <details className="admin-page-actions-menu relative ml-auto sm:hidden">
        <summary className="min-h-10 cursor-pointer list-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800">Actions</summary>
        <div className="absolute right-0 top-full z-50 mt-1 flex min-w-52 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">{actions}</div>
      </details>
    </>}
  </header>;
}
