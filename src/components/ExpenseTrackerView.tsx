import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
  CreditCard,
  CheckCircle2,
  X,
  TrendingDown,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import { Expense, ExpenseCategory, NecessityLevel, PaymentMethod, FamilyMember } from '../types';
import { api } from '../services/api';

interface ExpenseTrackerViewProps {
  expenses: Expense[];
  familyMembers: FamilyMember[];
  onExpenseMutated: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Housing',
  'Transportation',
  'Medical',
  'Education',
  'Shopping',
  'Entertainment',
  'Bills',
  'Insurance',
  'Family',
  'Children',
  'EMI/Loan',
  'Travel',
  'Other',
];

export const ExpenseTrackerView: React.FC<ExpenseTrackerViewProps> = ({
  expenses,
  familyMembers,
  onExpenseMutated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedNecessity, setSelectedNecessity] = useState<string>('All');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form State
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [necessityLevel, setNecessityLevel] = useState<NecessityLevel>('Essential');
  const [familyMemberId, setFamilyMemberId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingExpense(null);
    setAmount('');
    setCategory('Food');
    setSubcategory('');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setPaymentMethod('UPI');
    setNecessityLevel('Essential');
    setFamilyMemberId('');
    setIsRecurring(false);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setAmount(exp.amount);
    setCategory(exp.category);
    setSubcategory(exp.subcategory || '');
    setDate(exp.date);
    setDescription(exp.description);
    setPaymentMethod(exp.paymentMethod);
    setNecessityLevel(exp.necessityLevel);
    setFamilyMemberId(exp.familyMemberId || '');
    setIsRecurring(exp.isRecurring || false);
    setNotes(exp.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setFormError('Please provide a valid amount');
      return;
    }
    if (!description.trim()) {
      setFormError('Please enter a description');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        amount: Number(amount),
        category,
        subcategory,
        date,
        description: description.trim(),
        paymentMethod,
        necessityLevel,
        familyMemberId: familyMemberId || undefined,
        isRecurring,
        notes,
      };

      if (editingExpense) {
        await api.updateExpense(editingExpense.id, payload);
      } else {
        await api.addExpense(payload);
      }

      setIsModalOpen(false);
      onExpenseMutated();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await api.deleteExpense(id);
      onExpenseMutated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Filter and Sort in Memory
  const filtered = expenses
    .filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (selectedNecessity !== 'All' && e.necessityLevel !== selectedNecessity) return false;
      if (selectedFamilyMember !== 'All' && e.familyMemberId !== selectedFamilyMember) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchCat = e.category.toLowerCase().includes(q);
        const matchSub = e.subcategory ? e.subcategory.toLowerCase().includes(q) : false;
        if (!matchDesc && !matchCat && !matchSub) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  const totalFilteredAmount = filtered.reduce((sum, e) => sum + e.amount, 0);
  const essentialTotal = filtered.filter((e) => e.necessityLevel === 'Essential').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <Receipt className="w-3.5 h-3.5" />
            <span>Actual Cash Outflow Ledger</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Household Expense Tracker</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor granular item expenditures, categorize by necessity level, and tag dependents.
          </p>
        </div>

        <button
          id="btn-open-add-expense-modal"
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Expense</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Filtered Total
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{totalFilteredAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{filtered.length} entries</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
            Essential Needs
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{essentialTotal.toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {totalFilteredAmount > 0 ? Math.round((essentialTotal / totalFilteredAmount) * 100) : 0}% of filtered
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
            Discretionary / Wants
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{(totalFilteredAmount - essentialTotal).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Shopping, Dining & Leisure</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
            Avg. Transaction
          </span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            ₹{filtered.length > 0 ? Math.round(totalFilteredAmount / filtered.length).toLocaleString('en-IN') : 0}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Per record ticket</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="input-filter-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expenses..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="select-filter-category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Necessity Filter */}
          <div>
            <select
              id="select-filter-necessity"
              value={selectedNecessity}
              onChange={(e) => setSelectedNecessity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
            >
              <option value="All">All Necessity Levels</option>
              <option value="Essential">Essential</option>
              <option value="Important">Important</option>
              <option value="Non-essential">Non-essential</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          {/* Family Member Filter */}
          <div>
            <select
              id="select-filter-family"
              value={selectedFamilyMember}
              onChange={(e) => setSelectedFamilyMember(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
            >
              <option value="All">All Family Members</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relationship})
                </option>
              ))}
            </select>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expense Records Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Date & Item</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Necessity</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Family Member</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No expense records found matching your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => {
                  const member = familyMembers.find((m) => m.id === exp.familyMemberId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{exp.description}</div>
                        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{exp.date}</span>
                          {exp.isRecurring && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                              Recurring
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <span>{exp.category}</span>
                        {exp.subcategory && (
                          <span className="text-[11px] text-slate-400 block">{exp.subcategory}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            exp.necessityLevel === 'Essential'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : exp.necessityLevel === 'Emergency'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : exp.necessityLevel === 'Important'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {exp.necessityLevel}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>{exp.paymentMethod}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {member ? (
                          <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md text-[11px]">
                            {member.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">General Household</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        ₹{exp.amount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                  <input
                    id="modal-expense-amount"
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    id="modal-expense-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Merchant *</label>
                <input
                  id="modal-expense-desc"
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Groceries at Nature's Basket"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    id="modal-expense-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Necessity Level</label>
                  <select
                    id="modal-expense-necessity"
                    value={necessityLevel}
                    onChange={(e) => setNecessityLevel(e.target.value as NecessityLevel)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="Essential">Essential (Living Need)</option>
                    <option value="Important">Important (Semi-necessary)</option>
                    <option value="Non-essential">Non-essential (Wants)</option>
                    <option value="Emergency">Emergency (Unplanned Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="UPI">UPI / QR</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Family Member Tag</label>
                  <select
                    value={familyMemberId}
                    onChange={(e) => setFamilyMemberId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="">General Household</option>
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.relationship})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="chk-recurring" className="text-xs text-slate-700 font-medium">
                  This is a regular monthly recurring payment
                </label>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{formError}</span>
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
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
