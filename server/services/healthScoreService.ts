import {
  FinancialHealthScoreReport,
  FinancialProfileEntity,
  EmergencyFundEntity,
  InsurancePolicyEntity,
  FinancialGoalEntity,
  ExpenseEntity,
  MonthlyBudgetEntity,
} from '../types';

export class HealthScoreService {
  /**
   * Transparently calculates Financial Health Score (0-100) across 6 weighted pillars:
   * 1. Savings Rate (20 points)
   * 2. Emergency Fund (20 points)
   * 3. Budget Adherence (20 points)
   * 4. Debt & EMI Burden (15 points)
   * 5. Insurance Protection (15 points)
   * 6. Financial Goal Momentum (10 points)
   */
  public static calculateHealthScore(
    profile: FinancialProfileEntity,
    budget: MonthlyBudgetEntity,
    expenses: ExpenseEntity[],
    emergencyFund: EmergencyFundEntity | undefined,
    insurancePolicies: InsurancePolicyEntity[],
    goals: FinancialGoalEntity[]
  ): FinancialHealthScoreReport {
    const totalIncome = (profile.monthlySalary || 0) + (profile.otherIncome || 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 1. Savings Rate (Max 20 pts)
    // Formula: target savings / total income (Target >= 20% = 20 pts)
    const targetSavings = profile.monthlySavingsTarget || 0;
    const savingsRatio = totalIncome > 0 ? targetSavings / totalIncome : 0;
    let savingsScore = Math.min(20, Math.round(savingsRatio * 100));
    if (savingsRatio >= 0.20) savingsScore = 20;
    else if (savingsRatio >= 0.15) savingsScore = 16;
    else if (savingsRatio >= 0.10) savingsScore = 12;
    else if (savingsRatio >= 0.05) savingsScore = 8;
    else savingsScore = 4;

    const savingsStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      savingsScore >= 16 ? 'Good' : savingsScore >= 10 ? 'Fair' : 'Needs Improvement';

    // 2. Emergency Fund Coverage (Max 20 pts)
    // Ratio of current emergency savings / target (6 months essential expenses)
    const currentEmergency = emergencyFund?.currentSavings || profile.existingEmergencyFund || 0;
    const targetEmergency = emergencyFund?.targetAmount || ((profile.rentExpenses + profile.foodExpenses + profile.utilitiesExpenses) * 6);
    const emergencyRatio = targetEmergency > 0 ? currentEmergency / targetEmergency : 0;
    let emergencyScore = 0;
    if (emergencyRatio >= 1.0) emergencyScore = 20;
    else if (emergencyRatio >= 0.75) emergencyScore = 16;
    else if (emergencyRatio >= 0.50) emergencyScore = 12;
    else if (emergencyRatio >= 0.25) emergencyScore = 7;
    else emergencyScore = 3;

    const emergencyStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      emergencyScore >= 16 ? 'Good' : emergencyScore >= 10 ? 'Fair' : 'Needs Improvement';

    // 3. Budget Adherence & Overspending (Max 20 pts)
    // Compares total spending vs total income and category budget overages
    let budgetScore = 20;
    if (totalSpent > totalIncome) {
      budgetScore = Math.max(0, 20 - Math.round(((totalSpent - totalIncome) / totalIncome) * 40));
    } else {
      // Check discretionary spend ratio
      const discretionarySpent = expenses
        .filter((e) => ['Shopping', 'Entertainment', 'Travel', 'Other'].includes(e.category) || e.necessityLevel === 'Non-essential')
        .reduce((sum, e) => sum + e.amount, 0);
      if (budget.discretionaryBudget > 0 && discretionarySpent > budget.discretionaryBudget) {
        budgetScore -= 6;
      }
    }
    budgetScore = Math.max(2, Math.min(20, budgetScore));
    const budgetStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      budgetScore >= 16 ? 'Good' : budgetScore >= 10 ? 'Fair' : 'Needs Improvement';

    // 4. Debt & EMI Burden (Max 15 pts)
    // EMI / Income ratio (<25% = 15 pts, 25-40% = 10 pts, >40% = 4 pts)
    const emiExpenses = profile.emiExpenses || 0;
    const emiRatio = totalIncome > 0 ? emiExpenses / totalIncome : 0;
    let debtScore = 15;
    if (emiRatio === 0) debtScore = 15;
    else if (emiRatio <= 0.15) debtScore = 14;
    else if (emiRatio <= 0.25) debtScore = 11;
    else if (emiRatio <= 0.40) debtScore = 7;
    else debtScore = 3;

    const debtStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      debtScore >= 12 ? 'Good' : debtScore >= 8 ? 'Fair' : 'Needs Improvement';

    // 5. Insurance Protection (Max 15 pts)
    // Checks for both Health and Term Life policies
    const hasHealth = insurancePolicies.some((p) => p.policyType === 'Health');
    const hasLife = insurancePolicies.some((p) => p.policyType === 'Term Life');
    let insuranceScore = 0;
    if (hasHealth && hasLife) insuranceScore = 15;
    else if (hasHealth || hasLife) insuranceScore = 9;
    else if (insurancePolicies.length > 0) insuranceScore = 6;
    else insuranceScore = 2;

    const insuranceStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      insuranceScore >= 12 ? 'Good' : insuranceScore >= 8 ? 'Fair' : 'Needs Improvement';

    // 6. Financial Goal Momentum (Max 10 pts)
    let goalScore = 5;
    if (goals.length > 0) {
      const activeMonthlyGoals = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);
      if (activeMonthlyGoals > 0) goalScore = 10;
      else goalScore = 7;
    } else {
      goalScore = 4;
    }
    const goalStatus: 'Good' | 'Fair' | 'Needs Improvement' =
      goalScore >= 8 ? 'Good' : goalScore >= 5 ? 'Fair' : 'Needs Improvement';

    // Total Overall Score
    const overallScore = Math.min(
      100,
      Math.max(0, savingsScore + emergencyScore + budgetScore + debtScore + insuranceScore + goalScore)
    );

    let grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' | 'Critical' = 'Good';
    if (overallScore >= 85) grade = 'Excellent';
    else if (overallScore >= 70) grade = 'Good';
    else if (overallScore >= 55) grade = 'Fair';
    else if (overallScore >= 40) grade = 'Needs Attention';
    else grade = 'Critical';

    const keyStrengths: string[] = [];
    const actionItems: string[] = [];

    if (savingsScore >= 16) keyStrengths.push('Strong savings discipline exceeding 15% of income.');
    else actionItems.push('Increase automated monthly SIP savings to reach at least 15–20% of net salary.');

    if (emergencyScore >= 16) keyStrengths.push('Emergency fund is well-capitalized for 6+ months.');
    else actionItems.push('Accelerate emergency fund contributions to achieve a 6-month safety reserve.');

    if (budgetScore >= 16) keyStrengths.push('Disciplined budget adherence with controlled discretionary spend.');
    else actionItems.push('Reduce non-essential shopping and entertainment to prevent budget overruns.');

    if (debtScore >= 12) keyStrengths.push('Low debt-to-income ratio (<20%) preserving financial flexibility.');
    else actionItems.push('Prioritize early prepayment of high-interest EMI or loan obligations.');

    if (insuranceScore >= 12) keyStrengths.push('Adequate baseline protection with active Health & Term Life insurance.');
    else actionItems.push('Secure comprehensive family floater health insurance and pure term life protection.');

    if (goalScore >= 8) keyStrengths.push('Active monthly contributions allocated to structured life milestones.');

    return {
      overallScore,
      grade,
      pillars: {
        savingsRate: {
          score: savingsScore,
          maxScore: 20,
          label: 'Savings Rate',
          status: savingsStatus,
          details: `Allocating ₹${targetSavings.toLocaleString('en-IN')}/mo (${Math.round(savingsRatio * 100)}% of income).`,
        },
        emergencyFund: {
          score: emergencyScore,
          maxScore: 20,
          label: 'Emergency Reserve',
          status: emergencyStatus,
          details: `Covering ${Math.round(emergencyRatio * (profile.desiredEmergencyMonths || 6))} of ${profile.desiredEmergencyMonths || 6} target months (₹${currentEmergency.toLocaleString('en-IN')} / ₹${targetEmergency.toLocaleString('en-IN')}).`,
        },
        budgetAdherence: {
          score: budgetScore,
          maxScore: 20,
          label: 'Budget Discipline',
          status: budgetStatus,
          details: `Monthly spending is ${totalSpent > totalIncome ? 'exceeding income' : 'within allocated spending caps'}.`,
        },
        debtBurden: {
          score: debtScore,
          maxScore: 15,
          label: 'Debt / EMI Burden',
          status: debtStatus,
          details: `Fixed EMI is ₹${emiExpenses.toLocaleString('en-IN')} (${Math.round(emiRatio * 100)}% debt-to-income ratio).`,
        },
        insuranceProtection: {
          score: insuranceScore,
          maxScore: 15,
          label: 'Insurance & Protection',
          status: insuranceStatus,
          details: hasHealth && hasLife ? 'Both Health and Term Life policies active.' : 'Missing essential protection covers.',
        },
        goalMomentum: {
          score: goalScore,
          maxScore: 10,
          label: 'Goal Progress',
          status: goalStatus,
          details: `${goals.length} active financial goal(s) registered with scheduled contributions.`,
        },
      },
      summary: `Your household financial health is rated ${grade} (${overallScore}/100). ${
        overallScore >= 75
          ? 'Your income allocation and risk protection foundations are well balanced.'
          : 'Focusing on building emergency liquidity and moderating discretionary spending will elevate your score.'
      }`,
      keyStrengths,
      actionItems,
    };
  }
}
