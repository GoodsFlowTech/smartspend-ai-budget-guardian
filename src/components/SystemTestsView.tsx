import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Play,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Cpu,
  Database,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileText,
  Activity,
} from 'lucide-react';
import { TestSuiteReport } from '../types';
import { api } from '../services/api';

export const SystemTestsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'unit_tests' | 'ai_benchmark' | 'db_status'>('ai_benchmark');
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const [evalReport, setEvalReport] = useState<any | null>(null);
  const [isRunningEval, setIsRunningEval] = useState(false);

  const [dbStatus, setDbStatus] = useState<any | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  const runTests = async () => {
    setIsRunningTests(true);
    try {
      const data = await api.runSystemTests();
      setReport(data);
    } catch (err: any) {
      console.error('Failed to run unit tests:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const loadEvalReport = async () => {
    try {
      const data = await api.getEvaluationReport();
      setEvalReport(data);
    } catch (err: any) {
      console.error('Failed to load evaluation report:', err);
    }
  };

  const triggerLiveBenchmark = async () => {
    setIsRunningEval(true);
    try {
      const data = await api.runEvaluationBenchmark(true);
      setEvalReport(data);
    } catch (err: any) {
      alert(err.message || 'Benchmark run failed');
    } finally {
      setIsRunningEval(false);
    }
  };

  const loadDbStatus = async () => {
    setIsLoadingDb(true);
    try {
      const data = await api.getDbStatus();
      setDbStatus(data);
    } catch (err: any) {
      console.error('Failed to load DB status:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    runTests();
    loadEvalReport();
    loadDbStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Integrity, AI Evaluation & Database Architecture</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">System Verification & AI Benchmark</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Live accuracy benchmarks across 60 Indian merchant transactions, deterministic unit assertion engines, and embedded SQLite database status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'ai_benchmark' && (
            <button
              id="btn-run-ai-benchmark"
              onClick={triggerLiveBenchmark}
              disabled={isRunningEval}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${isRunningEval ? 'animate-spin' : ''}`} />
              <span>{isRunningEval ? 'Evaluating 60 Samples...' : 'Run Live AI Benchmark'}</span>
            </button>
          )}
          {activeTab === 'unit_tests' && (
            <button
              id="btn-run-system-tests"
              onClick={runTests}
              disabled={isRunningTests}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningTests ? 'animate-spin' : ''}`} />
              <span>{isRunningTests ? 'Executing...' : 'Re-run Assertions'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('ai_benchmark')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'ai_benchmark'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>AI Classification Benchmark (60 Indian Txns)</span>
        </button>

        <button
          onClick={() => setActiveTab('unit_tests')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'unit_tests'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Rule Engine Unit Tests ({report?.totalTests || 10})</span>
        </button>

        <button
          onClick={() => setActiveTab('db_status')}
          className={`pb-3 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'db_status'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Architecture (SQLite)</span>
        </button>
      </div>

      {/* TAB 1: AI BENCHMARK */}
      {activeTab === 'ai_benchmark' && evalReport && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Overall Accuracy
              </span>
              <span className="text-3xl font-black text-indigo-600 mt-1 block">
                {evalReport.overallAccuracy}%
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {evalReport.totalCorrect} / {evalReport.totalEvaluated} correct predictions
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                Heuristic Baseline
              </span>
              <span className="text-3xl font-black text-emerald-600 mt-1 block">
                {evalReport.heuristicOnlyAccuracy}%
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Zero-latency regex engine
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">
                Uncertainty Quarantine
              </span>
              <span className="text-3xl font-black text-amber-600 mt-1 block">
                {evalReport.totalUncertain}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Ambiguous P2P isolated
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Model Engine
              </span>
              <span className="text-base font-bold text-slate-900 mt-1.5 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{evalReport.geminiAvailable ? 'Gemini 3.7 Flash' : 'Deterministic Heuristics'}</span>
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Time: {evalReport.elapsedSeconds}s
              </span>
            </div>
          </div>

          {/* Category Performance Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Category Precision & Recall Matrix</h3>
                <p className="text-xs text-slate-400">Indian merchant categorization benchmark</p>
              </div>
              <span className="text-xs font-bold text-slate-500">Run ID: {evalReport.id}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4 pl-6 font-bold">Category</th>
                    <th className="p-4 font-bold text-center">Dataset Samples</th>
                    <th className="p-4 font-bold text-center">Correct</th>
                    <th className="p-4 font-bold text-center">Accuracy</th>
                    <th className="p-4 font-bold text-center">Precision</th>
                    <th className="p-4 font-bold text-center">Recall</th>
                    <th className="p-4 font-bold text-center pr-6">F1-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.entries(evalReport.categoryMetrics || {}).map(([cat, m]: [string, any]) => (
                    <tr key={cat} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 pl-6 font-bold text-slate-900 capitalize">
                        {cat.replace('_', ' ')}
                      </td>
                      <td className="p-4 text-center text-slate-600">{m.total}</td>
                      <td className="p-4 text-center text-emerald-600 font-bold">{m.correct}</td>
                      <td className="p-4 text-center font-bold text-indigo-600">{m.accuracy}%</td>
                      <td className="p-4 text-center text-slate-700">{m.precision}%</td>
                      <td className="p-4 text-center text-slate-700">{m.recall}%</td>
                      <td className="p-4 text-center pr-6 font-bold text-slate-900">{m.f1Score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Architectural Insights */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              <span>Key Architectural Insights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              {(evalReport.summaryInsights || []).map((insight: string, idx: number) => (
                <div key={idx} className="flex items-start space-x-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UNIT ASSERTIONS */}
      {activeTab === 'unit_tests' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Execution Results & Integrity Audit</h3>
              <p className="text-xs text-slate-400">Timestamp: {report?.timestamp || 'Pending...'}</p>
            </div>
            {report && report.failedCount === 0 && (
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Algorithmic Pass</span>
              </div>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {!report ? (
              <div className="p-12 text-center text-slate-400 text-xs">Running test assertions...</div>
            ) : (
              report.results.map((test) => (
                <div key={test.id} className="p-5 hover:bg-slate-50 transition-colors space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-slate-400">{test.id}</span>
                          <span className="text-xs font-bold text-slate-900">{test.name}</span>
                        </div>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 inline-block mt-1">
                          {test.category}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-slate-400 block">{test.durationMs}ms</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          test.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {test.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Expected:</span>
                      <span className="text-slate-800">{test.expected}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Actual Evaluated:</span>
                      <span className="text-emerald-700 font-bold">{test.actual}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE STATUS */}
      {activeTab === 'db_status' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Database Engine & Schema Integrity</h3>
            <p className="text-xs text-slate-500 mt-1">
              Active persistence layer verified on embedded SQLite engine, created from relational DDL schema.
            </p>
          </div>

          {dbStatus && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Engine</span>
                <span className="text-lg font-black text-slate-900 mt-1 uppercase block">{dbStatus.driver}</span>
                <span className="text-xs text-emerald-600 font-semibold mt-0.5 block">Zero-config persistence</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relational Tables</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{dbStatus.tables?.length || 9} Tables</span>
                <span className="text-xs text-slate-500 mt-0.5 block">Ported from schema.sql</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Users</span>
                <span className="text-lg font-black text-slate-900 mt-1 block">{dbStatus.userCount || 1} User Profile</span>
                <span className="text-xs text-slate-500 mt-0.5 block">Demo & custom accounts</span>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Provisioned Schema Tables</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(dbStatus?.tables || [
                'users',
                'financial_profiles',
                'expenses',
                'family_members',
                'financial_goals',
                'emergency_funds',
                'insurance_policies',
                'monthly_budgets',
                'notifications',
                'evaluation_runs',
              ]).map((tbl: string) => (
                <div key={tbl} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-mono text-slate-700">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{tbl}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
