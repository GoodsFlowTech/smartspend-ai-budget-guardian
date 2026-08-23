export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface FinancialProfile {
  id?: string;
  userId?: string;
  monthlySalary: number;
  otherIncome: number;
  rentExpenses: number;
  foodExpenses: number;
  transportExpenses: number;
  utilitiesExpenses: number;
  medicalExpenses: number;
  emiExpenses: number;
  insuranceExpenses: number;
  numberOfFamilyMembers: number;
  numberOfChildren: number;
  numberOfDependents: number;
  existingSavings: number;
  existingEmergencyFund: number;
  monthlySavingsTarget: number;
  desiredEmergencyMonths: number;
  currency: string;
  updatedAt?: string;
}

export type ExpenseCategory =
  | 'Food'
  | 'Housing'
  | 'Transportation'
  | 'Medical'
  | 'Education'
  | 'Shopping'
  | 'Entertainment'
  | 'Bills'
  | 'Insurance'
  | 'Family'
  | 'Children'
  | 'EMI/Loan'
  | 'Travel'
  | 'Other';

export type NecessityLevel = 'Essential' | 'Important' | 'Non-essential' | 'Emergency';

export type PaymentMethod = 'UPI' | 'Credit Card' | 'Debit Card' | 'Net Banking' | 'Cash' | 'Bank Transfer';

export interface Expense {
  id: string;
  userId?: string;
  amount: number;
  category: ExpenseCategory;
  subcategory?: string;
  date: string; // YYYY-MM-DD
  description: string;
  paymentMethod: PaymentMethod;
  necessityLevel: NecessityLevel;
  familyMemberId?: string;
  isRecurring: boolean;
  notes?: string;
  confidence?: number;
  reasoning?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FamilyMember {
  id: string;
  userId?: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  age: number;
  financialDependency: 'Full' | 'Partial' | 'Independent';
  monthlyAllocation: number;
  importantNotes?: string;
  totalSpent?: number;
  expensesCount?: number;
  utilizationPercent?: number;
  createdAt?: string;
}

export interface FinancialGoal {
  id: string;
  userId?: string;
  goalName: string;
  category: 'Child Education' | 'Home Purchase' | 'Vehicle' | 'Higher Education' | 'Emergency Fund' | 'Vacation' | 'Retirement' | 'Other';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  remainingAmount?: number;
  progressPercent?: number;
  monthsRemaining?: number;
  requiredMonthlyContribution?: number;
  isShortfall?: boolean;
  createdAt?: string;
}

export interface EmergencyFund {
  id?: string;
  userId?: string;
  monthlyEssentialExpenses: number;
  desiredMonths: number;
  currentSavings: number;
  targetAmount: number;
  monthlyContribution: number;
  notes?: string;
  updatedAt?: string;
}

export interface EmergencyFundAnalysis {
  essentialExpenses: number;
  desiredMonths: number;
  currentSavings: number;
  targetAmount: number;
  progressPercent: number;
  shortfall: number;
  monthsToTarget: number;
  isBelowTarget: boolean;
}

export type InsuranceType = 'Health' | 'Term Life' | 'Motor' | 'Critical Illness' | 'Home' | 'Child Education' | 'Other';
export type PremiumFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual';

export interface InsurancePolicy {
  id: string;
  userId?: string;
  policyType: InsuranceType;
  provider: string;
  insuredPerson: string;
  coverageAmount: number;
  premium: number;
  frequency: PremiumFrequency;
  policyNumber: string;
  startDate: string;
  renewalDate: string;
  notes?: string;
  daysUntilRenewal?: number;
  isUpcoming?: boolean;
  isOverdue?: boolean;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface MonthlyBudget {
  id: string;
  userId?: string;
  monthYear: string;
  totalIncome: number;
  mandatoryExpenses: number;
  familyExpenses: number;
  insuranceExpenses: number;
  emergencyFundContribution: number;
  savingsContribution: number;
  discretionaryBudget: number;
  categoryBudgets: Record<string, number>;
  updatedAt?: string;
}

export interface BudgetReconciliation {
  totalIncome: number;
  totalSpent: number;
  discretionaryBudget: number;
  discretionarySpent: number;
  remainingDiscretionary: number;
  discretionaryUtilizationPercent: number;
  categorySpending: Record<string, { allocated: number; spent: number; remaining: number; utilizationPercent: number }>;
  isOverBudget: boolean;
  overspendingAmount: number;
}

export type IndianTransactionCategory = 'essential' | 'family_support' | 'insurance' | 'discretionary' | 'uncertain';

export interface ClassificationResult {
  category: IndianTransactionCategory;
  confidence: number;
  reasoning: string;
  suggestedSubcategory?: string;
  source: 'gemini' | 'heuristic_fallback';
}

export type SpendingRiskLevel = 'SAFE' | 'CAUTION' | 'HIGH_RISK';

export interface SpendingDecisionEvaluation {
  riskLevel: SpendingRiskLevel;
  headline: string;
  reasons: string[];
  recommendations: string[];
  aiClassification?: ClassificationResult;
  financialImpact: {
    amount: number;
    category: ExpenseCategory;
    currentDiscretionary: number;
    remainingDiscretionaryAfter: number;
    discretionaryConsumedPercent: number;
    categoryBudget: number;
    categorySpentBefore: number;
    categorySpentAfter: number;
    isCategoryExceeded: boolean;
    categoryOverspendingAmount: number;
    emergencyFundProgressPercent: number;
    isEmergencyFundLow: boolean;
    savingsTargetImpact: string;
  };
  disclaimer: string;
}

export interface PillarScore {
  score: number;
  maxScore: number;
  label: string;
  status: 'Good' | 'Fair' | 'Needs Improvement';
  details: string;
}

export interface FinancialHealthScoreReport {
  overallScore: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Critical';
  pillars: {
    savingsRate: PillarScore;
    emergencyFund: PillarScore;
    budgetAdherence: PillarScore;
    debtBurden: PillarScore;
    insuranceProtection: PillarScore;
    goalMomentum: PillarScore;
  };
  summary: string;
  keyStrengths: string[];
  actionItems: string[];
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRatePercent: number;
  categoryChartData: Array<{ name: string; value: number; allocated: number }>;
  necessityChartData: Array<{ name: string; value: number }>;
  allocationData: Array<{ name: string; amount: number; fill: string }>;
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details: string;
  durationMs: number;
}

export interface TestSuiteReport {
  totalTests: number;
  passedCount: number;
  failedCount: number;
  successRate: number;
  timestamp: string;
  results: TestResultItem[];
}
