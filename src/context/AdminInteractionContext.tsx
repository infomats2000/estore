import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AdminButton, AdminConfirmDialog, AdminDialog, AdminInputDialog } from '../components/ui/AdminUI';

type ConfirmOptions = { title: string; message: string; confirmLabel?: string; destructive?: boolean };
type PromptOptions = { title: string; help?: string; label: string; initialValue?: string; confirmLabel?: string; required?: boolean; type?: 'text' | 'number' | 'password' };
type NoticeOptions = { title: string; message: string };
type InteractionState = ({ kind: 'confirm'; options: ConfirmOptions } | { kind: 'prompt'; options: PromptOptions } | { kind: 'notice'; options: NoticeOptions }) | null;

interface AdminInteractionApi {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  notify: (options: NoticeOptions) => Promise<void>;
}

const AdminInteractionContext = createContext<AdminInteractionApi | null>(null);

export function AdminInteractionProvider({ children }: { children: React.ReactNode }) {
  const [interaction, setInteraction] = useState<InteractionState>(null);
  const [value, setValue] = useState('');
  const resolver = useRef<((result: boolean | string | null) => void) | null>(null);

  const finish = (result: boolean | string | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setInteraction(null);
  };

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => {
    resolver.current = resolve as (result: boolean | string | null) => void;
    setInteraction({ kind: 'confirm', options });
  }), []);

  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>(resolve => {
    resolver.current = resolve as (result: boolean | string | null) => void;
    setValue(options.initialValue || '');
    setInteraction({ kind: 'prompt', options });
  }), []);
  const notify = useCallback((options: NoticeOptions) => new Promise<void>(resolve => {
    resolver.current = () => resolve();
    setInteraction({ kind: 'notice', options });
  }), []);

  return <AdminInteractionContext.Provider value={{ confirm, prompt, notify }}>
    {children}
    <AdminConfirmDialog open={interaction?.kind === 'confirm'} title={interaction?.kind === 'confirm' ? interaction.options.title : ''} message={interaction?.kind === 'confirm' ? interaction.options.message : ''} confirmLabel={interaction?.kind === 'confirm' ? interaction.options.confirmLabel : undefined} destructive={interaction?.kind === 'confirm' ? interaction.options.destructive : false} onClose={() => finish(false)} onConfirm={() => finish(true)} />
    <AdminInputDialog open={interaction?.kind === 'prompt'} title={interaction?.kind === 'prompt' ? interaction.options.title : ''} help={interaction?.kind === 'prompt' ? interaction.options.help : undefined} label={interaction?.kind === 'prompt' ? interaction.options.label : ''} value={value} onChange={setValue} required={interaction?.kind === 'prompt' ? interaction.options.required : true} type={interaction?.kind === 'prompt' ? interaction.options.type : 'text'} confirmLabel={interaction?.kind === 'prompt' ? interaction.options.confirmLabel : undefined} onClose={() => finish(null)} onConfirm={() => finish(value)} />
    <AdminDialog open={interaction?.kind === 'notice'} title={interaction?.kind === 'notice' ? interaction.options.title : ''} onClose={() => finish(null)} size="sm" footer={<AdminButton onClick={() => finish(null)}>OK</AdminButton>}><p className="text-sm leading-6 text-slate-700">{interaction?.kind === 'notice' ? interaction.options.message : ''}</p></AdminDialog>
  </AdminInteractionContext.Provider>;
}

export function useAdminInteractions(): AdminInteractionApi {
  const context = useContext(AdminInteractionContext);
  if (!context) throw new Error('useAdminInteractions must be used within AdminInteractionProvider');
  return context;
}
