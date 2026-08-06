import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, KeyRound, ChevronDown, ShieldCheck, Store } from 'lucide-react';

interface UserAccountDropdownProps {
  userName?: string;
  userEmail?: string;
  roleBadge?: string;
  isSuperAdmin?: boolean;
  onLogout: () => void;
  onChangePassword: () => void;
}

export const UserAccountDropdown: React.FC<UserAccountDropdownProps> = ({
  userName = 'Account User',
  userEmail = 'user@infomats.net',

  roleBadge = 'Store Admin',
  isSuperAdmin = false,
  onLogout,
  onChangePassword,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 shadow-sm transition group"
      >
        <div className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shadow-sm text-white ${
          isSuperAdmin ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' : 'bg-gradient-to-tr from-indigo-600 to-blue-600'
        }`}>
          {getInitials(userName)}
        </div>

        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold leading-tight text-slate-900 group-hover:text-indigo-600 transition">
            {userName}
          </div>
          <div className="text-[10px] font-semibold text-slate-400 leading-tight">
            {isSuperAdmin ? 'Super Admin' : roleBadge}
          </div>
        </div>

        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/60">
            <div className="font-bold text-sm text-slate-900">{userName}</div>
            <div className="text-xs text-slate-500 truncate mb-2">{userEmail}</div>
            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
              isSuperAdmin
                ? 'bg-purple-100 text-purple-800 border-purple-200'
                : 'bg-indigo-100 text-indigo-800 border-indigo-200'
            }`}>
              {isSuperAdmin ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-purple-600" /> Platform Owner
                </>
              ) : (
                <>
                  <Store className="w-3 h-3 text-indigo-600" /> Store Owner / Staff
                </>
              )}
            </span>
          </div>

          {/* Menu Items */}
          <div className="p-1.5 space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onChangePassword();
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/60 rounded-xl transition flex items-center gap-2.5"
            >
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Change Password</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-2.5 border-t border-slate-100 mt-1"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Log Out Account</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
