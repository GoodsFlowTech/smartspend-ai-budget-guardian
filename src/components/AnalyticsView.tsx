import React from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ShieldAlert,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AnalyticsData, MonthlyBudget } from '../types';

interface AnalyticsViewProps {
  analytics: AnalyticsData | null;
  budget: MonthlyBudget | null;
}

const COLORS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#64748b',
  '#84cc16',
];

const NECESSITY_COLORS: Record<string, string> = {
  Essential: '#3b82f6',
  Important: '#f59e0b',
  'Non-essential': '#ec4899',
  Emergency: '#ef4444',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ analytics, budget }) => {
  if (!analytics) {
    return <div className="p-8 text-center text-slate-500">Loading analytics dataset...</div>;
  }

  const comparisonData = [
    {
      name: 'Monthly Ledger',
      Income: analytics.totalIncome,
      ActualExpenses: analytics.totalExpenses,
      NetSavings: Math.max(0, analytics.totalIncome - analytics.totalExpenses),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Expenditure Intelligence & Visuals</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900">Financial Analytics & Insights</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Deep-dive analysis into category distributions, necessity ratios, and savings rate trends.
        </p>
      </div>

      {/* Core Ratio Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Monthly Savings
          </span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">
            ₹{analytics.netSavings.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Surplus retained this month</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
            Savings Rate %
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {analytics.savingsRatePercent}%
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Target benchmark: &gt;20%</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Inflow
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            ₹{analytics.totalIncome.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Salary & other sources</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Outflow
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            ₹{analytics.totalExpenses.toLocaleString('en-IN')}
          </span>
          <span className="text-xs text-slate-500 block mt-0.5">Actual expenditure</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Income vs. Expenses vs. Savings */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Income vs. Expense Outflow</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="ActualExpenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="NetSavings" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Necessity Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Necessity Tier Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.necessityChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analytics.necessityChartData.map((entry) => (
                    <Cell key={entry.name} fill={NECESSITY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Spending Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Category Outflow Breakdown</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {analytics.categoryChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spent']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Planned Budget Allocation Waterfall */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Planned Salary Allocation Waterfall</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.allocationData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Allocated']}
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
