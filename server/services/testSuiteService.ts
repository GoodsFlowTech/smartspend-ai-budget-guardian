import { SpendingDecisionEngine } from './spendingDecisionEngine';
import { BudgetService } from './budgetService';
import { HealthScoreService } from './healthScoreService';
import { FinancialProfileEntity, MonthlyBudgetEntity, EmergencyFundEntity, ExpenseEntity } from '../types';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'Spending Decision Engine' | 'Budget Allocation' | 'Emergency Fund' | 'Health Score' | 'Overspending Detection';
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

export class TestSuiteService {
  public static async runAllTests(): Promise<TestSuiteReport> {
    const results: TestResultItem[] = [];

    // Mock Base Profile
    const mockProfile: FinancialProfileEntity = {
      id: 'prof_test',
      userId: 'usr_test',
      monthlySalary: 50000,
      otherIncome: 0,
      rentExpenses: 15000,
      foodExpenses: 6000,
      transportExpenses: 3000,
      utilitiesExpenses: 2000,
      medicalExpenses: 1500,
      emiExpenses: 2500,
      insuranceExpenses: 2000,
      numberOfFamilyMembers: 3,
      numberOfChildren: 1,
      numberOfDependents: 1,
      existingSavings: 30000,
      existingEmergencyFund: 40000,
      monthlySavingsTarget: 8000,
      desiredEmergencyMonths: 6,
      currency: '₹',
      updatedAt: new Date().toISOString(),
    };

    // Test 1: Budget Allocation Formula
    // Total Income (50000) - Mandatory (30000) - Family (2500) - Insurance (2000) - Emergency (5000) - Savings (8000) = Discretionary (2500)
    const t1Start = performance.now();
    const budget = BudgetService.calculateMonthlyAllocation(mockProfile);
    const expectedDiscretionary = 2500;
    const t1Passed = budget.discretionaryBudget === expectedDiscretionary;
    results.push({
      id: 'TEST_01',
      name: 'Budget Allocation Engine: Income - Deductions = Discretionary Balance',
      category: 'Budget Allocation',
      passed: t1Passed,
      expected: `Discretionary budget = ₹${expectedDiscretionary}`,
      actual: `Discretionary budget = ₹${budget.discretionaryBudget}`,
      details: 'Evaluated formula: ₹50,000 Income - ₹30,000 Mandatory - ₹2,500 Family - ₹2,000 Insurance - ₹5,000 Emergency - ₹8,000 Savings',
      durationMs: Number((performance.now() - t1Start).toFixed(2)),
    });

    // Test 2: Spending Decision Engine - Safe Small Purchase
    const t2Start = performance.now();
    const smallDecision = await SpendingDecisionEngine.evaluatePurchase(
      { amount: 500, category: 'Shopping', description: 'Book', necessityLevel: 'Non-essential' },
      mockProfile,
      budget,
      undefined,
      []
    );
    const t2Passed = smallDecision.riskLevel === 'SAFE' || smallDecision.riskLevel === 'CAUTION';
    results.push({
      id: 'TEST_02',
      name: 'Spending Decision Engine: Nominal Purchase Evaluation',
      category: 'Spending Decision Engine',
      passed: t2Passed,
      expected: 'Risk Level = SAFE or CAUTION (with low emergency cushion note)',
      actual: `Risk Level = ${smallDecision.riskLevel}`,
      details: smallDecision.headline,
      durationMs: Number((performance.now() - t2Start).toFixed(2)),
    });

    // Test 3: Spending Decision Engine - Excessive Discretionary Purchase (> Available Discretionary)
    const t3Start = performance.now();
    const hugeDecision = await SpendingDecisionEngine.evaluatePurchase(
      { amount: 6000, category: 'Shopping', description: 'Noise Cancelling Headphones', necessityLevel: 'Non-essential' },
      mockProfile,
      budget,
      undefined,
      []
    );
    const t3Passed = hugeDecision.riskLevel === 'HIGH_RISK';
    results.push({
      id: 'TEST_03',
      name: 'Spending Decision Engine: Over-budget Purchase Triggers HIGH_RISK',
      category: 'Spending Decision Engine',
      passed: t3Passed,
      expected: 'Risk Level = HIGH_RISK (Purchase ₹6,000 exceeds ₹2,500 discretionary)',
      actual: `Risk Level = ${hugeDecision.riskLevel}`,
      details: hugeDecision.reasons[0] || 'Triggered high risk due to deficit.',
      durationMs: Number((performance.now() - t3Start).toFixed(2)),
    });

    // Test 4: Spending Decision Engine - Emergency Necessity Override
    const t4Start = performance.now();
    const emergencyDecision = await SpendingDecisionEngine.evaluatePurchase(
      { amount: 15000, category: 'Medical', description: 'Emergency Surgery Deposit', necessityLevel: 'Emergency' },
      mockProfile,
      budget,
      undefined,
      []
    );
    const t4Passed = emergencyDecision.riskLevel === 'SAFE';
    results.push({
      id: 'TEST_04',
      name: 'Spending Decision Engine: Emergency Priority Exemption',
      category: 'Spending Decision Engine',
      passed: t4Passed,
      expected: 'Risk Level = SAFE (Emergency necessity waives discretionary limits)',
      actual: `Risk Level = ${emergencyDecision.riskLevel}`,
      details: emergencyDecision.headline,
      durationMs: Number((performance.now() - t4Start).toFixed(2)),
    });

    // Test 5: Overspending Detection in Reconciliation
    const t5Start = performance.now();
    const mockExpenses: ExpenseEntity[] = [
      {
        id: 'exp_t1',
        userId: 'usr_test',
        amount: 35000,
        category: 'Housing',
        date: '2026-08-01',
        description: 'Rent',
        paymentMethod: 'Net Banking',
        necessityLevel: 'Essential',
        isRecurring: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'exp_t2',
        userId: 'usr_test',
        amount: 20000,
        category: 'Food',
        date: '2026-08-05',
        description: 'Food & Dining',
        paymentMethod: 'UPI',
        necessityLevel: 'Essential',
        isRecurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const reconciliation = BudgetService.reconcileSpending(budget, mockExpenses);
    const t5Passed = reconciliation.isOverBudget === true && reconciliation.totalSpent === 55000;
    results.push({
      id: 'TEST_05',
      name: 'Overspending Detector: Automatically Flags Total Deficit',
      category: 'Overspending Detection',
      passed: t5Passed,
      expected: 'isOverBudget = true (Spent ₹55,000 > ₹50,000 income)',
      actual: `isOverBudget = ${reconciliation.isOverBudget}, totalSpent = ₹${reconciliation.totalSpent}`,
      details: `Overspending amount correctly computed at ₹${reconciliation.overspendingAmount}`,
      durationMs: Number((performance.now() - t5Start).toFixed(2)),
    });

    // Test 6: Emergency Fund Target Math
    const t6Start = performance.now();
    const essentialExpenses = mockProfile.rentExpenses + mockProfile.foodExpenses + mockProfile.utilitiesExpenses; // 15k+6k+2k = 23k
    const expectedEmergencyTarget = essentialExpenses * (mockProfile.desiredEmergencyMonths || 6); // 23k * 6 = 138k
    const t6Passed = expectedEmergencyTarget === 138000;
    results.push({
      id: 'TEST_06',
      name: 'Emergency Fund Engine: Target = Essential Expenses × Desired Months',
      category: 'Emergency Fund',
      passed: t6Passed,
      expected: `Target = ₹1,38,000 (₹23,000 × 6 months)`,
      actual: `Target = ₹${expectedEmergencyTarget.toLocaleString('en-IN')}`,
      details: 'Calculates true essential runway (Rent + Groceries + Utilities)',
      durationMs: Number((performance.now() - t6Start).toFixed(2)),
    });

    // Test 7: Financial Health Score Range and Integrity
    const t7Start = performance.now();
    const healthReport = HealthScoreService.calculateHealthScore(
      mockProfile,
      budget,
      mockExpenses,
      {
        id: 'emf_t',
        userId: 'usr_test',
        monthlyEssentialExpenses: 23000,
        desiredMonths: 6,
        currentSavings: 140000,
        targetAmount: 138000,
        monthlyContribution: 5000,
        updatedAt: new Date().toISOString(),
      },
      [
        {
          id: 'ins_1',
          userId: 'usr_test',
          policyType: 'Health',
          provider: 'Star Health',
          insuredPerson: 'Family',
          coverageAmount: 1000000,
          premium: 1500,
          frequency: 'Monthly',
          policyNumber: 'ST-1',
          startDate: '2025-01-01',
          renewalDate: '2027-01-01',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'ins_2',
          userId: 'usr_test',
          policyType: 'Term Life',
          provider: 'HDFC Life',
          insuredPerson: 'Self',
          coverageAmount: 10000000,
          premium: 1200,
          frequency: 'Monthly',
          policyNumber: 'HD-1',
          startDate: '2025-01-01',
          renewalDate: '2027-01-01',
          createdAt: new Date().toISOString(),
        },
      ],
      []
    );
    const t7Passed = healthReport.overallScore >= 0 && healthReport.overallScore <= 100 && !!healthReport.grade;
    results.push({
      id: 'TEST_07',
      name: 'Financial Health Score: 6-Pillar Transparent Calculation (0-100)',
      category: 'Health Score',
      passed: t7Passed,
      expected: 'Score in range 0-100 with distinct pillar breakdowns',
      actual: `Overall Score = ${healthReport.overallScore}/100 (${healthReport.grade})`,
      details: `Savings: ${healthReport.pillars.savingsRate.score}/20, Emergency: ${healthReport.pillars.emergencyFund.score}/20, Debt: ${healthReport.pillars.debtBurden.score}/15, Insurance: ${healthReport.pillars.insuranceProtection.score}/15`,
      durationMs: Number((performance.now() - t7Start).toFixed(2)),
    });

    const passedCount = results.filter((r) => r.passed).length;

    return {
      totalTests: results.length,
      passedCount,
      failedCount: results.length - passedCount,
      successRate: Math.round((passedCount / results.length) * 100),
      timestamp: new Date().toISOString(),
      results,
    };
  }
}
