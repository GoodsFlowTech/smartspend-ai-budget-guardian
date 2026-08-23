import {
  ExpenseCategory,
  NecessityLevel,
  SpendingDecisionEvaluation,
  SpendingRiskLevel,
  FinancialProfileEntity,
  EmergencyFundEntity,
  MonthlyBudgetEntity,
  ExpenseEntity,
  ClassificationResult,
} from '../types';
import { ClassifierService } from './classifierService';

export interface SpendingDecisionInput {
  amount: number;
  category: ExpenseCategory;
  description: string;
  necessityLevel: NecessityLevel;
  familyMemberId?: string;
  notes?: string;
}

export class SpendingDecisionEngine {
  /**
   * Evaluates a prospective purchase against the user's real-time financial health,
   * available discretionary budget, category limits, emergency fund status, and savings targets,
   * coupled with Gemini 3.7 Flash AI transaction classification & reasoning.
   */
  public static async evaluatePurchase(
    input: SpendingDecisionInput,
    profile: FinancialProfileEntity,
    budget: MonthlyBudgetEntity,
    emergencyFund: EmergencyFundEntity | undefined,
    currentMonthExpenses: ExpenseEntity[]
  ): Promise<SpendingDecisionEvaluation> {
    const { amount, category, description, necessityLevel } = input;

    // 0. Invoke Gemini AI Transaction Classifier & Merchant Analysis
    const aiClassification: ClassificationResult = await ClassifierService.classifyTransactionGemini(
      description,
      amount,
      {
        cityTier: 'metro',
        numberOfChildren: profile.numberOfChildren,
        numberOfDependents: profile.numberOfDependents,
        monthlyIncome: profile.monthlySalary + (profile.otherIncome || 0),
      }
    );

    // 1. Calculate spent amounts in current month
    const totalSpentSoFar = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const categorySpentSoFar = currentMonthExpenses
      .filter((e) => e.category === category)
      .reduce((sum, e) => sum + e.amount, 0);

    // 2. Discretionary Budget Calculation
    const categoryBudget = budget.categoryBudgets[category] || 3000;
    const categorySpentAfter = categorySpentSoFar + amount;
    const isCategoryExceeded = categorySpentAfter > categoryBudget;
    const categoryOverspendingAmount = Math.max(0, categorySpentAfter - categoryBudget);

    const discretionaryCategories: ExpenseCategory[] = ['Shopping', 'Entertainment', 'Travel', 'Other'];
    const isDiscretionaryCategory = discretionaryCategories.includes(category) || necessityLevel === 'Non-essential';

    const discretionarySpentSoFar = currentMonthExpenses
      .filter((e) => discretionaryCategories.includes(e.category) || e.necessityLevel === 'Non-essential')
      .reduce((sum, e) => sum + e.amount, 0);

    const currentDiscretionary = Math.max(0, budget.discretionaryBudget - discretionarySpentSoFar);
    const remainingDiscretionaryAfter = currentDiscretionary - amount;
    const discretionaryConsumedPercent = currentDiscretionary > 0
      ? Math.min(100, Math.round((amount / currentDiscretionary) * 100))
      : 100;

    // 3. Emergency Fund Analysis
    const emergencyTarget = emergencyFund?.targetAmount || (profile.rentExpenses + profile.foodExpenses + profile.utilitiesExpenses) * (profile.desiredEmergencyMonths || 6);
    const emergencyCurrent = emergencyFund?.currentSavings || profile.existingEmergencyFund || 0;
    const emergencyProgressPercent = emergencyTarget > 0 ? Math.min(100, Math.round((emergencyCurrent / emergencyTarget) * 100)) : 0;
    const isEmergencyFundLow = emergencyProgressPercent < 50;

    // 4. Decision Rule Engine
    let riskLevel: SpendingRiskLevel = 'SAFE';
    let headline = 'Safe to Proceed';
    const reasons: string[] = [];
    const recommendations: string[] = [];

    // Rule A: Emergency/Essential Override
    if (necessityLevel === 'Emergency') {
      riskLevel = 'SAFE';
      headline = '🟢 Critical Emergency Expense – Immediate Priority';
      reasons.push('Classified as an emergency or vital medical requirement.');
      recommendations.push('Authorize immediately. Discretionary limits are waived for critical safety & healthcare.');
    } else if (amount <= 0) {
      riskLevel = 'SAFE';
      headline = '🟢 Valid Entry';
      reasons.push('Zero or nominal amount recorded.');
    } else {
      // Evaluation for normal and non-essential purchases
      const exceedsDiscretionary = amount > currentDiscretionary;
      const consumesHighDiscretionary = discretionaryConsumedPercent > 50;
      const consumesExtremeDiscretionary = discretionaryConsumedPercent > 80;

      // Classify Risk
      if (exceedsDiscretionary && isDiscretionaryCategory) {
        riskLevel = 'HIGH_RISK';
        headline = '🔴 HIGH RISK – Exceeds Available Discretionary Budget';
        reasons.push(
          `This ₹${amount.toLocaleString('en-IN')} purchase exceeds your available monthly discretionary pool of ₹${currentDiscretionary.toLocaleString('en-IN')}.`
        );
        reasons.push(`Making this purchase will cause an unbacked deficit of ₹${Math.abs(remainingDiscretionaryAfter).toLocaleString('en-IN')}.`);
      } else if (consumesExtremeDiscretionary && isDiscretionaryCategory) {
        riskLevel = 'HIGH_RISK';
        headline = `🔴 HIGH RISK – Consumes ${discretionaryConsumedPercent}% of Remaining Discretionary Funds`;
        reasons.push(
          `This purchase will consume nearly your entire remaining discretionary budget (${discretionaryConsumedPercent}%), leaving only ₹${remainingDiscretionaryAfter.toLocaleString('en-IN')} for the rest of the month.`
        );
      } else if (isCategoryExceeded) {
        riskLevel = 'CAUTION';
        headline = `🟡 CAUTION – Exceeds ${category} Category Allocation`;
        reasons.push(
          `Current ${category} spending will reach ₹${categorySpentAfter.toLocaleString('en-IN')} against the monthly budget of ₹${categoryBudget.toLocaleString('en-IN')} (₹${categoryOverspendingAmount.toLocaleString('en-IN')} over budget).`
        );
      } else if (consumesHighDiscretionary && isDiscretionaryCategory) {
        riskLevel = 'CAUTION';
        headline = `🟡 CAUTION – Consumes ${discretionaryConsumedPercent}% of Available Discretionary Budget`;
        reasons.push(
          `This purchase will take more than half (${discretionaryConsumedPercent}%) of your remaining discretionary money (₹${currentDiscretionary.toLocaleString('en-IN')}).`
        );
      } else {
        riskLevel = 'SAFE';
        headline = '🟢 SAFE – Well Within Budget Limits';
        reasons.push(
          `Fits comfortably within your remaining discretionary allowance (consumes ${discretionaryConsumedPercent}%).`
        );
        reasons.push(`Leaves ₹${remainingDiscretionaryAfter.toLocaleString('en-IN')} available for subsequent flexible needs.`);
      }

      // Check secondary factors (Emergency Fund & Savings Target)
      if (isEmergencyFundLow && (necessityLevel === 'Non-essential' || category === 'Shopping' || category === 'Entertainment' || category === 'Travel')) {
        if (riskLevel === 'SAFE') {
          riskLevel = 'CAUTION';
          headline = '🟡 CAUTION – Emergency Fund Below Target';
        }
        reasons.push(
          `Your emergency reserve is currently at ${emergencyProgressPercent}% of its target (₹${emergencyCurrent.toLocaleString('en-IN')} / ₹${emergencyTarget.toLocaleString('en-IN')}).`
        );
        recommendations.push(
          'Consider deferring non-essential purchases until your 6-month emergency cushion is fortified.'
        );
      }

      if (isCategoryExceeded) {
        recommendations.push(
          `Rebalance spending by reducing other discretionary categories (e.g. Dining Out or Entertainment) by ₹${categoryOverspendingAmount.toLocaleString('en-IN')}.`
        );
      }

      if (riskLevel === 'HIGH_RISK') {
        recommendations.push('Delay this purchase to next month after salary credit or split into scheduled installments.');
        recommendations.push('Evaluate if a lower-cost alternative or used/refurbished option satisfies the requirement.');
      } else if (riskLevel === 'CAUTION') {
        recommendations.push('Check upcoming utility bills and family commitments before finalizing authorization.');
        recommendations.push('If proceeding, consider setting a 48-hour cooling-off rule for non-essential items.');
      } else {
        recommendations.push('Purchase is safely funded. Retain receipt or invoice for monthly accounting.');
      }
    }

    // AI Semantic Enrichment: Uncertainty guardrail & AI reasoning insights
    if (aiClassification.category === 'uncertain') {
      reasons.unshift(
        `⚠️ AI Uncertainty Guardrail: Merchant descriptor "${description}" is ambiguous (${(aiClassification.confidence * 100).toFixed(0)}% confidence). ${aiClassification.reasoning}`
      );
      if (riskLevel === 'SAFE') {
        riskLevel = 'CAUTION';
        headline = '🟡 CAUTION – Unverified Merchant / Ambiguous Category';
      }
      recommendations.unshift('Confirm the exact merchant name and ensure this is not an unintended or fraudulent recurring charge.');
    } else {
      reasons.push(
        `💡 AI Merchant Intelligence [${aiClassification.source === 'gemini' ? 'Gemini 3.7 Flash' : 'Heuristic Guard'}] (${(aiClassification.confidence * 100).toFixed(0)}% confidence): ${aiClassification.reasoning}`
      );
      if (aiClassification.suggestedSubcategory) {
        recommendations.push(`AI suggested subcategory: ${aiClassification.suggestedSubcategory}.`);
      }
    }

    // Savings impact note
    let savingsTargetImpact = 'Monthly savings target is fully safeguarded.';
    if (riskLevel === 'HIGH_RISK') {
      savingsTargetImpact = 'Risk of eating into monthly savings target or emergency deposits.';
    } else if (riskLevel === 'CAUTION') {
      savingsTargetImpact = 'Requires strict discipline on subsequent discretionary items to protect savings.';
    }

    return {
      riskLevel,
      headline,
      reasons,
      recommendations,
      aiClassification,
      financialImpact: {
        amount,
        category,
        currentDiscretionary,
        remainingDiscretionaryAfter,
        discretionaryConsumedPercent,
        categoryBudget,
        categorySpentBefore: categorySpentSoFar,
        categorySpentAfter,
        isCategoryExceeded,
        categoryOverspendingAmount,
        emergencyFundProgressPercent: emergencyProgressPercent,
        isEmergencyFundLow,
        savingsTargetImpact,
      },
      disclaimer:
        'SmartSpend provides algorithmic budgeting guidance powered by Gemini 3.7 Flash based on your configured profile and monthly income rules. This does not constitute licensed fiduciary or investment advice.',
    };
  }
}
