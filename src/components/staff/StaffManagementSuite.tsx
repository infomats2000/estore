import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Lock, 
  Key, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Search, 
  Sliders, 
  Building2, 
  UserCheck, 
  Zap, 
  Eye, 
  Award,
  ChevronRight
} from 'lucide-react';
import { StaffUserProfile, StaffUserRole } from '../../types';
import { 
  ALL_ERP_FEATURE_PERMISSIONS, 
  DEFAULT_STAFF_PROFILES, 
  getRoleTemplatePermissions 
} from '../../utils/staffPermissionEngine';

interface StaffManagementSuiteProps {
  currentSimulatedUser: StaffUserProfile;
  onSelectSimulatedUser: (user: StaffUserProfile) => void;
  onShowAlert?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export default function StaffManagementSuite({
  currentSimulatedUser,
  onSelectSimulatedUser,
  onShowAlert
}: StaffManagementSuiteProps) {
  const [staffUsers, setStaffUsers] = useState<StaffUserProfile[]>(DEFAULT_STAFF_PROFILES);
  const [activeTab, setActiveTab] = useState<'users' | 'permission_matrix' | 'simulator'>('users');
  const [selectedStaff, setSelectedStaff] = useState<StaffUserProfile>(DEFAULT_STAFF_PROFILES[0]);

  // Modal State for New Staff User
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<StaffUserRole>('Sales Executive');

  const handleToggleStaffStatus = (staffId: string) => {
    setStaffUsers(prev => prev.map(u => u.id === staffId ? { ...u, active: !u.active } : u));
    onShowAlert?.(`Staff user status updated!`, 'info');
  };

  const handleToggleFeaturePermission = (staffId: string, featureKey: string) => {
    setStaffUsers(prev => prev.map(u => {
      if (u.id === staffId) {
        const hasPerm = u.allowedFeatures.includes(featureKey);
        const newPerms = hasPerm 
          ? u.allowedFeatures.filter(k => k !== featureKey)
          : [...u.allowedFeatures, featureKey];

        const updated = { ...u, allowedFeatures: newPerms };
        if (selectedStaff.id === staffId) setSelectedStaff(updated);
        return updated;
      }
      return u;
    }));
    onShowAlert?.(`Feature permission updated for ${selectedStaff.name}!`, 'success');
  };

  const handleApplyRoleTemplate = (staffId: string, role: StaffUserRole) => {
    const defaultPerms = getRoleTemplatePermissions(role);
    setStaffUsers(prev => prev.map(u => {
      if (u.id === staffId) {
        const updated = { ...u, role, allowedFeatures: defaultPerms };
        if (selectedStaff.id === staffId) setSelectedStaff(updated);
        return updated;
      }
      return u;
    }));
    onShowAlert?.(`Role template "${role}" permissions applied to ${selectedStaff.name}!`, 'success');
  };

  const handleCreateStaffUser = () => {
    if (!newName.trim() || !newEmail.trim()) {
      onShowAlert?.('Please enter staff name and email.', 'error');
      return;
    }

    const defaultPerms = getRoleTemplatePermissions(newRole);
    const newUser: StaffUserProfile = {
      id: 'STAFF-' + Math.floor(Math.random() * 9000 + 1000),
      name: newName,
      email: newEmail,
      role: newRole,
      active: true,
      allowedFeatures: defaultPerms,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never'
    };

    setStaffUsers(prev => [...prev, newUser]);
    setSelectedStaff(newUser);
    setShowAddUserModal(false);
    setNewName('');
    setNewEmail('');
    onShowAlert?.(`New staff user "${newName}" created successfully with ${newRole} permissions!`, 'success');
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-white shadow-xl flex flex-wrap items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/30 border border-blue-400/30 rounded-2xl backdrop-blur-md">
            <ShieldCheck className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest bg-blue-950 text-blue-300 rounded border border-blue-800">
              ADMIN CONTROL CENTER &amp; RBAC SUITE
            </span>
            <h2 className="text-xl font-black tracking-tight mt-1">Staff User Management &amp; Feature Access Matrix</h2>
            <p className="text-xs text-slate-400">Admin holds super-user rights &bull; Grant/revoke feature access to staff user dashboards</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 font-mono"
        >
          <Plus className="w-4 h-4" /> Create New Staff User
        </button>
      </div>

      {/* Simulator Active Banner */}
      <div className="bg-purple-950/40 p-4 rounded-2xl border border-purple-800/60 flex flex-wrap items-center justify-between gap-3 text-purple-300">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-400" />
          <span>Active Simulated Logged-In User: <strong className="text-white">{currentSimulatedUser.name} ({currentSimulatedUser.role})</strong></span>
        </div>

        <div className="flex gap-2">
          {staffUsers.map(u => (
            <button
              key={u.id}
              onClick={() => onSelectSimulatedUser(u)}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                currentSimulatedUser.id === u.id 
                  ? 'bg-purple-600 text-white border-purple-400' 
                  : 'bg-slate-900 text-purple-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Simulate {u.role}
            </button>
          ))}
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 flex flex-wrap gap-2 font-sans font-bold">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Staff User Directory ({staffUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('permission_matrix')}
          className={`px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
            activeTab === 'permission_matrix' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" /> Granular Feature Permission Matrix
        </button>
      </div>

      {/* TAB 1: STAFF USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
          {/* Staff List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans font-bold">Staff Accounts</h3>
            <div className="space-y-3">
              {staffUsers.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedStaff(u)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    selectedStaff?.id === u.id 
                      ? 'bg-slate-900 border-blue-500/50 shadow-xl' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-950 text-blue-300 rounded border border-blue-800">{u.role}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                      u.active ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-rose-950 text-rose-400 border-rose-800'
                    }`}>
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-100 mt-2 font-sans">{u.name}</h4>
                  <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                    <span>{u.email}</span>
                    <strong className="text-purple-300">{u.role === 'Admin' ? 'All Features' : `${u.allowedFeatures.length} Granted`}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Detail & Role Template Assignment */}
          <div className="lg:col-span-2 space-y-4">
            {selectedStaff && (
              <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded border border-blue-800 font-sans">
                      {selectedStaff.role}
                    </span>
                    <h3 className="text-lg font-black text-slate-100 mt-1 font-sans">{selectedStaff.name}</h3>
                    <span className="text-xs text-slate-400">{selectedStaff.email} &bull; Joined: {selectedStaff.createdAt}</span>
                  </div>

                  <div className="flex gap-2 font-sans">
                    <button
                      onClick={() => handleToggleStaffStatus(selectedStaff.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        selectedStaff.active ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900' : 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                      }`}
                    >
                      {selectedStaff.active ? 'Deactivate Staff User' : 'Activate Staff User'}
                    </button>
                  </div>
                </div>

                {/* Role Template Presets */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block font-sans">1-Click Role Template Preset Assignment</span>
                  <div className="flex flex-wrap gap-2">
                    {(['Admin', 'Sales Executive', 'Warehouse Manager', 'Procurement Officer', 'Accountant'] as StaffUserRole[]).map(role => (
                      <button
                        key={role}
                        onClick={() => handleApplyRoleTemplate(selectedStaff.id, role)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-300 font-bold rounded-xl border border-slate-800 text-xs"
                      >
                        Apply {role} Template
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granted Feature List */}
                <div className="space-y-3">
                  <h4 className="font-bold uppercase text-slate-400 text-[10px] font-sans">Authorized Feature Dashboard Modules ({selectedStaff.allowedFeatures.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ALL_ERP_FEATURE_PERMISSIONS.map(feat => {
                      const isGranted = selectedStaff.role === 'Admin' || selectedStaff.allowedFeatures.includes(feat.featureKey);
                      return (
                        <div
                          key={feat.featureKey}
                          onClick={() => selectedStaff.role !== 'Admin' && handleToggleFeaturePermission(selectedStaff.id, feat.featureKey)}
                          className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                            isGranted ? 'bg-slate-950 border-emerald-500/50 text-slate-200' : 'bg-slate-950/40 border-slate-800 text-slate-500'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-xs font-sans block">{feat.label}</span>
                            <span className="text-[10px] text-slate-400 block">{feat.category}</span>
                          </div>

                          {isGranted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GRANULAR FEATURE PERMISSION MATRIX */}
      {activeTab === 'permission_matrix' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 font-mono text-xs">
          <h3 className="text-sm font-black uppercase text-slate-100 font-sans">ERP Access Control Matrix</h3>
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-sans">
                  <th className="p-3">ERP Dashboard Module</th>
                  <th className="p-3">Category</th>
                  {staffUsers.map(u => (
                    <th key={u.id} className="p-3 text-center">{u.name.split(' ')[0]} ({u.role})</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {ALL_ERP_FEATURE_PERMISSIONS.map(feat => (
                  <tr key={feat.featureKey}>
                    <td className="p-3 font-bold text-slate-100 font-sans">{feat.label}</td>
                    <td className="p-3 text-purple-300">{feat.category}</td>
                    {staffUsers.map(u => {
                      const isGranted = u.role === 'Admin' || u.allowedFeatures.includes(feat.featureKey);
                      return (
                        <td key={u.id} className="p-3 text-center">
                          {isGranted ? (
                            <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded border border-emerald-800 text-[10px]">ALLOWED</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-900 text-slate-600 font-bold rounded border border-slate-800 text-[10px]">DENIED</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Staff User */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-mono text-xs">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 p-6 space-y-4 text-white font-sans">
            <h3 className="font-black text-sm uppercase text-slate-100 border-b border-slate-800 pb-3">Create New Staff User</h3>

            <div className="space-y-3 font-mono">
              <div>
                <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Staff Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Vance"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Staff Email Address</label>
                <input
                  type="email"
                  placeholder="marcus.v@techseller.com.au"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 uppercase text-[10px] font-bold block mb-1">Role Permission Template</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-slate-200"
                >
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Warehouse Manager">Warehouse Manager</option>
                  <option value="Procurement Officer">Procurement Officer</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Admin">Admin (Super-User)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={handleCreateStaffUser}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-lg shadow-blue-600/20"
              >
                Create Staff User Account
              </button>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
