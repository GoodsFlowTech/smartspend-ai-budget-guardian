import {
  User,
  FinancialProfile,
  MonthlyBudget,
  BudgetReconciliation,
  Expense,
  SpendingDecisionEvaluation,
  ClassificationResult,
  FamilyMember,
  FinancialGoal,
  EmergencyFund,
  EmergencyFundAnalysis,
  InsurancePolicy,
  NotificationItem,
  FinancialHealthScoreReport,
  AnalyticsData,
  TestSuiteReport,
} from '../types';

const TOKEN_KEY = 'smartspend_auth_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Network request failed' }));
    throw new Error(errorBody.error || `HTTP ${response.status}: Request failed`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () => request<User>('/api/auth/me'),

  // Profile
  getProfile: () => request<FinancialProfile>('/api/profile'),
  updateProfile: (profile: Partial<FinancialProfile>) =>
    request<FinancialProfile>('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }),

  // Budget & Income Allocation
  getBudget: () =>
    request<{
      budget: MonthlyBudget;
      reconciliation: BudgetReconciliation;
      profile: FinancialProfile;
    }>('/api/budget'),

  updateBudget: (budget: Partial<MonthlyBudget>) =>
    request<MonthlyBudget>('/api/budget', {
      method: 'PUT',
      body: JSON.stringify(budget),
    }),

  // Smart Spending Decision Engine & AI Classifier
  classifyMerchant: (data: { merchantName: string; amount?: number }) =>
    request<ClassificationResult>('/api/spending/classify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  evaluateSpending: (data: {
    amount: number;
    category: string;
    description: string;
    necessityLevel: string;
    familyMemberId?: string;
    notes?: string;
  }) =>
    request<SpendingDecisionEvaluation>('/api/spending/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Expenses
  getExpenses: (params: {
    category?: string;
    necessity?: string;
    familyMemberId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    return request<{ totalCount: number; totalAmount: number; expenses: Expense[] }>(
      `/api/expenses?${query.toString()}`
    );
  },

  addExpense: (expense: Partial<Expense>) =>
    request<Expense>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    }),

  updateExpense: (id: string, expense: Partial<Expense>) =>
    request<Expense>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Family
  getFamily: () =>
    request<{
      members: FamilyMember[];
      summary: { totalMembers: number; totalAllocation: number; totalSpent: number };
    }>('/api/family'),

  addFamilyMember: (member: Partial<FamilyMember>) =>
    request<FamilyMember>('/api/family', {
      method: 'POST',
      body: JSON.stringify(member),
    }),

  updateFamilyMember: (id: string, member: Partial<FamilyMember>) =>
    request<FamilyMember>(`/api/family/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    }),

  deleteFamilyMember: (id: string) =>
    request<{ success: boolean }>(`/api/family/${id}`, {
      method: 'DELETE',
    }),

  // Goals
  getGoals: () =>
    request<{
      goals: FinancialGoal[];
      summary: { totalGoals: number; totalTarget: number; totalAccumulated: number; totalMonthlySIP: number; overallProgress: number };
    }>('/api/goals'),

  addGoal: (goal: Partial<FinancialGoal>) =>
    request<FinancialGoal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    }),

  updateGoal: (id: string, goal: Partial<FinancialGoal>) =>
    request<FinancialGoal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    }),

  deleteGoal: (id: string) =>
    request<{ success: boolean }>(`/api/goals/${id}`, {
      method: 'DELETE',
    }),

  // Emergency Fund
  getEmergencyFund: () =>
    request<{ fund: EmergencyFund; analysis: EmergencyFundAnalysis }>('/api/emergency-fund'),

  updateEmergencyFund: (fund: Partial<EmergencyFund>) =>
    request<EmergencyFund>('/api/emergency-fund', {
      method: 'PUT',
      body: JSON.stringify(fund),
    }),

  // Insurance
  getInsurance: () =>
    request<{
      policies: InsurancePolicy[];
      summary: { totalPolicies: number; totalCoverage: number; totalMonthlyPremium: number; upcomingRenewalsCount: number };
    }>('/api/insurance'),

  addInsurancePolicy: (policy: Partial<InsurancePolicy>) =>
    request<InsurancePolicy>('/api/insurance', {
      method: 'POST',
      body: JSON.stringify(policy),
    }),

  updateInsurancePolicy: (id: string, policy: Partial<InsurancePolicy>) =>
    request<InsurancePolicy>(`/api/insurance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policy),
    }),

  deleteInsurancePolicy: (id: string) =>
    request<{ success: boolean }>(`/api/insurance/${id}`, {
      method: 'DELETE',
    }),

  // Health Score
  getHealthScore: () => request<FinancialHealthScoreReport>('/api/health-score'),

  // Analytics
  getAnalytics: () => request<AnalyticsData>('/api/analytics'),

  // Monthly Report
  getMonthlyReport: () => request<any>('/api/reports/monthly'),

  // Notifications
  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/api/notifications/read-all', { method: 'POST' }),

  // Payments (Razorpay Real Test-Mode API)
  getRazorpayStatus: () =>
    request<{ configured: boolean; keyId: string | null; message: string }>('/api/payments/razorpay/status'),

  createRazorpayOrder: (data: {
    amount: number;
    purpose: string;
    entityId?: string;
    notes?: Record<string, string>;
  }) =>
    request<{
      id: string;
      amount: number;
      currency: string;
      keyId?: string;
      receipt?: string;
      status: string;
    }>('/api/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyRazorpayPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    purpose?: string;
    amount: number;
    goalId?: string;
    policyId?: string;
    isEmergencyFund?: boolean;
  }) =>
    request<{ success: boolean; message: string; orderId: string; paymentId: string; expense: Expense }>(
      '/api/payments/razorpay/verify',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  // System Tests & Demo Reset
  runSystemTests: () => request<TestSuiteReport>('/api/system/tests'),

  getDbStatus: () =>
    request<{
      driver: string;
      databasePath: string;
      isReady: boolean;
      tables: string[];
      userCount: number;
      description: string;
    }>('/api/system/db-status'),

  getEvaluationReport: () => request<any>('/api/system/evaluation-report'),

  runEvaluationBenchmark: (useAi = true) =>
    request<any>('/api/system/run-evaluation', {
      method: 'POST',
      body: JSON.stringify({ useAi }),
    }),

  resetDemoData: () => request<{ success: boolean; message: string }>('/api/system/reset-demo', { method: 'POST' }),
};
