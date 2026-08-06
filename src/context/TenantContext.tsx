import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Plan {
  id: string;
  name: string;
  code: string;
  priceMonthly: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxStaff: number;
  customDomainAllowed: boolean;
  featuresJson: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  customDomain?: string;
  customDomainVerified?: boolean;
  status: string;
  logoUrl?: string;
  plan?: Plan;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  isSuperAdmin?: boolean;
  role?: string;
  tenantId?: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  user: UserSession | null;
  plans: Plan[];
  loading: boolean;
  fetchTenantInfo: () => Promise<void>;
  setUserSession: (user: UserSession | null) => void;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  user: null,
  plans: [],
  loading: true,
  fetchTenantInfo: async () => {},
  setUserSession: () => {},
  isSuperAdmin: false,
  isTenantOwner: false,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<UserSession | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenantInfo = async () => {
    try {
      setLoading(true);
      // Fetch store settings for current resolved tenant
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setTenant({
          id: data.tenantId || 'default-tenant',
          name: data.storeName || 'INFOMAT',
          slug: data.slug || 'default-tenant',
          customDomain: data.website || undefined,
          status: 'ACTIVE',
        });
      }
      
      // Fetch public plans
      const plansRes = await fetch('/api/onboarding/plans');
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);
      }
    } catch (error) {
      console.error('Failed to load tenant info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantInfo();
  }, []);

  return (
    <TenantContext.Provider
      value={{
        tenant,
        user,
        plans,
        loading,
        fetchTenantInfo,
        setUserSession: setUser,
        isSuperAdmin: !!user?.isSuperAdmin,
        isTenantOwner: user?.role === 'TENANT_OWNER' || !!user?.isSuperAdmin,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);
