import React, { useState } from 'react';
import {
  Vault,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Save,
  CheckCircle2,
  Info,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { EmergencyFund, EmergencyFundAnalysis } from '../types';
import { api } from '../services/api';
import { RazorpayModal } from './RazorpayModal';

interface EmergencyFundViewProps {
  emergencyFund: EmergencyFund | null;
  analysis: EmergencyFundAnalysis | null;
  onFundUpdated: () => void;
}

export const EmergencyFundView: React.FC<EmergencyFundViewProps> = ({
  emergencyFund,
  analysis,
  onFundUpdated,
}) => {
  const [currentSavings, setCurrentSavings] = useState<number>(emergencyFund?.currentSavings || 0);
  const [desiredMonths, setDesiredMonths] = useState<number>(emergencyFund?.desiredMonths || 6);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(
    emergencyFund?.monthlyContribution || 5000
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const essentialMonthly = analysis?.essentialExpenses || 35000;
  const calculatedTarget = essentialMonthly * desiredMonths;
  const progressPercent = calculatedTarget > 0 ? Math.min(100, Math.round((currentSavings / calculatedTarget) * 100)) : 0;
  const shortfall = Math.max(0, calculatedTarget - currentSavings);
  const monthsToTarget = monthlyContribution > 0 ? Math.ceil(shortfall / monthlyContribution) : 0;
  const currentMonthsRunway = essentialMonthly > 0 ? Number((currentSavings / essentialMonthly).toFixed(1)) : 0;

  const handleSaveFund = async () => {
    setIsSaving(true);
    try {
      await api.updateEmergencyFund({
        currentSavings: Number(currentSavings),
        desiredMonths: Number(desiredMonths),
        monthlyContribution: Number(monthlyContribution),
        targetAmount: calculatedTarget,
      });
      setSuccessMsg('Emergency fund parameters updated.');
      onFundUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-emerald-200">
              <Vault className="w-3.5 h-3.5" />
              <span>Liquidity Cushion Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Emergency Fund & Runway</h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Maintain an inviolable safety buffer in high-yield liquid instruments to shield your family from job transitions, medical events, and unexpected emergencies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              id="btn-deposit-emergency-fund"
              onClick={() => setIsDepositModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Deposit via Razorpay</span>
            </button>
            <button
              id="btn-save-emergency-fund"
              onClick={handleSaveFund}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save Fund Target'}</span>
            </button>
          </div>
        </div>
      </div>

      <RazorpayModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        title="Emergency Fund Deposit"
        purpose="Emergency Liquidity Reserve Top-Up"
        defaultAmount={monthlyContribution || 5000}
        isEmergencyFund={true}
        onSuccess={() => {
          onFundUpdated();
        }}
      />

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Target Runway Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Current Saved Cushion
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{currentSavings.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-emerald-600 font-semibold block mt-0.5">
            {currentMonthsRunway} Months of Runway
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Target Reserve ({desiredMonths} Months)
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{calculatedTarget.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">
            Based on ₹{essentialMonthly.toLocaleString('en-IN')}/mo living costs
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Funding Shortfall
          </span>
          <span className={`text-2xl font-black mt-1 block ${shortfall > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            ₹{shortfall.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">
            {shortfall === 0 ? 'Fully Funded' : 'Remaining to save'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Estimated Runway Completion
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {shortfall === 0 ? 'Achieved' : `${monthsToTarget} Months`}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">
            At ₹{monthlyContribution.toLocaleString('en-IN')}/month
          </span>
        </div>
      </div>

      {/* Interactive Controls & Progress Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900">Fund Parameters & Contribution</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Emergency Savings Balance (₹)
              </label>
              <input
                id="input-emergency-current"
                type="number"
                min="0"
                step="5000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Desired Emergency Coverage (Months of Essential Needs)
              </label>
              <select
                id="select-emergency-months"
                value={desiredMonths}
                onChange={(e) => setDesiredMonths(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white outline-none"
              >
                <option value={3}>3 Months (Minimum for dual-income)</option>
                <option value={6}>6 Months (Standard recommended)</option>
                <option value={9}>9 Months (Self-employed / single earner)</option>
                <option value={12}>12 Months (Conservative / high dependent)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Planned Allocation (₹)
              </label>
              <input
                id="input-emergency-monthly-contrib"
                type="number"
                min="500"
                step="500"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Visual Progress & Insights */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Coverage Fulfillment</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {progressPercent}% Complete
            </span>
          </div>

          {/* Large Progress Bar */}
          <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-xs text-slate-500">
            <span>₹0</span>
            <span>Target: ₹{calculatedTarget.toLocaleString('en-IN')}</span>
          </div>

          {/* Smart Recommendations */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safety Recommendations</span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep 50% of your emergency fund in an instant-access high-yield savings account or liquid mutual fund, and the remaining 50% in sweep-in bank fixed deposits for guaranteed liquidity without market volatility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
