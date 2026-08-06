import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureGateModal } from '../components/FeatureGateModal';
import { ALL_FEATURES } from '../constants/features';

// POS is a baseline feature included for every tenant on every plan tier
const ALWAYS_UNLOCKED_FEATURES = ['pos'];

interface TenantFeatureContextType {
  enabledFeatureIds: string[];
  planName: string;
  loading: boolean;
  isImpersonating: boolean;
  hasFeature: (featureId: string) => boolean;
  openFeatureGate: (featureId: string) => void;
  refreshBillingFeatures: () => Promise<void>;
  onOpenUpgradeModal?: () => void;
}

const TenantFeatureContext = createContext<TenantFeatureContextType>({
  enabledFeatureIds: [],
  planName: 'Free Starter',
  loading: true,
  isImpersonating: false,
  hasFeature: () => true,
  openFeatureGate: () => {},
  refreshBillingFeatures: async () => {},
});

export const TenantFeatureProvider: React.FC<{
  children: React.ReactNode;
  isImpersonating?: boolean;
  onOpenUpgradeModal?: () => void;
}> = ({ children, isImpersonating = false, onOpenUpgradeModal }) => {
  const [enabledFeatureIds, setEnabledFeatureIds] = useState<string[]>([]);
  const [planName, setPlanName] = useState('Free Starter');
  const [loading, setLoading] = useState(true);
  const [activeLockedFeature, setActiveLockedFeature] = useState<string | null>(null);

  const fetchBillingFeatures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/billing/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const plan = data.currentPlan ?? data.plan;
      if (plan) {
        setPlanName(plan.name || 'Free Starter');
        let feats: string[] = [];
        if (Array.isArray(plan.featuresJson)) {
          feats = plan.featuresJson;
        } else {
          try {
            feats = JSON.parse(plan.featuresJson || '[]');
          } catch {
            feats = [];
          }
        }
        setEnabledFeatureIds(feats);
      }
    } catch (err) {
      console.error('Failed to load tenant plan feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingFeatures();
  }, []);

  const hasFeature = (featureId: string): boolean => {
    // POS is included on every plan tier by default, regardless of billing configuration
    if (ALWAYS_UNLOCKED_FEATURES.includes(featureId)) return true;
    // SUPER ADMIN / IMPERSONATION BYPASS: Grant ALL features regardless of tenant's subscription tier
    if (isImpersonating) return true;
    if (enabledFeatureIds.includes(featureId)) return true;
    return false;
  };

  const openFeatureGate = (featureId: string) => {
    if (ALWAYS_UNLOCKED_FEATURES.includes(featureId)) return;
    if (!isImpersonating) {
      setActiveLockedFeature(featureId);
    }
  };

  return (
    <TenantFeatureContext.Provider
      value={{
        enabledFeatureIds: isImpersonating
          ? ALL_FEATURES.map((f) => f.id)
          : Array.from(new Set([...enabledFeatureIds, ...ALWAYS_UNLOCKED_FEATURES])),
        planName: isImpersonating ? `${planName} (Super Admin Impersonation Bypass)` : planName,
        loading,
        isImpersonating,
        hasFeature,
        openFeatureGate,
        refreshBillingFeatures: fetchBillingFeatures,
        onOpenUpgradeModal,
      }}
    >
      {children}

      {activeLockedFeature && !isImpersonating && (
        <FeatureGateModal
          featureId={activeLockedFeature}
          currentPlanName={planName}
          onClose={() => setActiveLockedFeature(null)}
          onOpenUpgradeModal={() => {
            if (onOpenUpgradeModal) onOpenUpgradeModal();
          }}
        />
      )}
    </TenantFeatureContext.Provider>
  );
};

export const useTenantFeatures = () => useContext(TenantFeatureContext);
