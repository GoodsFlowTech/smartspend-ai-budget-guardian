import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SpendingCheckView } from './components/SpendingCheckView';
import { IncomeAllocationView } from './components/IncomeAllocationView';
import { ExpenseTrackerView } from './components/ExpenseTrackerView';
import { EmergencyFundView } from './components/EmergencyFundView';
import { FamilyView } from './components/FamilyView';
import { GoalsView } from './components/GoalsView';
import { InsuranceView } from './components/InsuranceView';
import { AnalyticsView } from './components/AnalyticsView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { SystemTestsView } from './components/SystemTestsView';
import { ProfileView } from './components/ProfileView';
import { AuthModal } from './components/AuthModal';
import {
  User,
  FinancialProfile,
  MonthlyBudget,
  BudgetReconciliation,
  Expense,
  FamilyMember,
  FinancialGoal,
  EmergencyFund,
  EmergencyFundAnalysis,
  InsurancePolicy,
  NotificationItem,
  FinancialHealthScoreReport,
  AnalyticsData,
} from './types';
import { api, clearAuthToken } from './services/api';

export function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Application State
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'usr_demo_smartspend',
    name: 'Aarav Sharma',
    email: 'demo@smartspend.app',
    role: 'user',
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [reconciliation, setReconciliation] = useState<BudgetReconciliation | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFund | null>(null);
  const [emergencyAnalysis, setEmergencyAnalysis] = useState<EmergencyFundAnalysis | null>(null);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [healthScoreReport, setHealthScoreReport] = useState<FinancialHealthScoreReport | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const loadDashboardData = useCallback(async () => {
    try {
      const [
        budgetRes,
        expensesRes,
        familyRes,
        goalsRes,
        emfRes,
        insRes,
        healthRes,
        analyticsRes,
        notifsRes,
      ] = await Promise.all([
        api.getBudget().catch(() => null),
        api.getExpenses().catch(() => ({ totalCount: 0, totalAmount: 0, expenses: [] })),
        api.getFamily().catch(() => ({ members: [], summary: { totalMembers: 0, totalAllocation: 0, totalSpent: 0 } })),
        api.getGoals().catch(() => ({ goals: [], summary: { totalGoals: 0, totalTarget: 0, totalAccumulated: 0, totalMonthlySIP: 0, overallProgress: 0 } })),
        api.getEmergencyFund().catch(() => null),
        api.getInsurance().catch(() => ({ policies: [], summary: { totalPolicies: 0, totalCoverage: 0, totalMonthlyPremium: 0, upcomingRenewalsCount: 0 } })),
        api.getHealthScore().catch(() => null),
        api.getAnalytics().catch(() => null),
        api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);

      if (budgetRes) {
        setBudget(budgetRes.budget);
        setReconciliation(budgetRes.reconciliation);
        setProfile(budgetRes.profile);
      }

      if (expensesRes) {
        setExpenses(expensesRes.expenses);
      }

      if (familyRes) {
        setFamilyMembers(familyRes.members);
      }

      if (goalsRes) {
        setGoals(goalsRes.goals);
      }

      if (emfRes) {
        setEmergencyFund(emfRes.fund);
        setEmergencyAnalysis(emfRes.analysis);
      }

      if (insRes) {
        setInsurancePolicies(insRes.policies);
      }

      if (healthRes) {
        setHealthScoreReport(healthRes);
      }

      if (analyticsRes) {
        setAnalytics(analyticsRes);
      }

      if (notifsRes) {
        setNotifications(notifsRes.notifications);
        setUnreadNotifsCount(notifsRes.unreadCount);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Logout handler
  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setIsAuthModalOpen(true);
  };

  // Reset Demo handler
  const handleResetDemo = async () => {
    if (confirm('Reset database to realistic 4-member Indian household demo state?')) {
      await api.resetDemoData();
      await loadDashboardData();
    }
  };

  // Mark notification read
  const handleNotificationRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
  };

  const handleReadAllNotifications = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifsCount(0);
  };

  const overspendingCount = reconciliation?.isOverBudget ? 1 : 0;
  const upcomingRenewalsCount = insurancePolicies.filter((p) => p.isUpcoming || p.isOverdue).length;

  return (
    <div id="smartspend-root" className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        healthScore={healthScoreReport ? healthScoreReport.overallScore : null}
        notifications={notifications}
        unreadCount={unreadNotifsCount}
        onNotificationRead={handleNotificationRead}
        onReadAllNotifications={handleReadAllNotifications}
        onResetDemo={handleResetDemo}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container: Sidebar + Active View */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            overspendingCount={overspendingCount}
            upcomingRenewalsCount={upcomingRenewalsCount}
          />

          {/* Active View Container */}
          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && (
              <DashboardView
                budget={budget}
                reconciliation={reconciliation}
                healthScoreReport={healthScoreReport}
                recentExpenses={expenses}
                policies={insurancePolicies}
                goals={goals}
                emergencyAnalysis={emergencyAnalysis}
                onNavigateTab={setActiveTab}
                onOpenAddExpense={() => setActiveTab('expenses')}
              />
            )}

            {activeTab === 'spending-check' && (
              <SpendingCheckView
                familyMembers={familyMembers}
                onExpenseRecorded={loadDashboardData}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'income' && (
              <IncomeAllocationView
                budget={budget}
                profile={profile}
                reconciliation={reconciliation}
                onBudgetUpdated={loadDashboardData}
              />
            )}

            {activeTab === 'expenses' && (
              <ExpenseTrackerView
                expenses={expenses}
                familyMembers={familyMembers}
                onExpenseMutated={loadDashboardData}
              />
            )}

            {activeTab === 'emergency-fund' && (
              <EmergencyFundView
                emergencyFund={emergencyFund}
                analysis={emergencyAnalysis}
                onFundUpdated={loadDashboardData}
              />
            )}

            {activeTab === 'family' && (
              <FamilyView
                familyMembers={familyMembers}
                onFamilyMutated={loadDashboardData}
              />
            )}

            {activeTab === 'goals' && (
              <GoalsView
                goals={goals}
                onGoalMutated={loadDashboardData}
              />
            )}

            {activeTab === 'insurance' && (
              <InsuranceView
                policies={insurancePolicies}
                onPolicyMutated={loadDashboardData}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                analytics={analytics}
                budget={budget}
              />
            )}

            {activeTab === 'reports' && (
              <MonthlyReportView
                budget={budget}
                profile={profile}
                reconciliation={reconciliation}
                healthScoreReport={healthScoreReport}
                expenses={expenses}
              />
            )}

            {activeTab === 'tests' && <SystemTestsView />}

            {activeTab === 'profile' && (
              <ProfileView
                profile={profile}
                healthScoreReport={healthScoreReport}
                onProfileUpdated={loadDashboardData}
              />
            )}
          </main>
        </div>
      </div>

      {/* Production Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 mt-auto mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">SmartSpend Pro</span>
            <span>•</span>
            <span>Personal Financial Planning & Expenditure Management System</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>6-Pillar Risk Engine</span>
            <span>•</span>
            <span>Zero-Sum Salary Budgeting</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(u) => {
          setCurrentUser(u);
          loadDashboardData();
        }}
      />
    </div>
  );
}

export default App;
