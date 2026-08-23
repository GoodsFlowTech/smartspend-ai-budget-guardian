import React, { useState } from 'react';
import {
  ShieldCheck,
  Bell,
  Sparkles,
  RefreshCw,
  User as UserIcon,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { User, NotificationItem } from '../types';

interface NavbarProps {
  user: User | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  healthScore: number | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onNotificationRead: (id: string) => void;
  onReadAllNotifications: () => void;
  onResetDemo: () => void;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeTab,
  setActiveTab,
  healthScore,
  notifications,
  unreadCount,
  onNotificationRead,
  onReadAllNotifications,
  onResetDemo,
  onLogout,
  onOpenAuth,
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await onResetDemo();
    setIsResetting(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">SmartSpend</span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Personal & Family Financial Planning</p>
            </div>
          </div>

          {/* Center Action: Smart Spending Decision Quick Button */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              id="btn-nav-evaluate-spend"
              onClick={() => setActiveTab('spending-check')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-xs ${
                activeTab === 'spending-check'
                  ? 'bg-amber-500 text-white shadow-amber-500/20 ring-2 ring-amber-400'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100/80'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>Smart Spending Check</span>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Financial Health Score Pill */}
            {healthScore !== null && (
              <div
                onClick={() => setActiveTab('dashboard')}
                className={`cursor-pointer hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-semibold shadow-2xs transition-all hover:scale-102 ${getScoreColor(
                  healthScore
                )}`}
                title="Financial Health Score (0-100)"
              >
                <span>Health Score:</span>
                <span className="font-bold text-sm">{healthScore}/100</span>
              </div>
            )}

            {/* In-App Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-nav-notifications"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-sm text-slate-900">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 font-medium rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={onReadAllNotifications}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">No notifications right now</div>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            onNotificationRead(notif.id);
                            if (notif.link) {
                              const tab = notif.link.replace('/', '');
                              setActiveTab(tab);
                              setShowNotifs(false);
                            }
                          }}
                          className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start space-x-3 ${
                            !notif.isRead ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                            {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                            {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            {notif.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Demo Reset Trigger */}
            <button
              id="btn-nav-reset-demo"
              onClick={handleReset}
              disabled={isResetting}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 transition-colors"
              title="Reset to realistic demo household dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Reset Demo Data</span>
            </button>

            {/* User Account / Profile Menu */}
            {user ? (
              <div className="relative">
                <button
                  id="btn-nav-user-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-semibold flex items-center justify-center text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-xs font-medium hidden md:block max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Financial Profile & Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('tests');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                      <span>System Verification Tests</span>
                    </button>
                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        onLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
