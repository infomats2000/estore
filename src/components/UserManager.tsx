import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { useTenantFeatures } from '../context/TenantFeatureContext';
import { ALL_FEATURES, DASHBOARD_TAB_FEATURE_MAP } from '../constants/features';
import { useAdminInteractions } from '../context/AdminInteractionContext';
import { AdminTable } from './ui/AdminUI';

interface UserManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export default function UserManager({ users, onAddUser, onDeleteUser }: UserManagerProps) {
  const interactions = useAdminInteractions();
  const { hasFeature } = useTenantFeatures();
  const dashboardFeatureIds = new Set(Object.values(DASHBOARD_TAB_FEATURE_MAP));
  const permittedModules = ALL_FEATURES
    .filter((feature) => dashboardFeatureIds.has(feature.id) && hasFeature(feature.id))
    .map((feature) => [feature.id, feature.name] as const);
  const [staffUsers, setStaffUsers] = useState<User[]>(users);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [capacity, setCapacity] = useState({ used: 0, limit: 1, remaining: 1 });

  const request = async (path: string, options?: RequestInit) => {
    const response = await fetch(`/api/tenant-staff${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        ...options?.headers,
      },
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Staff account request failed.');
    return result;
  };

  useEffect(() => {
    void request('/')
      .then((result) => {
        if (result.capacity) setCapacity(result.capacity);
        setStaffUsers((result.staff || []).map((staff: any) => ({ id: staff.id, name: staff.name, email: staff.email, permissions: staff.allowedFeatures || [], lastLogin: staff.lastLogin, canManage: staff.canManage !== false })));
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Staff users could not be loaded.'));
  }, []);

  const togglePermission = (module: string) => {
    setPermissions((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must contain at least 8 characters.');
    if (password !== confirmPassword) return setError('Password and confirmation do not match.');
    setSubmitting(true);
    try {
      const result = await request('/', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role: 'Custom Staff', allowedFeatures: permissions }),
      });
      const created: User = {
        id: result.staff.id,
        name: result.staff.name,
        email: result.staff.email,
        permissions: result.staff.allowedFeatures || [],
        lastLogin: result.staff.lastLogin,
        canManage: true,
      };
      setStaffUsers((current) => [...current, created]);
      setCapacity((current) => ({ ...current, used: current.used + 1, remaining: Math.max(0, current.remaining - 1) }));
      onAddUser(created);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPermissions([]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'The staff account could not be created.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await interactions.confirm({ title: 'Delete Staff Login?', message: 'The user will no longer be able to sign in. This action cannot be undone.', confirmLabel: 'Delete Login', destructive: true }))) return;
    setError('');
    try {
      await request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setStaffUsers((current) => current.filter((user) => user.id !== id));
      setCapacity((current) => ({ ...current, used: Math.max(0, current.used - 1), remaining: current.remaining + 1 }));
      onDeleteUser(id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'The staff account could not be deleted.');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 border border-neutral-300 bg-neutral-50 p-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest">Add New Staff Login</h3>
          <p className={`mt-1 text-xs font-bold ${capacity.remaining === 0 ? 'text-rose-600' : 'text-emerald-700'}`}>{capacity.used} of {capacity.limit} tenant users used, including owner/admin.</p>
          <p className="mt-1 text-xs text-neutral-600">Create the staff member’s login credentials and select the modules they may use.</p>
        </div>
        {error && <div role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div><label className="mb-1 block text-xs font-bold">Name</label><input type="text" value={name} onChange={(event) => setName(event.target.value)} className="w-full border border-neutral-400 p-2" required /></div>
          <div><label className="mb-1 block text-xs font-bold">Email/Login</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full border border-neutral-400 p-2" autoComplete="off" required /></div>
          <div>
            <label className="mb-1 block text-xs font-bold">Password</label>
            <div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" className="w-full border border-neutral-400 p-2 pr-10" required /><button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute inset-y-0 right-0 px-3 text-neutral-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
            <p className="mt-1 text-[10px] text-neutral-500">Minimum 8 characters.</p>
          </div>
          <div><label className="mb-1 block text-xs font-bold">Confirm Password</label><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" className="w-full border border-neutral-400 p-2" required /></div>
        </div>
        <div className="space-y-2">
          <span className="text-sm font-bold">Module permissions</span>
          <div className="flex flex-wrap gap-3">{permittedModules.map(([featureId, label]) => <label key={featureId} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={permissions.includes(featureId)} onChange={() => togglePermission(featureId)} />{label}</label>)}</div>
          {permittedModules.length === 0 && <p className="text-xs text-neutral-500">No dashboard modules are currently included in this tenant subscription.</p>}
        </div>
        <button type="submit" disabled={submitting || capacity.remaining === 0} title={capacity.remaining === 0 ? 'Billing tier user limit reached' : undefined} className="flex items-center gap-2 bg-neutral-950 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" />{submitting ? 'CREATING ACCOUNT…' : capacity.remaining === 0 ? 'USER LIMIT REACHED' : 'ADD STAFF USER'}</button>
      </form>

      <AdminTable>
          <thead className="border-b border-neutral-300 bg-neutral-100 font-mono text-xs uppercase"><tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Permissions</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{staffUsers.map((user) => <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50"><td data-label="Name" className="p-3 font-bold">{user.name}{user.canManage === false && <span className="ml-2 rounded bg-amber-50 px-2 py-0.5 text-[9px] uppercase text-amber-700">Tenant admin</span>}</td><td data-label="Email" className="p-3 font-mono">{user.email}</td><td data-label="Permissions" className="p-3"><div className="flex flex-wrap gap-1">{(user.permissions || []).map((permission) => <span key={permission} className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold">{permission}</span>)}</div></td><td data-label="Actions" className="p-3 text-right">{user.canManage !== false && <button type="button" onClick={() => void handleDelete(user.id)} className="text-red-500 hover:text-red-700" aria-label={`Delete ${user.name}`}><Trash2 className="h-4 w-4" /></button>}</td></tr>)}</tbody>
      </AdminTable>
    </div>
  );
}
