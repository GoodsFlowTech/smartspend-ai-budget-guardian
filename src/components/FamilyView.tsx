import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  Users,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { FamilyMember } from '../types';
import { api } from '../services/api';

interface FamilyViewProps {
  familyMembers: FamilyMember[];
  onFamilyMutated: () => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({ familyMembers, onFamilyMutated }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('Child');
  const [age, setAge] = useState<number | ''>(10);
  const [financialDependency, setFinancialDependency] = useState<FamilyMember['financialDependency']>('Full');
  const [monthlyAllocation, setMonthlyAllocation] = useState<number | ''>(5000);
  const [importantNotes, setImportantNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setRelationship('Child');
    setAge(10);
    setFinancialDependency('Full');
    setMonthlyAllocation(5000);
    setImportantNotes('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (m: FamilyMember) => {
    setEditingMember(m);
    setName(m.name);
    setRelationship(m.relationship);
    setAge(m.age);
    setFinancialDependency(m.financialDependency);
    setMonthlyAllocation(m.monthlyAllocation);
    setImportantNotes(m.importantNotes || '');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Name is required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        name: name.trim(),
        relationship,
        age: Number(age) || 0,
        financialDependency,
        monthlyAllocation: Number(monthlyAllocation) || 0,
        importantNotes: importantNotes.trim(),
      };

      if (editingMember) {
        await api.updateFamilyMember(editingMember.id, payload);
      } else {
        await api.addFamilyMember(payload);
      }

      setIsModalOpen(false);
      onFamilyMutated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;
    try {
      await api.deleteFamilyMember(id);
      onFamilyMutated();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const totalFamilyAllocation = familyMembers.reduce((sum, m) => sum + m.monthlyAllocation, 0);
  const totalFamilySpent = familyMembers.reduce((sum, m) => sum + (m.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Household Responsibilities</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Family & Dependents Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Allocate and track dedicated monthly financial allowances for children, elderly parents, and dependents.
          </p>
        </div>

        <button
          id="btn-open-add-family-modal"
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Registered Dependents
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {familyMembers.length} Members
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Total Monthly Allocation
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalFamilyAllocation.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Actual Spent This Month
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{totalFamilySpent.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{member.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-indigo-600">{member.relationship}</span>
                    <span>•</span>
                    <span>{member.age} yrs</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {member.financialDependency} Dependency
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {member.importantNotes && (
                <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {member.importantNotes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Monthly Budget:</span>
                <span className="font-bold text-slate-900">
                  ₹{member.monthlyAllocation.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Spent This Month:</span>
                <span className="font-bold text-indigo-600">
                  ₹{(member.totalSpent || 0).toLocaleString('en-IN')} ({member.expensesCount || 0} expenses)
                </span>
              </div>

              {/* Progress */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, member.utilizationPercent || 0)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="Child">Child</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent / Elderly</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Self">Self</option>
                    <option value="Other">Other Dependent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dependency</label>
                  <select
                    value={financialDependency}
                    onChange={(e) => setFinancialDependency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white outline-none"
                  >
                    <option value="Full">Full (100% reliant)</option>
                    <option value="Partial">Partial</option>
                    <option value="Independent">Independent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Allowance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={monthlyAllocation}
                    onChange={(e) => setMonthlyAllocation(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Important Notes / Goals</label>
                <input
                  type="text"
                  value={importantNotes}
                  onChange={(e) => setImportantNotes(e.target.value)}
                  placeholder="e.g. School tuition, medical prescriptions, hobby classes"
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
                  {isSubmitting ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
