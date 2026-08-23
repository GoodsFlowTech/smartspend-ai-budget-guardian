import React, { useState } from 'react';
import {
  PieChart,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Shield,
  HeartHandshake,
  Target,
  Vault,
} from 'lucide-react';
import { MonthlyBudget, FinancialProfile, BudgetReconciliation } from '../types';
import { api } from '../services/api';

interface IncomeAllocationViewProps {
  budget: MonthlyBudget | null;
  profile: FinancialProfile | null;
  reconciliation: BudgetReconciliation | null;
  onBudgetUpdated: () => void;
}

export const IncomeAllocationView: React.FC<IncomeAllocationViewProps> = ({
  budget,
  profile,
  reconciliation,
  onBudgetUpdated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable category limits
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(
    budget?.categoryBudgets || {
      Food: 12000,
      Housing: 18000,
      Transportation: 5000,
      Shopping: 5000,
      Entertainment: 4000,
      Bills: 4000,
      Medical: 3000,
      Education: 6000,
      Travel: 3000,
      Other: 2000,
    }
  );

  const handleUpdateCategoryLimit = (cat: string, value: number) => {
    setCategoryBudgets((prev) => ({
      ...prev,
      [cat]: value,
    }));
  };

  const handleSaveBudget = async () => {
    if (!budget) return;
    setIsSaving(true);
    try {
      await api.updateBudget({
        categoryBudgets,
      });
      setSuccessMsg('Budget allocations updated successfully.');
      onBudgetUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save budget');
    } finally {
      setIsSaving(false);
    }
  };

  if (!budget || !profile) {
    return <div className="p-8 text-center text-slate-500">Loading budget allocations...</div>;
  }

  const totalIncome = (profile.monthlySalary || 0) + (profile.otherIncome || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              <PieChart className="w-3.5 h-3.5" />
              <span>Zero-Sum Salary Allocation Formula</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900">Income & Expenditure Architecture</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Every rupee is planned before it is spent. Maintain strict partitions between living essentials, family security, and discretionary spending.
            </p>
          </div>

          <button
            id="btn-save-budget-allocations"
            onClick={handleSaveBudget}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Allocations'}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Formula Breakdown Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
          SmartSpend Allocation Equation
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto text-xs sm:text-sm font-mono flex items-center space-x-3 text-slate-200">
          <span className="text-emerald-400 font-bold">Total Salary (₹{totalIncome.toLocaleString('en-IN')})</span>
          <span className="text-slate-400">-</span>
          <span className="text-blue-400">Mandatory (₹{budget.mandatoryExpenses.toLocaleString('en-IN')})</span>
          <span className="text-slate-400">-</span>
          <span className="text-indigo-400">Family (₹{budget.familyExpenses.toLocaleString('en-IN')})</span>
          <span className="text-slate-400">-</span>
          <span className="text-purple-400">Insurance (₹{budget.insuranceExpenses.toLocaleString('en-IN')})</span>
          <span className="text-slate-400">-</span>
          <span className="text-emerald-400">Emergency & SIP (₹{(budget.emergencyFundContribution + budget.savingsContribution).toLocaleString('en-IN')})</span>
          <span className="text-slate-400">=</span>
          <span className="text-amber-400 font-bold bg-amber-400/20 px-2 py-0.5 rounded">
            Discretionary Buffer (₹{budget.discretionaryBudget.toLocaleString('en-IN')})
          </span>
        </div>
      </div>

      {/* Allocation Pools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mandatory Living Needs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mandatory Needs</h3>
              <p className="text-xs text-slate-500">Rent, Groceries, Utilities, EMIs</p>
            </div>
          </div>

          <div className="text-2xl font-black text-slate-900">
            ₹{budget.mandatoryExpenses.toLocaleString('en-IN')}
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Rent / Home EMI:</span>
              <span className="font-semibold text-slate-900">₹{profile.rentExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Food & Groceries:</span>
              <span className="font-semibold text-slate-900">₹{profile.foodExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Utilities & Bills:</span>
              <span className="font-semibold text-slate-900">₹{profile.utilitiesExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Transportation / Fuel:</span>
              <span className="font-semibold text-slate-900">₹{profile.transportExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Loans / EMIs:</span>
              <span className="font-semibold text-slate-900">₹{profile.emiExpenses.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Family & Commitments */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Family & Insurance</h3>
              <p className="text-xs text-slate-500">Parents, Kids & Policy Premiums</p>
            </div>
          </div>

          <div className="text-2xl font-black text-slate-900">
            ₹{(budget.familyExpenses + budget.insuranceExpenses).toLocaleString('en-IN')}
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Family & Dependent Care:</span>
              <span className="font-semibold text-slate-900">₹{budget.familyExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Health & Term Insurance:</span>
              <span className="font-semibold text-slate-900">₹{budget.insuranceExpenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Number of Dependents:</span>
              <span className="font-semibold text-slate-900">{profile.numberOfDependents + profile.numberOfChildren} members</span>
            </div>
          </div>
        </div>

        {/* Wealth & Discretionary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Vault className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Savings & Discretionary</h3>
              <p className="text-xs text-slate-500">Reserve & Flexible Spending</p>
            </div>
          </div>

          <div className="text-2xl font-black text-emerald-700">
            ₹{(budget.emergencyFundContribution + budget.savingsContribution + budget.discretionaryBudget).toLocaleString('en-IN')}
          </div>

          <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Emergency Fund Deposit:</span>
              <span className="font-semibold text-emerald-600">₹{budget.emergencyFundContribution.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Goal SIP / Savings:</span>
              <span className="font-semibold text-emerald-600">₹{budget.savingsContribution.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>Discretionary Allowance:</span>
              <span className="text-amber-600">₹{budget.discretionaryBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Level Budget Allocation Limits */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">Custom Category Budget Limits</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure monthly ceiling limits for specific spending areas to prevent accidental category overruns.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(categoryBudgets).map(([cat, limit]) => (
            <div key={cat} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{cat} Limit</span>
                <span className="text-slate-400 font-mono">Monthly</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-semibold text-xs">₹</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={limit}
                  onChange={(e) => handleUpdateCategoryLimit(cat, Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
