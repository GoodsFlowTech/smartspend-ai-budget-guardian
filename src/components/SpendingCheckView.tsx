import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  ExpenseCategory,
  NecessityLevel,
  PaymentMethod,
  SpendingDecisionEvaluation,
  FamilyMember,
} from '../types';
import { api } from '../services/api';

interface SpendingCheckViewProps {
  familyMembers: FamilyMember[];
  onExpenseRecorded: () => void;
  onNavigateTab: (tab: string) => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Shopping',
  'Entertainment',
  'Food',
  'Travel',
  'Transportation',
  'Medical',
  'Education',
  'Bills',
  'Family',
  'Children',
  'Housing',
  'Insurance',
  'EMI/Loan',
  'Other',
];

const PRESETS = [
  { amount: 6000, category: 'Shopping' as ExpenseCategory, description: 'Noise Cancelling Headphones', necessity: 'Non-essential' as NecessityLevel },
  { amount: 2500, category: 'Food' as ExpenseCategory, description: 'Fine Dining Weekend Family Buffet', necessity: 'Non-essential' as NecessityLevel },
  { amount: 15000, category: 'Medical' as ExpenseCategory, description: 'Emergency Dental Surgery Deposit', necessity: 'Emergency' as NecessityLevel },
  { amount: 12000, category: 'Travel' as ExpenseCategory, description: 'Weekend Hill Resort Getaway', necessity: 'Non-essential' as NecessityLevel },
  { amount: 1400, category: 'Education' as ExpenseCategory, description: 'Science Olympiad Preparatory Books', necessity: 'Important' as NecessityLevel },
];

