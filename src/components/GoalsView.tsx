import React, { useState } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  GraduationCap,
  Home,
  Car,
  Plane,
  CheckCircle2,
  CreditCard,
} from 'lucide-react';
import { FinancialGoal } from '../types';
import { api } from '../services/api';
import { RazorpayModal } from './RazorpayModal';

interface GoalsViewProps {
  goals: FinancialGoal[];
  onGoalMutated: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, onGoalMutated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);

  // Razorpay payment state
  const [selectedGoalForPayment, setSelectedGoalForPayment] = useState<FinancialGoal | null>(null);

  // Form states
  const [goalName, setGoalName] = useState('');
  const [category, setCategory] = useState<FinancialGoal['category']>('Child Education');
  const [targetAmount, setTargetAmount] = useState<number | ''>(1500000);
  const [currentAmount, setCurrentAmount] = useState<number | ''>(420000);
  const [targetDate, setTargetDate] = useState('2032-06-30');
  const [monthlyContribution, setMonthlyContribution] = useState<number | ''>(8000);
  const [priority, setPriority] = useState<FinancialGoal['priority']>('High');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingGoal(null);
    setGoalName('');
    setCategory('Child Education');
    setTargetAmount(1500000);
    setCurrentAmount(420000);
    setTargetDate('2032-06-30');
    setMonthlyContribution(8000);
    setPriority('High');
    setNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (g: FinancialGoal) => {
    setEditingGoal(g);
    setGoalName(g.goalName);
    setCategory(g.category);
    setTargetAmount(g.targetAmount);
    setCurrentAmount(g.currentAmount);
    setTargetDate(g.targetDate);
    setMonthlyContribution(g.monthlyContribution);
    setPriority(g.priority);
    setNotes(g.notes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !targetAmount) {
      setErrorMsg('Goal name and target amount are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        goalName: goalName.trim(),
        category,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        targetDate,
        monthlyContribution: Number(monthlyContribution) || 0,
        priority,
        notes: notes.trim(),
      };

      if (editingGoal) {
        await api.updateGoal(editingGoal.id, payload);
      } else {
        await api.addGoal(payload);
      }

      setIsModalOpen(false);
      onGoalMutated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this financial goal?')) return;
    try {
      await api.deleteGoal(id);
      onGoalMutated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalAccumulated = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalMonthlySIP = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Child Education':
      case 'Higher Education':
        return GraduationCap;
      case 'Home Purchase':
        return Home;
      case 'Vehicle':
        return Car;
      case 'Vacation':
        return Plane;
      default:
        return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>Aspirational Milestones</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Child Education & Future Goals</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track corpus growth and required monthly SIP run-rate for higher education, home purchases, and long-term milestones.
          </p>
        </div>

        <button
          id="btn-open-add-goal-modal"
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Accumulated Corpus
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalAccumulated.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">
            of ₹{totalTarget.toLocaleString('en-IN')} Total Target
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Total Monthly SIP
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalMonthlySIP.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Allocated every month</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Overall Progress
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0}%
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">{goals.length} Active Milestones</span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const Icon = getCategoryIcon(goal.category);
          const progress = goal.progressPercent || Math.round((goal.currentAmount / goal.targetAmount) * 100);

          return (
            <div
              key={goal.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{goal.goalName}</h3>
                      <span className="text-xs text-slate-400 font-medium">{goal.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(goal)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Accumulated / Target:</span>
                    <span className="font-bold text-slate-900">
                      ₹{goal.currentAmount.toLocaleString('en-IN')} / ₹{goal.targetAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{progress}% funded</span>
                    <span>Target Date: {goal.targetDate}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Monthly SIP:</span>
                  <span className="font-bold text-slate-900">₹{goal.monthlyContribution.toLocaleString('en-IN')}</span>
                </div>

                {goal.requiredMonthlyContribution && goal.requiredMonthlyContribution > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Required Run-Rate:</span>
                    <span
                      className={`font-bold ${
                        goal.isShortfall ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      ₹{goal.requiredMonthlyContribution.toLocaleString('en-IN')}/mo
                    </span>
                  </div>
                )}

                {goal.isShortfall && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Current SIP is below required pace. Increase monthly deposit to hit deadline.</span>
                  </p>
                )}

                <button
                  onClick={() => setSelectedGoalForPayment(goal)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Contribute via Razorpay</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Razorpay Contribution Modal */}
      {selectedGoalForPayment && (
        <RazorpayModal
          isOpen={!!selectedGoalForPayment}
          onClose={() => setSelectedGoalForPayment(null)}
          title={`Fund ${selectedGoalForPayment.goalName}`}
          purpose={`Monthly SIP for ${selectedGoalForPayment.goalName} (${selectedGoalForPayment.category})`}
          defaultAmount={selectedGoalForPayment.monthlyContribution || 5000}
          goalId={selectedGoalForPayment.id}
          onSuccess={() => {
            onGoalMutated();
          }}
        />
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingGoal ? 'Edit Financial Goal' : 'Create Financial Goal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Name *</label>
                <input
                  type="text"
                  required
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g. Aarav's Higher Education Fund"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="Child Education">Child Education</option>
                    <option value="Home Purchase">Home Purchase</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Higher Education">Higher Education</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Retirement">Retirement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Amount (₹) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly SIP (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Target Purpose</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Engineering college tuition in 2032"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                />
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
                  {isSubmitting ? 'Saving...' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
