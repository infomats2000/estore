import React from 'react';
import { Lock, Sparkles, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { ALL_FEATURES } from '../constants/features';

interface FeatureGateModalProps {
  featureId: string;
  currentPlanName?: string;
  onClose: () => void;
  onOpenUpgradeModal: () => void;
}

export const FeatureGateModal: React.FC<FeatureGateModalProps> = ({
  featureId,
  currentPlanName = 'Free Starter',
  onClose,
  onOpenUpgradeModal,
}) => {
  const featObj = ALL_FEATURES.find((f) => f.id === featureId);
  const featureName = featObj ? featObj.name : featureId;
  const featureDesc = featObj ? featObj.description : 'This module feature is locked on your current plan tier.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <Lock className="w-8 h-8" />
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-widest border border-amber-300 w-fit mx-auto mb-2">
          🔒 Premium Feature Locked
        </span>

        <h3 className="font-extrabold text-xl text-slate-900 tracking-tight mb-1">
          Unlock {featureName}
        </h3>

        <p className="text-xs text-slate-500 font-medium mb-6 px-2">
          {featureDesc}
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left space-y-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Current Subscription</div>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-slate-900">{currentPlanName}</span>
            <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              Not Included
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenUpgradeModal();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Upgrade Plan to Unlock Feature</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
