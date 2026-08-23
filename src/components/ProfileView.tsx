import React, { useState } from 'react';
import {
  UserCheck,
  Save,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Award,
  Info,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { FinancialProfile, FinancialHealthScoreReport } from '../types';
import { api } from '../services/api';

interface ProfileViewProps {
  profile: FinancialProfile | null;
  healthScoreReport: FinancialHealthScoreReport | null;
  onProfileUpdated: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  healthScoreReport,
  onProfileUpdated,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [monthlySalary, setMonthlySalary] = useState<number>(profile?.monthlySalary || 85000);
  const [otherIncome, setOtherIncome] = useState<number>(profile?.otherIncome || 0);
  const [rentExpenses, setRentExpenses] = useState<number>(profile?.rentExpenses || 22000);
  const [foodExpenses, setFoodExpenses] = useState<number>(profile?.foodExpenses || 12000);
  const [transportExpenses, setTransportExpenses] = useState<number>(profile?.transportExpenses || 5000);
  const [utilitiesExpenses, setUtilitiesExpenses] = useState<number>(profile?.utilitiesExpenses || 4000);
  const [medicalExpenses, setMedicalExpenses] = useState<number>(profile?.medicalExpenses || 3000);
  const [emiExpenses, setEmiExpenses] = useState<number>(profile?.emiExpenses || 8000);
  const [insuranceExpenses, setInsuranceExpenses] = useState<number>(profile?.insuranceExpenses || 3500);

  const [numberOfFamilyMembers, setNumberOfFamilyMembers] = useState<number>(
    profile?.numberOfFamilyMembers || 3
  );
  const [numberOfChildren, setNumberOfChildren] = useState<number>(profile?.numberOfChildren || 1);
  const [numberOfDependents, setNumberOfDependents] = useState<number>(
    profile?.numberOfDependents || 1
  );

  const [existingSavings, setExistingSavings] = useState<number>(profile?.existingSavings || 60000);
  const [existingEmergencyFund, setExistingEmergencyFund] = useState<number>(
    profile?.existingEmergencyFund || 120000
  );
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState<number>(
    profile?.monthlySavingsTarget || 15000
  );
  const [desiredEmergencyMonths, setDesiredEmergencyMonths] = useState<number>(
    profile?.desiredEmergencyMonths || 6
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateProfile({
        monthlySalary: Number(monthlySalary),
        otherIncome: Number(otherIncome),
        rentExpenses: Number(rentExpenses),
        foodExpenses: Number(foodExpenses),
        transportExpenses: Number(transportExpenses),
        utilitiesExpenses: Number(utilitiesExpenses),
        medicalExpenses: Number(medicalExpenses),
        emiExpenses: Number(emiExpenses),
        insuranceExpenses: Number(insuranceExpenses),
        numberOfFamilyMembers: Number(numberOfFamilyMembers),
        numberOfChildren: Number(numberOfChildren),
        numberOfDependents: Number(numberOfDependents),
        existingSavings: Number(existingSavings),
        existingEmergencyFund: Number(existingEmergencyFund),
        monthlySavingsTarget: Number(monthlySavingsTarget),
        desiredEmergencyMonths: Number(desiredEmergencyMonths),
      });

      setSuccessMsg('Financial profile and budget allocation updated.');
      onProfileUpdated();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Household Baseline</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Financial Profile & Score Engine</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure income streams, mandatory fixed costs, and dependents to calculate baseline allocations and financial health.
          </p>
        </div>

        <button
          id="btn-save-profile"
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6-Pillar Financial Health Score Section */}
      {healthScoreReport && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-indigo-300 mb-2">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>6-Pillar Scoring Algorithm</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Household Financial Health Score: {healthScoreReport.overallScore}/100 ({healthScoreReport.grade})
              </h2>
              <p className="text-xs text-slate-300 mt-1">{healthScoreReport.summary}</p>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center font-black text-2xl text-amber-300 shrink-0">
              {healthScoreReport.overallScore}
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(healthScoreReport.pillars).map(([key, item]) => {
              const pillar = item as { score: number; maxScore: number; label: string; details: string };
              return (
                <div key={key} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{pillar.label}</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {pillar.score}/{pillar.maxScore}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{ width: `${(pillar.score / pillar.maxScore) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{pillar.details}</p>
                </div>
              );
            })}
          </div>

          {/* Strengths & Action Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10 text-xs">
            <div className="space-y-2">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] block">
                Key Strengths
              </span>
              <ul className="space-y-1 text-slate-300">
                {healthScoreReport.keyStrengths.map((s, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                Priority Action Plan
              </span>
              <ul className="space-y-1 text-slate-300">
                {healthScoreReport.actionItems.map((a, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Inflows */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-indigo-600" />
            <span>Monthly Inflows</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Net Monthly Take-Home Salary (₹) *
              </label>
              <input
                id="input-profile-salary"
                type="number"
                min="0"
                step="1000"
                required
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Other Inflows / Freelance / Rental (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={otherIncome}
                onChange={(e) => setOtherIncome(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Fixed Living Costs */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Mandatory Monthly Needs</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rent / Housing (₹)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={rentExpenses}
                onChange={(e) => setRentExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Food & Groceries (₹)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={foodExpenses}
                onChange={(e) => setFoodExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Transport / Fuel (₹)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={transportExpenses}
                onChange={(e) => setTransportExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Utilities & Bills (₹)</label>
              <input
                type="number"
                min="0"
                step="200"
                value={utilitiesExpenses}
                onChange={(e) => setUtilitiesExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Medical / Pharmacy (₹)</label>
              <input
                type="number"
                min="0"
                step="200"
                value={medicalExpenses}
                onChange={(e) => setMedicalExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loan EMIs / Debt (₹)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={emiExpenses}
                onChange={(e) => setEmiExpenses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Family & Reserves */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900">Family Structure & Reserves</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Number of Children</label>
              <input
                type="number"
                min="0"
                value={numberOfChildren}
                onChange={(e) => setNumberOfChildren(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supported Dependents (Parents)</label>
              <input
                type="number"
                min="0"
                value={numberOfDependents}
                onChange={(e) => setNumberOfDependents(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Desired Runway (Months)</label>
              <input
                type="number"
                min="3"
                max="24"
                value={desiredEmergencyMonths}
                onChange={(e) => setDesiredEmergencyMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
