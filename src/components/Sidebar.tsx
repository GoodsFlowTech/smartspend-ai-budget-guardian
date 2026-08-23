import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  PieChart,
  Receipt,
  HeartHandshake,
  Target,
  Shield,
  BarChart3,
  FileText,
  UserCheck,
  CheckSquare,
  Vault,
  MoreHorizontal,
  X,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  overspendingCount: number;
  upcomingRenewalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  overspendingCount,
  upcomingRenewalsCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'core' },
    { id: 'spending-check', label: 'Spending Check', icon: Sparkles, badge: 'Smart', category: 'core' },
    { id: 'income', label: 'Income & Budget', icon: PieChart, category: 'core' },
    { id: 'expenses', label: 'Expense Tracker', icon: Receipt, alertCount: overspendingCount, category: 'core' },
    { id: 'emergency-fund', label: 'Emergency Fund', icon: Vault, category: 'planning' },
    { id: 'family', label: 'Family & Dependents', icon: HeartHandshake, category: 'planning' },
    { id: 'goals', label: 'Child Education & Goals', icon: Target, category: 'planning' },
    { id: 'insurance', label: 'Insurance Policies', icon: Shield, alertCount: upcomingRenewalsCount, category: 'protection' },
    { id: 'analytics', label: 'Analytics & Charts', icon: BarChart3, category: 'insights' },
    { id: 'reports', label: 'Monthly Report', icon: FileText, category: 'insights' },
    { id: 'tests', label: 'System Tests', icon: CheckSquare, category: 'system' },
    { id: 'profile', label: 'Financial Profile', icon: UserCheck, category: 'system' },
  ];

  // Primary tabs featured on the mobile bottom bar for 1-tap access
  const primaryMobileTabIds = ['dashboard', 'spending-check', 'expenses', 'income'];
  const primaryMobileTabs = navItems.filter((item) => primaryMobileTabIds.includes(item.id));
  
  // Secondary items accessed via the "More" thumb menu
  const secondaryMobileTabs = navItems.filter((item) => !primaryMobileTabIds.includes(item.id));
  const isSecondaryTabActive = secondaryMobileTabs.some((item) => item.id === activeTab);
  const secondaryAlertCount = secondaryMobileTabs.reduce((sum, item) => sum + (item.alertCount || 0), 0);

  const handleMobileNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR NAVIGATION (md: 768px and up)                             */}
      {/* ========================================================================= */}
      <aside className="hidden md:block w-64 shrink-0 p-0">
        <div className="sticky top-20 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Financial Management
          </div>

          <nav className="space-y-1" aria-label="Desktop Sidebar Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                      : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : item.id === 'spending-check' ? 'text-amber-500' : 'text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {Boolean(item.alertCount && item.alertCount > 0) && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {item.alertCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Safety Guideline Widget */}
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-100/80 text-xs text-slate-600">
            <p className="font-semibold text-slate-900 mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>SmartSpend Rule</span>
            </p>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Never authorize discretionary purchases exceeding 50% of your remaining monthly buffer without a 48h cooling period.
            </p>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR (< 768px)                                    */}
      {/* ========================================================================= */}
      <div className="md:hidden">
        {/* Mobile Fixed Bottom Bar */}
        <nav
          id="mobile-bottom-nav"
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] px-2 py-1.5 safe-area-pb"
        >
          <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
            {/* Primary Core Tabs */}
            {primaryMobileTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id && !isMobileMenuOpen;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => handleMobileNavClick(item.id)}
                  className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[46px] ${
                    isActive
                      ? 'text-indigo-600 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:scale-95'
                  }`}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive
                          ? 'scale-110 text-indigo-600'
                          : item.id === 'spending-check'
                          ? 'text-amber-500'
                          : 'text-slate-500'
                      }`}
                    />
                    {/* Alert Badge for individual tabs */}
                    {Boolean(item.alertCount && item.alertCount > 0) && (
                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                        {item.alertCount}
                      </span>
                    )}
                    {item.badge && (
                      <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-amber-500 text-white text-[8px] font-bold rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                    {item.id === 'spending-check'
                      ? 'AI Check'
                      : item.id === 'income'
                      ? 'Budget'
                      : item.id === 'expenses'
                      ? 'Expenses'
                      : 'Overview'}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0.5 w-4 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* "More / All Sections" Drawer Trigger */}
            <button
              id="mobile-nav-more"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[46px] ${
                isMobileMenuOpen || isSecondaryTabActive
                  ? 'text-indigo-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 active:scale-95'
              }`}
            >
              <div className="relative">
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-indigo-600 scale-110" />
                ) : (
                  <MoreHorizontal
                    className={`w-5 h-5 transition-transform ${
                      isSecondaryTabActive ? 'scale-110 text-indigo-600' : 'text-slate-500'
                    }`}
                  />
                )}
                {/* Secondary alert badge (e.g. upcoming insurance renewals) */}
                {secondaryAlertCount > 0 && !isMobileMenuOpen && (
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {secondaryAlertCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {isSecondaryTabActive && !isMobileMenuOpen
                  ? navItems.find((n) => n.id === activeTab)?.label.split(' ')[0] || 'More'
                  : 'More'}
              </span>
              {(isMobileMenuOpen || isSecondaryTabActive) && (
                <span className="absolute bottom-0.5 w-4 h-0.5 bg-indigo-600 rounded-full" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile "More" Navigation Sheet / Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              id="mobile-sheet-backdrop"
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in-50"
            />

            {/* Bottom Sheet Modal */}
            <div
              id="mobile-navigation-sheet"
              className="relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            >
              {/* Sheet Grab Handle & Header */}
              <div className="flex flex-col items-center mb-3">
                <div className="w-10 h-1 bg-slate-300 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between px-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">All Financial Modules</h3>
                      <p className="text-[11px] text-slate-500">Fast thumb navigation</p>
                    </div>
                  </div>
                  <button
                    id="btn-close-mobile-sheet"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Grid of all 12 modules */}
              <div className="grid grid-cols-2 gap-2 mt-2 pb-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`mobile-sheet-item-${item.id}`}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`flex items-center space-x-3 p-3 rounded-2xl text-left transition-all min-h-[52px] ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-100'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                          isActive
                            ? 'bg-indigo-700/80 text-white'
                            : item.id === 'spending-check'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-white text-slate-600 shadow-2xs'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs truncate font-medium">{item.label}</p>
                          {Boolean(item.alertCount && item.alertCount > 0) && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                              }`}
                            >
                              {item.alertCount}
                            </span>
                          )}
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-semibold ${
                              isActive ? 'text-indigo-200' : 'text-amber-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Mobile SmartSpend Tip */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl text-[11px] text-slate-600 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> Tap <em>AI Check</em> anytime prior to making big discretionary purchases.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

