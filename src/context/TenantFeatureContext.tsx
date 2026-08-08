import React, { createContext, useContext, useState, useEffect } from 'react';
import { FeatureGateModal } from '../components/FeatureGateModal';
import { ALL_FEATURES, resolvePlanFeatureIds } from '../constants/features';

// POS is a baseline feature included for every tenant on every plan tier
const ALWAYS_UNLOCKED_FEATURES = ['pos'];

interface TenantFeatureContextType {
  enabledFeatureIds: string[];
  planName: string;
  subscriptionStatus: string;
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
  subscriptionStatus: 'inactive',
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
  const [subscriptionStatus, setSubscriptionStatus] = useState('inactive');
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLockedFeature, setActiveLockedFeature] = useState<string | null>(null);

  const fetchBillingFeatures = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/billing/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setEnabledFeatureIds([]);
        setSubscriptionStatus('inactive');
        return;
      }

      const data = await res.json();
      const plan = data.currentPlan ?? data.plan;
      setSubscriptionStatus(String(data.tenant?.subscriptionStatus || 'inactive').toLowerCase());
      setCurrentPeriodEnd(data.tenant?.currentPeriodEnd || null);
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
        setEnabledFeatureIds(resolvePlanFeatureIds(plan.code, feats));
      } else {
        setEnabledFeatureIds([]);
      }
    } catch (err) {
      console.error('Failed to load tenant plan feature flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBillingFeatures();
    const refresh = () => void fetchBillingFeatures();
    window.addEventListener('tenant-plan-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('tenant-plan-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const hasFeature = (featureId: string): boolean => {
    // SUPER ADMIN / IMPERSONATION BYPASS: Grant ALL features regardless of tenant's subscription tier
    if (isImpersonating) return true;
    if (!['active', 'trialing'].includes(subscriptionStatus)) return false;
    if (currentPeriodEnd && subscriptionStatus !== 'trialing' && new Date(currentPeriodEnd).getTime() < Date.now()) return false;
    // POS is included on every active plan tier by default.
    if (ALWAYS_UNLOCKED_FEATURES.includes(featureId)) return true;
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
          : Array.from(new Set([
              ...enabledFeatureIds,
              ...(['active', 'trialing'].includes(subscriptionStatus) ? ALWAYS_UNLOCKED_FEATURES : []),
            ])),
        planName: isImpersonating ? `${planName} (Super Admin Impersonation Bypass)` : planName,
        subscriptionStatus,
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
