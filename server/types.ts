export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface FinancialProfileEntity {
  id: string;
  userId: string;
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
  updatedAt: string;
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

export interface ExpenseEntity {
  id: string;
  userId: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberEntity {
  id: string;
  userId: string;
  name: string;
  relationship: 'Self' | 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  age: number;
  financialDependency: 'Full' | 'Partial' | 'Independent';
  monthlyAllocation: number;
  importantNotes?: string;
  createdAt: string;
}

export interface FinancialGoalEntity {
  id: string;
  userId: string;
  goalName: string;
  category: 'Child Education' | 'Home Purchase' | 'Vehicle' | 'Higher Education' | 'Emergency Fund' | 'Vacation' | 'Retirement' | 'Other';
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  monthlyContribution: number;
  priority: 'High' | 'Medium' | 'Low';
  notes?: string;
  createdAt: string;
}

export interface EmergencyFundEntity {
  id: string;
  userId: string;
  monthlyEssentialExpenses: number;
  desiredMonths: number;
  currentSavings: number;
  targetAmount: number;
  monthlyContribution: number;
  notes?: string;
  updatedAt: string;
}

export type InsuranceType = 'Health' | 'Term Life' | 'Motor' | 'Critical Illness' | 'Home' | 'Child Education' | 'Other';
export type PremiumFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annual';

export interface InsurancePolicyEntity {
  id: string;
  userId: string;
  policyType: InsuranceType;
  provider: string;
  insuredPerson: string;
  coverageAmount: number;
  premium: number;
  frequency: PremiumFrequency;
  policyNumber: string;
  startDate: string;
  renewalDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface MonthlyBudgetEntity {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  totalIncome: number;
  mandatoryExpenses: number;
  familyExpenses: number;
  insuranceExpenses: number;
  emergencyFundContribution: number;
  savingsContribution: number;
  discretionaryBudget: number;
  categoryBudgets: Record<string, number>;
  updatedAt: string;
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

export interface FinancialHealthScoreReport {
  overallScore: number; // 0-100
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Critical';
  pillars: {
    savingsRate: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
    emergencyFund: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
    budgetAdherence: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
    debtBurden: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
    insuranceProtection: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
    goalMomentum: { score: number; maxScore: number; label: string; status: 'Good' | 'Fair' | 'Needs Improvement'; details: string };
  };
  summary: string;
  keyStrengths: string[];
  actionItems: string[];
}
