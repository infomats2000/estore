import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, ExternalLink, HelpCircle, Send, X } from 'lucide-react';
import { answerAdminQuestion, ASSISTANT_SUGGESTIONS, AssistantAnswer, AssistantModule } from '../utils/adminAssistant';

interface Message { id: number; sender: 'assistant' | 'user'; text: string; answer?: AssistantAnswer }

interface LauncherPosition { x: number; y: number }
const LAUNCHER_STORAGE_KEY = 'tenant-help-assistant-position';
const LAUNCHER_MARGIN = 12;

export function AdminHelpAssistant({ modules, currentModuleId, onNavigate }: { modules: AssistantModule[]; currentModuleId: string; onNavigate: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ id: 1, sender: 'assistant', text: 'Hello! Ask me how to use the app, or tell me the task you want to complete. I will only suggest pages you are permitted to access.' }]);
  const [launcherPosition, setLauncherPosition] = useState<LauncherPosition | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAUNCHER_STORAGE_KEY) || 'null');
      return typeof saved?.x === 'number' && typeof saved?.y === 'number' ? saved : null;
    } catch { return null; }
  });
  const nextId = useRef(2);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const currentLabel = useMemo(() => modules.find(module => module.id === currentModuleId)?.label || 'Dashboard', [modules, currentModuleId]);

  const clampPosition = (position: LauncherPosition): LauncherPosition => {
    const width = launcherRef.current?.offsetWidth || 56;
    const height = launcherRef.current?.offsetHeight || 48;
    return {
      x: Math.min(Math.max(LAUNCHER_MARGIN, position.x), Math.max(LAUNCHER_MARGIN, window.innerWidth - width - LAUNCHER_MARGIN)),
      y: Math.min(Math.max(LAUNCHER_MARGIN, position.y), Math.max(LAUNCHER_MARGIN, window.innerHeight - height - LAUNCHER_MARGIN)),
    };
  };

  useEffect(() => {
    const keepOnScreen = () => setLauncherPosition(previous => previous ? clampPosition(previous) : previous);
    keepOnScreen();
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, []);

  const handleLauncherPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: rect.left, originY: rect.top, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleLauncherPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (drag.moved) {
      event.preventDefault();
      setLauncherPosition(clampPosition({ x: drag.originX + dx, y: drag.originY + dy }));
    }
  };

  const handleLauncherPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    suppressClickRef.current = drag.moved;
    if (drag.moved) {
      const position = clampPosition({ x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY });
      setLauncherPosition(position);
      try { localStorage.setItem(LAUNCHER_STORAGE_KEY, JSON.stringify(position)); } catch {}
    }
    dragRef.current = null;
  };

  const ask = (value: string) => {
    const clean = value.trim();
    if (!clean) return;
    const answer = answerAdminQuestion(clean, modules, currentModuleId);
    setMessages(previous => [...previous, { id: nextId.current++, sender: 'user', text: clean }, { id: nextId.current++, sender: 'assistant', text: answer.text, answer }]);
    setQuestion('');
  };

  return <>
    <button
      ref={launcherRef}
      type="button"
      onClick={() => { if (suppressClickRef.current) { suppressClickRef.current = false; return; } setOpen(true); }}
      onPointerDown={handleLauncherPointerDown}
      onPointerMove={handleLauncherPointerMove}
      onPointerUp={handleLauncherPointerUp}
      onPointerCancel={() => { dragRef.current = null; }}
      style={launcherPosition ? { left: launcherPosition.x, top: launcherPosition.y } : undefined}
      className={`fixed z-[180] flex min-h-12 touch-none select-none items-center gap-2 rounded-full border border-blue-800 bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-xl hover:bg-blue-800 ${launcherPosition ? '' : 'bottom-5 right-5'}`}
      aria-label="Open help assistant; drag to move"
      aria-describedby="help-assistant-drag-hint"
      aria-expanded={open}
      title="Drag to move or click to open"
    >
      <HelpCircle className="h-5 w-5" /><span className="hidden sm:inline">Help Assistant</span>
    </button>
    <span id="help-assistant-drag-hint" className="sr-only">This floating button can be dragged anywhere on the visible screen.</span>
    {open && <aside className="fixed inset-y-0 right-0 z-[290] flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="false" aria-label="Tenant help assistant">
      <header className="flex items-start justify-between border-b border-slate-200 bg-slate-950 px-4 py-4 text-white">
        <div className="flex gap-3"><Bot className="mt-0.5 h-6 w-6 text-blue-300" /><div><h2 className="font-black">Help Assistant</h2><p className="text-xs text-slate-300">Current page: {currentLabel}</p></div></div>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Close help assistant"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4" aria-live="polite">
        {messages.map(message => <div key={message.id} className={`max-w-[90%] rounded-xl px-3 py-2.5 text-sm leading-5 ${message.sender === 'user' ? 'ml-auto bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>
          <p>{message.text}</p>
          {message.answer?.moduleId && <button type="button" onClick={() => { onNavigate(message.answer!.moduleId!); setOpen(false); }} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-800">Open {message.answer.moduleLabel}<ExternalLink className="h-3.5 w-3.5" /></button>}
        </div>)}
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">{ASSISTANT_SUGGESTIONS.map(suggestion => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="shrink-0 rounded-full border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">{suggestion}</button>)}</div>
        <form onSubmit={event => { event.preventDefault(); ask(question); }} className="flex gap-2">
          <label className="sr-only" htmlFor="admin-assistant-question">Ask the help assistant</label>
          <input id="admin-assistant-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="How do I…?" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-600" autoFocus />
          <button type="submit" disabled={!question.trim()} className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-700 text-white disabled:opacity-40" aria-label="Send question"><Send className="h-4 w-4" /></button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Guidance is based on your available app modules. Confirm important financial or stock decisions before saving.</p>
      </div>
    </aside>}
  </>;
}
