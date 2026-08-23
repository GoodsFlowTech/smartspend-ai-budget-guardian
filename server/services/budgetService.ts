import { FinancialProfileEntity, MonthlyBudgetEntity, ExpenseEntity } from '../types';

export class BudgetService {
  /**
   * Computes the mathematical income allocation:
   * Total Income
   * - Mandatory Expenses (Rent + Basic Food + Transport + Utilities + Medical + EMI)
   * - Family Expenses (Parental support + Children basic needs)
   * - Insurance (Health + Life + Vehicle premiums)
   * - Emergency Fund Contribution
   * - Savings/Investment
   * = Discretionary Amount
   */
  public static calculateMonthlyAllocation(
    profile: FinancialProfileEntity,
    customAllocations?: Partial<MonthlyBudgetEntity>
  ): MonthlyBudgetEntity {
    const totalIncome = (profile.monthlySalary || 0) + (profile.otherIncome || 0);

    // Mandatory Expenses: Baseline necessities to live and service debt
    const mandatoryExpenses =
      (profile.rentExpenses || 0) +
      (profile.foodExpenses || 0) +
      (profile.transportExpenses || 0) +
      (profile.utilitiesExpenses || 0) +
      (profile.medicalExpenses || 0) +
      (profile.emiExpenses || 0);

    // Family support: based on dependents or explicitly set
    const familyExpenses = profile.numberOfDependents > 0 ? (profile.numberOfDependents * 2500) : 0;

    // Insurance: from declared insurance profile
    const insuranceExpenses = profile.insuranceExpenses || 0;

    // Emergency Fund monthly contribution
    const emergencyFundContribution = 5000;

    // Savings target
    const savingsContribution = profile.monthlySavingsTarget || Math.round(totalIncome * 0.15);

    // Discretionary Budget: The true uncommitted cash available for lifestyle/shopping/entertainment
    const totalCommitted =
      mandatoryExpenses +
      familyExpenses +
      insuranceExpenses +
      emergencyFundContribution +
      savingsContribution;

    const discretionaryBudget = Math.max(0, totalIncome - totalCommitted);

    // Category Budgets: Default rule breakdown based on profile expenses
    const categoryBudgets: Record<string, number> = {
      Housing: profile.rentExpenses || Math.round(totalIncome * 0.25),
      Food: profile.foodExpenses || Math.round(totalIncome * 0.12),
      Transportation: profile.transportExpenses || Math.round(totalIncome * 0.05),
      Utilities: profile.utilitiesExpenses || Math.round(totalIncome * 0.04),
      Medical: profile.medicalExpenses || Math.round(totalIncome * 0.04),
      'EMI/Loan': profile.emiExpenses || Math.round(totalIncome * 0.08),
      Insurance: insuranceExpenses || Math.round(totalIncome * 0.05),
      Family: familyExpenses || Math.round(totalIncome * 0.08),
      Education: profile.numberOfChildren > 0 ? Math.round(totalIncome * 0.08) : 2000,
      Bills: profile.utilitiesExpenses || 2500,
      Shopping: Math.round(discretionaryBudget * 0.35),
      Entertainment: Math.round(discretionaryBudget * 0.25),
      Travel: Math.round(discretionaryBudget * 0.20),
      Other: Math.round(discretionaryBudget * 0.20),
      Children: profile.numberOfChildren > 0 ? 4000 : 0,
    };

    const currentMonth = new Date().toISOString().slice(0, 7);

    return {
      id: `bgt_${profile.userId}_${currentMonth}`,
      userId: profile.userId,
      monthYear: currentMonth,
      totalIncome,
      mandatoryExpenses: customAllocations?.mandatoryExpenses ?? mandatoryExpenses,
      familyExpenses: customAllocations?.familyExpenses ?? familyExpenses,
      insuranceExpenses: customAllocations?.insuranceExpenses ?? insuranceExpenses,
      emergencyFundContribution: customAllocations?.emergencyFundContribution ?? emergencyFundContribution,
      savingsContribution: customAllocations?.savingsContribution ?? savingsContribution,
      discretionaryBudget: customAllocations?.discretionaryBudget ?? discretionaryBudget,
      categoryBudgets: { ...categoryBudgets, ...(customAllocations?.categoryBudgets || {}) },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Reconciles current month expenses against budget pools
   */
  public static reconcileSpending(budget: MonthlyBudgetEntity, expenses: ExpenseEntity[]) {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categorySpending: Record<string, { allocated: number; spent: number; remaining: number; utilizationPercent: number }> = {};

    for (const [category, allocated] of Object.entries(budget.categoryBudgets)) {
      const spent = expenses
        .filter((e) => e.category === category)
        .reduce((sum, e) => sum + e.amount, 0);
      const remaining = allocated - spent;
      const utilizationPercent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;

      categorySpending[category] = {
        allocated,
        spent,
        remaining,
        utilizationPercent,
      };
    }

    const discretionaryCategories = ['Shopping', 'Entertainment', 'Travel', 'Other'];
    const discretionarySpent = expenses
      .filter((e) => discretionaryCategories.includes(e.category) || e.necessityLevel === 'Non-essential')
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingDiscretionary = Math.max(0, budget.discretionaryBudget - discretionarySpent);

    return {
      totalIncome: budget.totalIncome,
      totalSpent,
      discretionaryBudget: budget.discretionaryBudget,
      discretionarySpent,
      remainingDiscretionary,
      discretionaryUtilizationPercent:
        budget.discretionaryBudget > 0
          ? Math.min(100, Math.round((discretionarySpent / budget.discretionaryBudget) * 100))
          : 100,
      categorySpending,
      isOverBudget: totalSpent > budget.totalIncome,
      overspendingAmount: Math.max(0, totalSpent - budget.totalIncome),
    };
  }
}
