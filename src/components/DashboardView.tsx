import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowRight,
  Target,
  Shield,
  Vault,
  HeartHandshake,
  DollarSign,
  PlusCircle,
  Clock,
} from 'lucide-react';
import {
  MonthlyBudget,
  BudgetReconciliation,
  FinancialHealthScoreReport,
  Expense,
  InsurancePolicy,
  FinancialGoal,
  EmergencyFundAnalysis,
} from '../types';

interface DashboardViewProps {
  budget: MonthlyBudget | null;
  reconciliation: BudgetReconciliation | null;
  healthScoreReport: FinancialHealthScoreReport | null;
  recentExpenses: Expense[];
  policies: InsurancePolicy[];
  goals: FinancialGoal[];
  emergencyAnalysis: EmergencyFundAnalysis | null;
  onNavigateTab: (tab: string) => void;
  onOpenAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  budget,
  reconciliation,
  healthScoreReport,
  recentExpenses,
  policies,
  goals,
  emergencyAnalysis,
  onNavigateTab,
  onOpenAddExpense,
}) => {
  const upcomingPolicies = policies.filter((p) => p.isUpcoming || p.isOverdue);

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Cockpit */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SmartSpend Financial Cockpit</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Monthly Planning & Household Guard
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Real-time allocation of your monthly salary. Evaluate planned purchases before spending to protect your family commitments, insurance coverage, and emergency savings.
            </p>
          </div>

          {/* Health Score Card */}
          {healthScoreReport && (
            <div
              onClick={() => onNavigateTab('profile')}
              className="cursor-pointer bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center space-x-4 transition-all hover:scale-102 shrink-0"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center font-black text-2xl text-amber-300">
                {healthScoreReport.overallScore}
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-200">
                  Financial Health
                </span>
                <p className="font-black text-lg text-white">
                  {healthScoreReport.grade} Grade
                </p>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  6-Pillar Weighted Score
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Bar */}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3">
          <button
            id="btn-dash-spending-check"
            onClick={() => onNavigateTab('spending-check')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>Check a Planned Purchase</span>
          </button>

          <button
            id="btn-dash-add-expense"
            onClick={onOpenAddExpense}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-all flex items-center space-x-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Actual Expense</span>
          </button>

          <button
            onClick={() => onNavigateTab('income')}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-indigo-100 font-semibold text-xs transition-all flex items-center space-x-2"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Adjust Income Allocation</span>
          </button>
        </div>
      </div>

      {/* Critical Alert Bar if any (Overspending or Insurance Renewal) */}
      {(reconciliation?.isOverBudget || upcomingPolicies.length > 0 || (emergencyAnalysis && emergencyAnalysis.isBelowTarget)) && (
        <div className="space-y-2">
          {reconciliation?.isOverBudget && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-rose-900">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Overspending Detected: </span>
                  <span>
                    Monthly expenses have exceeded your total salary by ₹{reconciliation.overspendingAmount.toLocaleString('en-IN')}. Please curb discretionary purchases.
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs font-bold text-rose-700 hover:underline shrink-0 ml-3"
              >
                Review Expenses
              </button>
            </div>
          )}

          {upcomingPolicies.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">Insurance Renewal Approaching: </span>
                  <span>
                    {upcomingPolicies[0].provider} ({upcomingPolicies[0].policyType}) is due for renewal on {upcomingPolicies[0].renewalDate}.
                  </span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('insurance')}
                className="text-xs font-bold text-amber-700 hover:underline shrink-0 ml-3"
              >
                View Policies
              </button>
            </div>
          )}
        </div>
      )}

      {/* Monthly Income Allocation Summary Cards (Requirement 3) */}
      {budget && reconciliation && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Total Salary */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Income
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{budget.totalIncome.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Salary & Other Inflows</span>
          </div>

          {/* Card 2: Mandatory Expenses */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Mandatory Needs
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{budget.mandatoryExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Rent, Food, EMI & Utils</span>
          </div>

          {/* Card 3: Family Support */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
              Family & Kids
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{budget.familyExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Parents & Children</span>
          </div>

          {/* Card 4: Insurance */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
              Insurance
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{budget.insuranceExpenses.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Health & Term Life</span>
          </div>

          {/* Card 5: Emergency & Savings */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
              Savings & Fund
            </span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{(budget.emergencyFundContribution + budget.savingsContribution).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Liquidity & SIP Target</span>
          </div>

          {/* Card 6: Available Discretionary */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-2xl border border-amber-200 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
              Discretionary Buffer
            </span>
            <span className="text-lg font-black text-amber-950 mt-1 block">
              ₹{reconciliation.remainingDiscretionary.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">
              Available from ₹{budget.discretionaryBudget.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Two Columns: Discretionary Spending Gauge + Category Budgets Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Discretionary Meter & Key Modules */}
        <div className="lg:col-span-5 space-y-6">
          {/* Discretionary Meter */}
          {reconciliation && budget && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Discretionary Spending Gauge</h3>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    reconciliation.discretionaryUtilizationPercent > 80
                      ? 'bg-rose-100 text-rose-700'
                      : reconciliation.discretionaryUtilizationPercent > 50
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {reconciliation.discretionaryUtilizationPercent}% Spent
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    reconciliation.discretionaryUtilizationPercent > 80
                      ? 'bg-rose-500'
                      : reconciliation.discretionaryUtilizationPercent > 50
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, reconciliation.discretionaryUtilizationPercent)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Spent: ₹{reconciliation.discretionarySpent.toLocaleString('en-IN')}</span>
                <span>Remaining: ₹{reconciliation.remainingDiscretionary.toLocaleString('en-IN')}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {reconciliation.remainingDiscretionary > 5000
                    ? 'Your discretionary spending is in healthy territory. Keep maintaining balance for month-end goals.'
                    : 'Discretionary buffer is tightening. Defer non-essential shopping until next salary credit.'}
                </p>
              </div>
            </div>
          )}

          {/* Emergency Fund & Goals Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Vault className="w-4 h-4 text-emerald-600" />
                <span>Emergency Fund Status</span>
              </h3>
              <button
                onClick={() => onNavigateTab('emergency-fund')}
                className="text-xs text-indigo-600 font-semibold hover:underline"
              >
                Manage
              </button>
            </div>

            {emergencyAnalysis && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Saved:</span>
                  <span className="font-bold text-slate-900">
                    ₹{emergencyAnalysis.currentSavings.toLocaleString('en-IN')} / ₹{emergencyAnalysis.targetAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${emergencyAnalysis.progressPercent}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{emergencyAnalysis.progressPercent}% of 6-Month Target</span>
                  <span>{emergencyAnalysis.monthsToTarget} Months to Complete</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Category Budgets Breakdown & Recent Expenses */}
        <div className="lg:col-span-7 space-y-6">
          {/* Category Budgets Grid */}
          {reconciliation && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Category Budgets vs. Actual Spending</h3>
                  <p className="text-xs text-slate-500">Live reconciliation against monthly salary pools</p>
                </div>
                <button
                  onClick={() => onNavigateTab('income')}
                  className="text-xs text-indigo-600 font-semibold hover:underline"
                >
                  Adjust Limits
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(reconciliation.categorySpending).slice(0, 8).map(([catName, item]) => {
                  const data = item as { allocated: number; spent: number; remaining: number; utilizationPercent: number };
                  const isOver = data.spent > data.allocated;
                  return (
                    <div
                      key={catName}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isOver ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/60 border-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-800">{catName}</span>
                        <span
                          className={`font-bold ${
                            isOver ? 'text-rose-600' : data.utilizationPercent > 80 ? 'text-amber-600' : 'text-slate-700'
                          }`}
                        >
                          ₹{data.spent.toLocaleString('en-IN')} / ₹{data.allocated.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="w-full bg-slate-200/80 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? 'bg-rose-500' : data.utilizationPercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(100, data.utilizationPercent)}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>{data.utilizationPercent}% utilized</span>
                        <span>{isOver ? `Over by ₹${(data.spent - data.allocated).toLocaleString('en-IN')}` : `₹${data.remaining.toLocaleString('en-IN')} left`}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Recorded Expenses */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Recent Expenses</span>
              </h3>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>View All ({recentExpenses.length})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentExpenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                      {exp.category.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{exp.description}</p>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span>{exp.category}</span>
                        <span>•</span>
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span className="text-slate-600">{exp.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      -₹{exp.amount.toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        exp.necessityLevel === 'Essential'
                          ? 'bg-blue-50 text-blue-700'
                          : exp.necessityLevel === 'Emergency'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {exp.necessityLevel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
