import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Key, Trash2, Edit2, Shield, Store, CheckCircle2, AlertTriangle, Loader2, X, Search, Lock } from 'lucide-react';

interface SuperAdminUserManagerModalProps {
  onClose: () => void;
  onUsersUpdated?: () => void;
}

export const SuperAdminUserManagerModal: React.FC<SuperAdminUserManagerModalProps> = ({
  onClose,
  onUsersUpdated,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStoreAccessModal, setShowStoreAccessModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields for Add/Edit
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [role, setRole] = useState('TENANT_STAFF');

  const fetchUsersAndTenants = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || '';

      const [usersRes, tenantsRes] = await Promise.all([
        fetch('/api/superadmin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/superadmin/tenants', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch platform users.');

      const usersData = await usersRes.json();
      const tenantsData = await tenantsRes.json();

      setUsers(usersData.users || []);
      setTenants(tenantsData.tenants || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndTenants();
  }, []);

  // Filtered User List
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  // Action 1: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch('/api/superadmin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          isSuperAdmin,
          tenantId: selectedTenantId || undefined,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user account.');

      setSuccessMsg(`User '${data.user.name}' created successfully!`);
      setShowAddModal(false);
      resetForms();
      fetchUsersAndTenants();
      if (onUsersUpdated) onUsersUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password.');

      setSuccessMsg(`Password for '${selectedUser.email}' reset successfully!`);
      setShowResetModal(false);
      resetForms();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action 3: Update Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          isSuperAdmin,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user profile.');

      setSuccessMsg(`User '${data.user.name}' profile updated!`);
      setShowEditModal(false);
      resetForms();
      fetchUsersAndTenants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action 4: Assign Store Access
  const handleAssignStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedTenantId) return;
    setError('');
    setSuccessMsg('');

    try {
      setSubmitting(true);
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/users/${selectedUser.id}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: selectedTenantId,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign store access.');

      setSuccessMsg('Store access updated successfully!');
      setShowStoreAccessModal(false);
      resetForms();
      fetchUsersAndTenants();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Action 5: Delete User
  const handleDeleteUser = async (user: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user '${user.name}' (${user.email})?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete user.');

      setSuccessMsg(`User '${user.email}' deleted.`);
      fetchUsersAndTenants();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForms = () => {
    setName('');
    setEmail('');
    setPassword('');
    setIsSuperAdmin(false);
    setSelectedTenantId('');
    setRole('TENANT_STAFF');
    setSelectedUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">Super Admin User Management</h2>
              <p className="text-xs text-slate-500 font-medium">Manage platform users, roles, password resets, and store permissions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header Action Bar */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600 transition shadow-2xs"
            />
          </div>

          <button
            onClick={() => {
              resetForms();
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add New User
          </button>
        </div>

        {/* Status Messages */}
        {(error || successMsg) && (
          <div className="px-6 pt-4 shrink-0">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* User Table Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
              <p className="text-sm font-semibold">Loading platform users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">No platform users found matching your search.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">System Role</th>
                    <th className="p-3.5">Store Access</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredUsers.map((u) => {
                    const initials = (u.name || u.email).substring(0, 2).toUpperCase();
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{u.name}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {u.isSuperAdmin ? (
                            <span className="px-2.5 py-1 rounded-md bg-purple-100 text-purple-900 font-extrabold text-[10px] uppercase border border-purple-200 inline-flex items-center gap-1">
                              <Shield className="w-3 h-3 text-purple-600" /> Super Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                              Tenant User
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {u.tenantUsers?.length === 0 ? (
                              <span className="text-slate-400 italic font-normal text-[11px]">No Store Assigned</span>
                            ) : (
                              u.tenantUsers?.map((tu: any) => (
                                <span
                                  key={tu.id}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-100 font-bold text-[10px] inline-flex items-center gap-1"
                                >
                                  <Store className="w-3 h-3 text-indigo-600" />
                                  <span>{tu.tenant?.name || 'Store'}</span>
                                  <span className="text-[9px] text-indigo-500 uppercase">({tu.role})</span>
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setName(u.name);
                              setEmail(u.email);
                              setIsSuperAdmin(!!u.isSuperAdmin);
                              setShowEditModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200 transition"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setPassword('');
                              setShowResetModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200 transition"
                            title="Reset Password"
                          >
                            <Key className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setSelectedTenantId('');
                              setRole('TENANT_STAFF');
                              setShowStoreAccessModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-[11px] border border-indigo-200 transition"
                            title="Assign Store Access"
                          >
                            <Store className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SUB-MODAL 1: Add New User */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Add New User</h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Store Access (Optional)</label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">No Store Assigned</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTenantId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                    >
                      <option value="TENANT_OWNER">Store Owner</option>
                      <option value="TENANT_ADMIN">Store Manager</option>
                      <option value="TENANT_STAFF">Staff / Cashier</option>
                    </select>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900 pt-2">
                  <input
                    type="checkbox"
                    checked={isSuperAdmin}
                    onChange={(e) => setIsSuperAdmin(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Grant Super Admin Platform Access</span>
                </label>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                  >
                    {submitting ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 2: Reset Password */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Reset Password: {selectedUser.name}</h3>
                <button onClick={() => setShowResetModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Enter new password..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
                  >
                    {submitting ? 'Resetting...' : 'Set New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 3: Edit Profile */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Edit User: {selectedUser.name}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-purple-900 pt-2">
                  <input
                    type="checkbox"
                    checked={isSuperAdmin}
                    onChange={(e) => setIsSuperAdmin(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Super Admin Global Access</span>
                </label>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                  >
                    {submitting ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SUB-MODAL 4: Store Access */}
        {showStoreAccessModal && selectedUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-slate-900">Assign Store Access: {selectedUser.name}</h3>
                <button onClick={() => setShowStoreAccessModal(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAssignStore} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Store Tenant *</label>
                  <select
                    required
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="">Select a Store...</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                  >
                    <option value="TENANT_OWNER">Store Owner</option>
                    <option value="TENANT_ADMIN">Store Manager</option>
                    <option value="TENANT_STAFF">Staff / Cashier</option>
                  </select>
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowStoreAccessModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition"
                  >
                    {submitting ? 'Saving...' : 'Grant Access'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
