import React, { useState } from 'react';
import {
  Shield,
  Plus,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  DollarSign,
  HeartPulse,
} from 'lucide-react';
import { InsurancePolicy, InsuranceType, PremiumFrequency } from '../types';
import { api } from '../services/api';

interface InsuranceViewProps {
  policies: InsurancePolicy[];
  onPolicyMutated: () => void;
}

export const InsuranceView: React.FC<InsuranceViewProps> = ({ policies, onPolicyMutated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);

  // Form states
  const [policyType, setPolicyType] = useState<InsuranceType>('Health');
  const [provider, setProvider] = useState('');
  const [insuredPerson, setInsuredPerson] = useState('Family Floater');
  const [coverageAmount, setCoverageAmount] = useState<number | ''>(1000000);
  const [premium, setPremium] = useState<number | ''>(1800);
  const [frequency, setFrequency] = useState<PremiumFrequency>('Monthly');
  const [policyNumber, setPolicyNumber] = useState('');
  const [startDate, setStartDate] = useState('2025-01-01');
  const [renewalDate, setRenewalDate] = useState('2027-01-01');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingPolicy(null);
    setPolicyType('Health');
    setProvider('');
    setInsuredPerson('Family Floater');
    setCoverageAmount(1000000);
    setPremium(1800);
    setFrequency('Monthly');
    setPolicyNumber('');
    setStartDate('2025-01-01');
    setRenewalDate('2027-01-01');
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: InsurancePolicy) => {
    setEditingPolicy(p);
    setPolicyType(p.policyType);
    setProvider(p.provider);
    setInsuredPerson(p.insuredPerson);
    setCoverageAmount(p.coverageAmount);
    setPremium(p.premium);
    setFrequency(p.frequency);
    setPolicyNumber(p.policyNumber);
    setStartDate(p.startDate);
    setRenewalDate(p.renewalDate);
    setNotes(p.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider.trim()) {
      setErrorMsg('Provider is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        policyType,
        provider: provider.trim(),
        insuredPerson: insuredPerson.trim(),
        coverageAmount: Number(coverageAmount) || 0,
        premium: Number(premium) || 0,
        frequency,
        policyNumber: policyNumber.trim(),
        startDate,
        renewalDate,
        notes: notes.trim(),
      };

      if (editingPolicy) {
        await api.updateInsurancePolicy(editingPolicy.id, payload);
      } else {
        await api.addInsurancePolicy(payload);
      }

      setIsModalOpen(false);
      onPolicyMutated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    if (!confirm('Are you sure you want to delete this insurance record?')) return;
    try {
      await api.deleteInsurancePolicy(id);
      onPolicyMutated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
  const totalMonthlyPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);
  const upcomingCount = policies.filter((p) => p.isUpcoming || p.isOverdue).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Risk Protection Shield</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Insurance Policies & Renewal Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain adequate health, term life, and asset coverage to insulate your household from catastrophic medical expenses.
          </p>
        </div>

        <button
          id="btn-open-add-policy-modal"
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Insurance Policy</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Protection Sum Assured
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalCoverage.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">{policies.length} Active Policies</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Monthly Premium Outflow
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalMonthlyPremium.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Budgeted in monthly allocations</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Renewal Attention
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {upcomingCount} Due Soon
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Renewals in next 45 days</span>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {policies.map((p) => {
          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                p.isOverdue
                  ? 'border-rose-300 ring-2 ring-rose-200'
                  : p.isUpcoming
                  ? 'border-amber-300 ring-2 ring-amber-200'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {p.policyType}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5">{p.provider}</h3>
                    <p className="text-xs text-slate-500">Insured: {p.insuredPerson}</p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Coverage (Sum Assured):</span>
                    <span className="font-bold text-slate-900">₹{p.coverageAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Premium Outlay:</span>
                    <span className="font-semibold text-slate-900">
                      ₹{p.premium.toLocaleString('en-IN')} / {p.frequency}
                    </span>
                  </div>
                  {p.policyNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Policy Number:</span>
                      <span className="font-mono text-slate-600">{p.policyNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Renewal: {p.renewalDate}</span>
                </div>

                {p.isOverdue ? (
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                    Overdue
                  </span>
                ) : p.isUpcoming ? (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {p.daysUntilRenewal} Days Left
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPolicy ? 'Edit Insurance Policy' : 'Add Insurance Policy'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Type</label>
                  <select
                    value={policyType}
                    onChange={(e) => setPolicyType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="Health">Health Insurance</option>
                    <option value="Term Life">Term Life Insurance</option>
                    <option value="Motor">Motor / Vehicle</option>
                    <option value="Critical Illness">Critical Illness</option>
                    <option value="Home">Home Insurance</option>
                    <option value="Child Education">Child Education Plan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provider *</label>
                  <input
                    type="text"
                    required
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    placeholder="e.g. Star Health, HDFC Life"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insured Person / Group</label>
                <input
                  type="text"
                  value={insuredPerson}
                  onChange={(e) => setInsuredPerson(e.target.value)}
                  placeholder="e.g. Self, Spouse, Family Floater"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sum Assured Coverage (₹)</label>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={coverageAmount}
                    onChange={(e) => setCoverageAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Premium (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={premium}
                    onChange={(e) => setPremium(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Number</label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    placeholder="e.g. POL-992834"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Renewal Date *</label>
                  <input
                    type="date"
                    required
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
