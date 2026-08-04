import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

const MODULES = ['POS', 'Finance', 'Inventory', 'Orders', 'Customers'];

export default function UserManager({ users, onAddUser, onDeleteUser }: UserManagerProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const togglePermission = (module: string) => {
    setPermissions(prev =>
      prev.includes(module) ? prev.filter(p => p !== module) : [...prev, module]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser({
      id: 'U-' + Date.now(),
      name,
      email,
      permissions
    });
    setName('');
    setEmail('');
    setPermissions([]);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-neutral-50 p-6 border border-neutral-400 space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-widest">Add New User</h3>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="p-2 border border-neutral-400" required />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="p-2 border border-neutral-400" required />
        </div>
        <div className="space-y-2">
            <span className="text-sm font-bold">Permissions:</span>
            <div className="flex flex-wrap gap-2">
                {MODULES.map(module => (
                    <label key={module} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={permissions.includes(module)} onChange={() => togglePermission(module)} />
                        {module}
                    </label>
                ))}
            </div>
        </div>
        <button type="submit" className="flex items-center gap-2 bg-neutral-950 text-white px-4 py-2 text-sm font-bold hover:bg-neutral-800">
          <Plus className="h-4 w-4" />
          ADD USER
        </button>
      </form>

      <div className="border border-neutral-400 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-100 border-b border-neutral-400 font-mono text-xs uppercase">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Permissions</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="p-3 font-bold">{user.name}</td>
                <td className="p-3 font-mono">{user.email}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(user.permissions || []).map(p => (
                      <span key={p} className="px-2 py-0.5 bg-neutral-100 text-[10px] font-bold rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => onDeleteUser(user.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
