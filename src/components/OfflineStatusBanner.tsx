import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineStatusBanner() {
  const { isOnline, wasOffline, queuedCount, isSyncing, lastSyncedAt, triggerManualSync } = useNetworkStatus();

  if (isOnline && !wasOffline && queuedCount === 0) {
    return null;
  }

  return (
    <div className="w-full font-mono text-[11px] font-bold tracking-wider text-slate-950 transition-all duration-300">
      {!isOnline ? (
        <div className="bg-amber-400 border-b border-amber-500 py-1.5 px-4 flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-slate-950 flex-shrink-0" />
            <span>⚡ OFFLINE MODE ACTIVE — Running from Local Cache &amp; Persistent Storage</span>
          </div>
          <div className="flex items-center gap-3">
            {queuedCount > 0 && (
              <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[10px] uppercase font-mono font-black">
                {queuedCount} {queuedCount === 1 ? 'Action' : 'Actions'} Queued
              </span>
            )}
            <span className="hidden sm:inline text-[10px] text-slate-900 uppercase font-black">Local Orders Allowed</span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500 border-b border-emerald-600 text-white py-1.5 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-white flex-shrink-0" />
            <span>ONLINE RESTORED — Cloud Connection Re-established</span>
            {lastSyncedAt && <span className="text-[10px] opacity-90">(Last Synced: {lastSyncedAt})</span>}
          </div>
          <div className="flex items-center gap-3">
            {queuedCount > 0 ? (
              <button
                type="button"
                onClick={triggerManualSync}
                disabled={isSyncing}
                className="bg-slate-950 text-emerald-300 hover:text-white px-2.5 py-1 rounded text-[10px] font-black uppercase flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `Sync ${queuedCount} Items`}</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> All Transactions Synced
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