export const SpendingCheckView: React.FC<SpendingCheckViewProps> = ({
  familyMembers,
  onExpenseRecorded,
  onNavigateTab,
}) => {
  const [amount, setAmount] = useState<number | ''>(6000);
  const [category, setCategory] = useState<ExpenseCategory>('Shopping');
  const [description, setDescription] = useState('Sony Noise Cancelling Headphones');
  const [necessityLevel, setNecessityLevel] = useState<NecessityLevel>('Non-essential');
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Credit Card');

  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<SpendingDecisionEvaluation | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || amount <= 0) {
      setErrorMessage('Please enter a valid spending amount');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);
    setSuccessToast(null);

    try {
      const result = await api.evaluateSpending({
        amount: Number(amount),
        category,
        description: description.trim() || 'Prospective Purchase',
        necessityLevel,
        familyMemberId: familyMemberId || undefined,
      });
      setEvaluation(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to evaluate spending decision');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setAmount(preset.amount);
    setCategory(preset.category);
    setDescription(preset.description);
    setNecessityLevel(preset.necessity);
    setEvaluation(null);
  };

  const handleProceedAndRecord = async () => {
    if (!amount || !evaluation) return;
    setIsRecording(true);
    try {
      await api.addExpense({
        amount: Number(amount),
        category,
        subcategory: 'Pre-evaluated Purchase',
        description: description || 'Smart Spending Approved Purchase',
        paymentMethod,
        necessityLevel,
        familyMemberId: familyMemberId || undefined,
        date: new Date().toISOString().slice(0, 10),
      });

      setSuccessToast(`Successfully recorded ₹${Number(amount).toLocaleString('en-IN')} to your expenses ledger.`);
      onExpenseRecorded();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record expense');
    } finally {
      setIsRecording(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'SAFE':
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Spending Status</span>
              <p className="font-bold text-base">🟢 SAFE TO PROCEED</p>
            </div>
          </div>
        );
      case 'CAUTION':
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Spending Status</span>
              <p className="font-bold text-base">🟡 CAUTION ADVISED</p>
            </div>
          </div>
        );
      case 'HIGH_RISK':
        return (
          <div className="flex items-center space-x-2 px-4 py-2 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200">
            <AlertOctagon className="w-6 h-6 text-rose-600" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Spending Status</span>
              <p className="font-bold text-base">🔴 HIGH RISK DEFICIT</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pre-Purchase Decision Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">What are you planning to spend?</h1>
          <p className="mt-2 text-sm text-amber-100 leading-relaxed">
            Before swiping your card or scanning a QR code, evaluate how this purchase impacts your remaining monthly discretionary budget, category limits, emergency cushion, and family obligations.
          </p>
        </div>
      </div>

      {/* Quick Test Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 mr-1">Quick Scenarios:</span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleApplyPreset(p)}
            className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors shadow-2xs"
          >
            {p.description} (₹{p.amount.toLocaleString('en-IN')})
          </button>
        ))}
      </div>

      {/* Evaluation Input Form & Simulation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Purchase Parameters</span>
          </h2>

          <form onSubmit={handleEvaluate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Planned Spending Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-sm">₹</span>
                <input
                  id="input-spending-amount"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 6000"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                id="select-spending-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Item / Description *</label>
              <input
                id="input-spending-desc"
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Wireless Headphones, Dinner, Shoes"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Necessity Level</label>
                <select
                  id="select-spending-necessity"
                  value={necessityLevel}
                  onChange={(e) => setNecessityLevel(e.target.value as NecessityLevel)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Non-essential">Non-essential (Luxury/Wants)</option>
                  <option value="Important">Important (Semi-necessary)</option>
                  <option value="Essential">Essential (Living Need)</option>
                  <option value="Emergency">Emergency (Urgent/Medical)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
            </div>

            {familyMembers.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Family Member (Optional)
                </label>
                <select
                  value={familyMemberId}
                  onChange={(e) => setFamilyMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Personal / General Household</option>
                  {familyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.relationship})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              id="btn-run-spending-check"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-indigo-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Purchase Impact</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Decision Engine Analysis Output */}
        <div className="lg:col-span-7">
          {!evaluation ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Ready to Analyze</h3>
              <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                Enter your planned expenditure amount and category on the left, then click <strong>Evaluate Purchase Impact</strong> to run our 7-factor financial risk matrix.
              </p>
              <button
                onClick={() => handleEvaluate()}
                className="mt-6 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Run Sample Evaluation
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in-50">
              {/* Status Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                {getRiskBadge(evaluation.riskLevel)}
                <div className="text-right sm:text-right">
                  <span className="text-xs text-slate-400 block">Proposed Purchase</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{evaluation.financialImpact.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div>
                <h3 className="text-base font-bold text-slate-900">{evaluation.headline}</h3>
              </div>

              {/* AI Merchant Intelligence Card */}
              {evaluation.aiClassification && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-white to-amber-50/40 border border-indigo-100/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-950">AI Transaction Intelligence</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          evaluation.aiClassification.source === 'gemini'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {evaluation.aiClassification.source === 'gemini' ? 'Gemini 3.7 Flash' : 'Deterministic Heuristic'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-700">
                        {(evaluation.aiClassification.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-medium text-[11px] uppercase tracking-wide">
                      Category: {evaluation.aiClassification.category.replace('_', ' ')}
                    </span>
                    {evaluation.aiClassification.suggestedSubcategory && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 font-medium text-[11px]">
                        Subcategory: {evaluation.aiClassification.suggestedSubcategory}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {evaluation.aiClassification.reasoning}
                  </p>
                </div>
              )}

              {/* Financial Impact Visual Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Discretionary Before</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{evaluation.financialImpact.currentDiscretionary.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                  <span className="text-[11px] text-indigo-700 block">Buffer Consumed</span>
                  <span className="text-sm font-bold text-indigo-900">
                    {evaluation.financialImpact.discretionaryConsumedPercent}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Remaining After</span>
                  <span
                    className={`text-sm font-bold ${
                      evaluation.financialImpact.remainingDiscretionaryAfter < 0
                        ? 'text-rose-600'
                        : 'text-slate-900'
                    }`}
                  >
                    ₹{evaluation.financialImpact.remainingDiscretionaryAfter.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">{category} Limit</span>
                  <span className="text-sm font-bold text-slate-900">
                    ₹{evaluation.financialImpact.categoryBudget.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Impact Reasons */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Evaluation Factors</span>
                </h4>
                <ul className="space-y-1.5">
                  {evaluation.reasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start space-x-2 leading-relaxed">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Budgeting Guidance & Action Plan</span>
                </h4>
                <ul className="space-y-1.5">
                  {evaluation.recommendations.map((rec, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start space-x-2">
                      <span className="text-amber-500 font-bold">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    id="btn-spending-proceed"
                    onClick={handleProceedAndRecord}
                    disabled={isRecording}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-2 ${
                      evaluation.riskLevel === 'HIGH_RISK'
                        ? 'bg-rose-600 hover:bg-rose-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4" />
                        <span>Proceed & Record Expense</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-spending-edit-amount"
                    onClick={() => {
                      const newAmt = prompt('Enter revised amount (₹):', String(amount));
                      if (newAmt && Number(newAmt) > 0) {
                        setAmount(Number(newAmt));
                        setTimeout(() => handleEvaluate(), 50);
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Edit Amount
                  </button>
                </div>

                <button
                  id="btn-spending-cancel"
                  onClick={() => setEvaluation(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Clear Analysis
                </button>
              </div>

              {/* Success Toast */}
              {successToast && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center space-x-2 text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successToast}</span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('expenses')}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    <span>View in Expenses</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Legal Disclaimer */}
              <p className="text-[10px] text-slate-400 italic text-center pt-2">
                {evaluation.disclaimer}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
