import React from 'react';
import {
  FileText,
  Printer,
  Download,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Award,
  Sparkles,
} from 'lucide-react';
import { MonthlyBudget, FinancialProfile, BudgetReconciliation, FinancialHealthScoreReport, Expense } from '../types';

interface MonthlyReportViewProps {
  budget: MonthlyBudget | null;
  profile: FinancialProfile | null;
  reconciliation: BudgetReconciliation | null;
  healthScoreReport: FinancialHealthScoreReport | null;
  expenses: Expense[];
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  budget,
  profile,
  reconciliation,
  healthScoreReport,
  expenses,
}) => {
  const currentMonthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalIncome = (profile?.monthlySalary || 0) + (profile?.otherIncome || 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Monthly Statement</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Financial Planning Statement</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Comprehensive audit of salary allocations, actual expenditures, and household financial health.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            id="btn-print-report"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Card */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-slate-900 tracking-tight">SmartSpend</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Official Report
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Personal & Household Financial Statement</p>
            <p className="text-xs text-slate-400 mt-0.5">Month of: {currentMonthYear}</p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Generated On</span>
            <span className="text-xs font-semibold text-slate-900">{new Date().toLocaleDateString('en-IN')}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Currency: INR (₹)</span>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inflow</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">
              ₹{totalIncome.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outflow</span>
            <span className="text-lg font-black text-rose-600 mt-1 block">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Savings</span>
            <span className="text-lg font-black text-emerald-600 mt-1 block">
              ₹{netSavings.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Health Score</span>
            <span className="text-lg font-black text-indigo-900 mt-1 block">
              {healthScoreReport?.overallScore || 75}/100 ({healthScoreReport?.grade || 'Good'})
            </span>
          </div>
        </div>

        {/* Planned vs Actual Allocation Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Allocation & Expenditure Breakdown</h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Budget Category</th>
                <th className="py-2.5 px-3">Allocated</th>
                <th className="py-2.5 px-3">Actual Spent</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reconciliation &&
                Object.entries(reconciliation.categorySpending).map(([cat, item]) => {
                  const data = item as { allocated: number; spent: number; remaining: number; utilizationPercent: number };
                  const isOver = data.spent > data.allocated;
                  return (
                    <tr key={cat}>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{cat}</td>
                      <td className="py-2.5 px-3">₹{data.allocated.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3">₹{data.spent.toLocaleString('en-IN')}</td>
                      <td className={`py-2.5 px-3 font-semibold ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isOver ? `+₹${(data.spent - data.allocated).toLocaleString('en-IN')}` : `-₹${data.remaining.toLocaleString('en-IN')}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isOver ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isOver ? 'Over Budget' : 'Within Budget'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Top 5 Spending Areas */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Top 5 Spending Outflows</h3>
          <div className="space-y-2">
            {topCategories.map(([cat, amt]) => {
              const percent = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
              return (
                <div key={cat} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-500">{percent}% of expenses</span>
                    <span className="font-bold text-slate-900">₹{amt.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Advisor Disclaimer & Action Plan */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <h4 className="font-bold text-slate-900">System Action Items</h4>
          <ul className="space-y-1">
            {healthScoreReport?.actionItems.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{item}</span>
              </li>
            )) || <li>Continue consistent SIP allocations and monitor monthly discretionary buffer.</li>}
          </ul>
        </div>

        <div className="text-[10px] text-slate-400 italic text-center pt-4 border-t border-slate-200">
          SmartSpend provides automated personal financial planning and rule-based decision intelligence. It is not an official SEBI-registered investment advisor.
        </div>
      </div>
    </div>
  );
};
