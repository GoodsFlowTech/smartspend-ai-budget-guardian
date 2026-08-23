import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { dbRepository } from './server/repository';
import { dbDriver } from './server/db/database';
import { BudgetService } from './server/services/budgetService';
import { SpendingDecisionEngine, SpendingDecisionInput } from './server/services/spendingDecisionEngine';
import { ClassifierService } from './server/services/classifierService';
import { RazorpayService } from './server/services/razorpayService';
import { HealthScoreService } from './server/services/healthScoreService';
import { TestSuiteService } from './server/services/testSuiteService';
import { EvaluationService } from './server/services/evaluationService';
import {
  UserEntity,
  ExpenseCategory,
  NecessityLevel,
  PaymentMethod,
  ExpenseEntity,
  FamilyMemberEntity,
  FinancialGoalEntity,
  InsurancePolicyEntity,
  NotificationEntity,
} from './server/types';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'smartspend_jwt_secure_key_2026_super_secret';
const PORT = 3000;

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Authentication Middleware
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
      if (!err && decoded) {
        req.user = decoded;
      }
    });
  }

  // If no token or invalid token, default seamlessly to demo user for preview accessibility
  if (!req.user) {
    const demoUser = dbRepository.findUserByEmail('demo@smartspend.app');
    if (demoUser) {
      req.user = { id: demoUser.id, email: demoUser.email, name: demoUser.name };
    }
  }

  next();
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // Register
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      const existing = dbRepository.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const now = new Date().toISOString();

      const newUser: UserEntity = {
        id: userId,
        name,
        email,
        passwordHash,
        role: 'user',
        createdAt: now,
        updatedAt: now,
      };

      dbRepository.createUser(newUser);

      // Create initial profile for new user
      dbRepository.upsertProfile({
        id: `prof_${userId}`,
        userId,
        monthlySalary: 50000,
        otherIncome: 0,
        rentExpenses: 15000,
        foodExpenses: 6000,
        transportExpenses: 3000,
        utilitiesExpenses: 2000,
        medicalExpenses: 1500,
        emiExpenses: 0,
        insuranceExpenses: 2000,
        numberOfFamilyMembers: 1,
        numberOfChildren: 0,
        numberOfDependents: 0,
        existingSavings: 20000,
        existingEmergencyFund: 30000,
        monthlySavingsTarget: 8000,
        desiredEmergencyMonths: 6,
        currency: '₹',
        updatedAt: now,
      });

      const token = jwt.sign({ id: newUser.id, email: newUser.email, name: newUser.name }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Failed to complete registration' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = dbRepository.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isValid = bcrypt.compareSync(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, {
        expiresIn: '7d',
      });

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during login' });
    }
  });

  // Get current authenticated user
  app.get('/api/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = dbRepository.findUserById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  // ==========================================
  // FINANCIAL PROFILE ROUTES
  // ==========================================

  app.get('/api/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const profile = dbRepository.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  });

  app.post('/api/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const existing = dbRepository.getProfileByUserId(userId);
    const updated = {
      ...existing,
      ...req.body,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const saved = dbRepository.upsertProfile(updated);

    // Refresh default monthly budget
    const newBudget = BudgetService.calculateMonthlyAllocation(saved);
    dbRepository.upsertBudget(newBudget);

    res.json(saved);
  });

  // ==========================================
  // MONTHLY INCOME ALLOCATION & BUDGET ROUTES
  // ==========================================

  app.get('/api/budget', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const currentMonth = new Date().toISOString().slice(0, 7);
    const profile = dbRepository.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Financial profile not found' });

    let budget = dbRepository.getBudget(userId, currentMonth);
    if (!budget) {
      budget = BudgetService.calculateMonthlyAllocation(profile);
      dbRepository.upsertBudget(budget);
    }

    const expenses = dbRepository.getExpensesByUserId(userId).filter((e) => e.date.startsWith(currentMonth));
    const reconciliation = BudgetService.reconcileSpending(budget, expenses);

    res.json({
      budget,
      reconciliation,
      profile,
    });
  });

  app.put('/api/budget', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const currentMonth = new Date().toISOString().slice(0, 7);
    const existing = dbRepository.getBudget(userId, currentMonth);
    if (!existing) return res.status(404).json({ error: 'Budget not found' });

    const updated = {
      ...existing,
      ...req.body,
      userId,
      monthYear: currentMonth,
      updatedAt: new Date().toISOString(),
    };
    const saved = dbRepository.upsertBudget(updated);
    res.json(saved);
  });

  // ==========================================
  // SMART SPENDING DECISION ENGINE & AI CLASSIFIER
  // ==========================================

  app.post('/api/spending/classify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { merchantName, amount } = req.body;
      if (!merchantName) {
        return res.status(400).json({ error: 'Merchant descriptor is required' });
      }

      const userId = req.user?.id || 'usr_demo_smartspend';
      const profile = dbRepository.getProfileByUserId(userId);

      const result = await ClassifierService.classifyTransactionGemini(
        merchantName,
        Number(amount) || 0,
        profile
          ? {
              cityTier: 'metro',
              numberOfChildren: profile.numberOfChildren,
              numberOfDependents: profile.numberOfDependents,
              monthlyIncome: profile.monthlySalary + (profile.otherIncome || 0),
            }
          : undefined
      );

      res.json(result);
    } catch (err: any) {
      console.error('Error classifying transaction:', err);
      res.status(500).json({ error: 'Failed to classify transaction' });
    }
  });

  app.post('/api/spending/evaluate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'usr_demo_smartspend';
      const { amount, category, description, necessityLevel, familyMemberId, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'A valid positive purchase amount is required' });
      }

      if (!category) {
        return res.status(400).json({ error: 'Category is required for evaluation' });
      }

      const profile = dbRepository.getProfileByUserId(userId);
      if (!profile) return res.status(404).json({ error: 'Financial profile missing' });

      const currentMonth = new Date().toISOString().slice(0, 7);
      let budget = dbRepository.getBudget(userId, currentMonth);
      if (!budget) {
        budget = BudgetService.calculateMonthlyAllocation(profile);
        dbRepository.upsertBudget(budget);
      }

      const emergencyFund = dbRepository.getEmergencyFund(userId);
      const currentMonthExpenses = dbRepository
        .getExpensesByUserId(userId)
        .filter((e) => e.date.startsWith(currentMonth));

      const input: SpendingDecisionInput = {
        amount: Number(amount),
        category: category as ExpenseCategory,
        description: description || 'Prospective Purchase',
        necessityLevel: (necessityLevel as NecessityLevel) || 'Non-essential',
        familyMemberId,
        notes,
      };

      const evaluation = await SpendingDecisionEngine.evaluatePurchase(
        input,
        profile,
        budget,
        emergencyFund,
        currentMonthExpenses
      );

      res.json(evaluation);
    } catch (err: any) {
      console.error('Error evaluating spending decision:', err);
      res.status(500).json({ error: 'Failed to evaluate spending decision' });
    }
  });

  // ==========================================
  // EXPENSES ROUTES
  // ==========================================

  app.get('/api/expenses', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    let expenses = dbRepository.getExpensesByUserId(userId);

    const { category, necessity, search, familyMemberId, startDate, endDate, sortBy, sortOrder } = req.query;

    if (category && typeof category === 'string' && category !== 'All') {
      expenses = expenses.filter((e) => e.category === category);
    }

    if (necessity && typeof necessity === 'string' && necessity !== 'All') {
      expenses = expenses.filter((e) => e.necessityLevel === necessity);
    }

    if (familyMemberId && typeof familyMemberId === 'string' && familyMemberId !== 'All') {
      expenses = expenses.filter((e) => e.familyMemberId === familyMemberId);
    }

    if (startDate && typeof startDate === 'string') {
      expenses = expenses.filter((e) => e.date >= startDate);
    }

    if (endDate && typeof endDate === 'string') {
      expenses = expenses.filter((e) => e.date <= endDate);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      expenses = expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          (e.subcategory && e.subcategory.toLowerCase().includes(q))
      );
    }

    // Sorting
    expenses.sort((a, b) => {
      if (sortBy === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      }
      return sortOrder === 'asc'
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      totalCount: expenses.length,
      totalAmount,
      expenses,
    });
  });

  app.post('/api/expenses', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'usr_demo_smartspend';
      const {
        amount,
        category,
        subcategory,
        date,
        description,
        paymentMethod,
        necessityLevel,
        familyMemberId,
        isRecurring,
        notes,
      } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid positive amount is required' });
      }
      if (!category) return res.status(400).json({ error: 'Category is required' });
      if (!description) return res.status(400).json({ error: 'Description is required' });

      const now = new Date().toISOString();
      const newExpense: ExpenseEntity = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        amount: Number(amount),
        category: category as ExpenseCategory,
        subcategory: subcategory || '',
        date: date || now.slice(0, 10),
        description,
        paymentMethod: (paymentMethod as PaymentMethod) || 'UPI',
        necessityLevel: (necessityLevel as NecessityLevel) || 'Important',
        familyMemberId,
        isRecurring: Boolean(isRecurring),
        notes,
        createdAt: now,
        updatedAt: now,
      };

      const saved = dbRepository.createExpense(newExpense);

      // Trigger automatic overspending notifications if budget breached
      const currentMonth = newExpense.date.slice(0, 7);
      const budget = dbRepository.getBudget(userId, currentMonth);
      if (budget) {
        const monthExpenses = dbRepository.getExpensesByUserId(userId).filter((e) => e.date.startsWith(currentMonth));
        const catSpent = monthExpenses
          .filter((e) => e.category === newExpense.category)
          .reduce((sum, e) => sum + e.amount, 0);
        const catLimit = budget.categoryBudgets[newExpense.category] || 3000;

        if (catSpent > catLimit) {
          dbRepository.createNotification({
            id: `notif_${Date.now()}`,
            userId,
            title: `🔴 ${newExpense.category} Budget Exceeded`,
            message: `Spending on ${newExpense.category} has reached ₹${catSpent.toLocaleString('en-IN')} (limit: ₹${catLimit.toLocaleString('en-IN')}). Consider curbing discretionary expenses.`,
            type: 'alert',
            isRead: false,
            link: '/expenses',
            createdAt: now,
          });
        }
      }

      res.status(201).json(saved);
    } catch (err: any) {
      console.error('Error creating expense:', err);
      res.status(500).json({ error: 'Failed to record expense' });
    }
  });

  app.put('/api/expenses/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const updated = dbRepository.updateExpense(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json(updated);
  });

  app.delete('/api/expenses/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const deleted = dbRepository.deleteExpense(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  });

  // ==========================================
  // FAMILY MEMBERS ROUTES
  // ==========================================

  app.get('/api/family', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const members = dbRepository.getFamilyMembers(userId);
    const expenses = dbRepository.getExpensesByUserId(userId);

    const membersWithSpending = members.map((m) => {
      const memberExpenses = expenses.filter((e) => e.familyMemberId === m.id);
      const totalSpent = memberExpenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        ...m,
        totalSpent,
        expensesCount: memberExpenses.length,
        utilizationPercent: m.monthlyAllocation > 0 ? Math.round((totalSpent / m.monthlyAllocation) * 100) : 0,
      };
    });

    const totalFamilyAllocation = members.reduce((sum, m) => sum + m.monthlyAllocation, 0);
    const totalFamilySpent = membersWithSpending.reduce((sum, m) => sum + m.totalSpent, 0);

    res.json({
      members: membersWithSpending,
      summary: {
        totalMembers: members.length,
        totalAllocation: totalFamilyAllocation,
        totalSpent: totalFamilySpent,
      },
    });
  });

  app.post('/api/family', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const { name, relationship, age, financialDependency, monthlyAllocation, importantNotes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newMember: FamilyMemberEntity = {
      id: `fam_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId,
      name,
      relationship: relationship || 'Child',
      age: Number(age) || 0,
      financialDependency: financialDependency || 'Full',
      monthlyAllocation: Number(monthlyAllocation) || 0,
      importantNotes,
      createdAt: new Date().toISOString(),
    };

    const saved = dbRepository.addFamilyMember(newMember);
    res.status(201).json(saved);
  });

  app.put('/api/family/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const updated = dbRepository.updateFamilyMember(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Family member not found' });
    res.json(updated);
  });

  app.delete('/api/family/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const deleted = dbRepository.deleteFamilyMember(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Family member not found' });
    res.json({ success: true });
  });

  // ==========================================
  // FINANCIAL GOALS & CHILD EDUCATION ROUTES
  // ==========================================

  app.get('/api/goals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const goals = dbRepository.getGoals(userId);

    const goalsWithAnalysis = goals.map((g) => {
      const remainingAmount = Math.max(0, g.targetAmount - g.currentAmount);
      const progressPercent = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;

      // Calculate months remaining to target date
      const targetDate = new Date(g.targetDate);
      const today = new Date();
      const diffMonths = Math.max(1, (targetDate.getFullYear() - today.getFullYear()) * 12 + (targetDate.getMonth() - today.getMonth()));
      const requiredMonthly = remainingAmount > 0 ? Math.round(remainingAmount / diffMonths) : 0;
      const isShortfall = g.monthlyContribution < requiredMonthly;

      return {
        ...g,
        remainingAmount,
        progressPercent,
        monthsRemaining: diffMonths,
        requiredMonthlyContribution: requiredMonthly,
        isShortfall,
      };
    });

    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalAccumulated = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalMonthlySIP = goals.reduce((sum, g) => sum + g.monthlyContribution, 0);

    res.json({
      goals: goalsWithAnalysis,
      summary: {
        totalGoals: goals.length,
        totalTarget,
        totalAccumulated,
        totalMonthlySIP,
        overallProgress: totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0,
      },
    });
  });

  app.post('/api/goals', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const { goalName, category, targetAmount, currentAmount, targetDate, monthlyContribution, priority, notes } = req.body;
    if (!goalName || !targetAmount) return res.status(400).json({ error: 'Goal name and target amount are required' });

    const newGoal: FinancialGoalEntity = {
      id: `goal_${Date.now()}`,
      userId,
      goalName,
      category: category || 'Child Education',
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      targetDate: targetDate || '2030-12-31',
      monthlyContribution: Number(monthlyContribution) || 0,
      priority: priority || 'High',
      notes,
      createdAt: new Date().toISOString(),
    };

    const saved = dbRepository.addGoal(newGoal);
    res.status(201).json(saved);
  });

  app.put('/api/goals/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const updated = dbRepository.updateGoal(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Goal not found' });
    res.json(updated);
  });

  app.delete('/api/goals/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const deleted = dbRepository.deleteGoal(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  });

  // ==========================================
  // EMERGENCY FUND ROUTES
  // ==========================================

  app.get('/api/emergency-fund', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const profile = dbRepository.getProfileByUserId(userId);
    let fund = dbRepository.getEmergencyFund(userId);

    const essentialExpenses = profile
      ? profile.rentExpenses + profile.foodExpenses + profile.utilitiesExpenses + profile.medicalExpenses + profile.transportExpenses
      : 30000;
    const desiredMonths = profile?.desiredEmergencyMonths || fund?.desiredMonths || 6;
    const calculatedTarget = essentialExpenses * desiredMonths;

    if (!fund && profile) {
      fund = {
        id: `emf_${userId}`,
        userId,
        monthlyEssentialExpenses: essentialExpenses,
        desiredMonths,
        currentSavings: profile.existingEmergencyFund || 0,
        targetAmount: calculatedTarget,
        monthlyContribution: 5000,
        notes: 'High-Yield Liquidity Reserve',
        updatedAt: new Date().toISOString(),
      };
      dbRepository.upsertEmergencyFund(fund);
    }

    const currentSavings = fund?.currentSavings || 0;
    const targetAmount = fund?.targetAmount || calculatedTarget;
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((currentSavings / targetAmount) * 100)) : 0;
    const shortfall = Math.max(0, targetAmount - currentSavings);
    const monthsToTarget =
      fund && fund.monthlyContribution > 0 ? Math.ceil(shortfall / fund.monthlyContribution) : 0;

    res.json({
      fund,
      analysis: {
        essentialExpenses,
        desiredMonths,
        currentSavings,
        targetAmount,
        progressPercent,
        shortfall,
        monthsToTarget,
        isBelowTarget: progressPercent < 80,
      },
    });
  });

  app.put('/api/emergency-fund', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const existing = dbRepository.getEmergencyFund(userId);
    const updated = {
      ...existing,
      ...req.body,
      userId,
      updatedAt: new Date().toISOString(),
    };
    const saved = dbRepository.upsertEmergencyFund(updated);
    res.json(saved);
  });

  // ==========================================
  // INSURANCE TRACKER ROUTES
  // ==========================================

  app.get('/api/insurance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const policies = dbRepository.getInsurancePolicies(userId);

    const now = new Date();
    const policiesWithAlerts = policies.map((p) => {
      const renewalDate = new Date(p.renewalDate);
      const diffTime = renewalDate.getTime() - now.getTime();
      const daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isUpcoming = daysUntilRenewal <= 45 && daysUntilRenewal >= 0;
      const isOverdue = daysUntilRenewal < 0;

      return {
        ...p,
        daysUntilRenewal,
        isUpcoming,
        isOverdue,
      };
    });

    const totalCoverage = policies.reduce((sum, p) => sum + (p.coverageAmount || 0), 0);
    const totalMonthlyPremium = policies.reduce((sum, p) => sum + (p.premium || 0), 0);

    res.json({
      policies: policiesWithAlerts,
      summary: {
        totalPolicies: policies.length,
        totalCoverage,
        totalMonthlyPremium,
        upcomingRenewalsCount: policiesWithAlerts.filter((p) => p.isUpcoming || p.isOverdue).length,
      },
    });
  });

  app.post('/api/insurance', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const { policyType, provider, insuredPerson, coverageAmount, premium, frequency, policyNumber, startDate, renewalDate, notes } = req.body;
    if (!provider || !policyType) return res.status(400).json({ error: 'Provider and policy type are required' });

    const newPolicy: InsurancePolicyEntity = {
      id: `ins_${Date.now()}`,
      userId,
      policyType: policyType || 'Health',
      provider,
      insuredPerson: insuredPerson || 'Self',
      coverageAmount: Number(coverageAmount) || 0,
      premium: Number(premium) || 0,
      frequency: frequency || 'Monthly',
      policyNumber: policyNumber || '',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      renewalDate: renewalDate || '2027-01-01',
      notes,
      createdAt: new Date().toISOString(),
    };

    const saved = dbRepository.addInsurancePolicy(newPolicy);
    res.status(201).json(saved);
  });

  app.put('/api/insurance/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const updated = dbRepository.updateInsurancePolicy(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Insurance policy not found' });
    res.json(updated);
  });

  app.delete('/api/insurance/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const deleted = dbRepository.deleteInsurancePolicy(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Policy not found' });
    res.json({ success: true });
  });

  // ==========================================
  // REAL RAZORPAY TEST-MODE PAYMENT ROUTES
  // ==========================================

  app.get('/api/payments/razorpay/status', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const isConfigured = RazorpayService.isConfigured();
    res.json({
      configured: isConfigured,
      keyId: isConfigured ? process.env.RAZORPAY_KEY_ID : null,
      message: isConfigured
        ? 'Razorpay test API is configured and ready for live checkout.'
        : 'Razorpay test keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
    });
  });

  app.post('/api/payments/razorpay/create-order', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, purpose, entityId, notes } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid positive payment amount in INR is required' });
      }

      if (!RazorpayService.isConfigured()) {
        return res.status(503).json({
          error: 'Razorpay test credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.',
          configured: false,
        });
      }

      const order = await RazorpayService.createOrder({
        amount: numAmount,
        currency: 'INR',
        receipt: `rcpt_${(purpose || 'smartspend').slice(0, 8)}_${Date.now().toString().slice(-6)}`,
        notes: {
          purpose: purpose || 'Savings or Premium Contribution',
          entityId: entityId || '',
          ...notes,
        },
      });

      res.status(201).json(order);
    } catch (err: any) {
      console.error('Error creating Razorpay order:', err);
      res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
    }
  });

  app.post('/api/payments/razorpay/verify', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id || 'usr_demo_smartspend';
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        purpose,
        amount,
        goalId,
        policyId,
        isEmergencyFund,
      } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Order ID, Payment ID, and Signature are required for verification' });
      }

      if (!RazorpayService.isConfigured()) {
        return res.status(503).json({ error: 'Razorpay credentials not configured for signature verification' });
      }

      const isValid = RazorpayService.verifyPaymentSignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Cryptographic signature mismatch. Payment verification failed.' });
      }

      const paidAmount = Number(amount) || 0;
      const now = new Date().toISOString();
      const today = now.slice(0, 10);

      // Apply payment to corresponding financial pillar
      if (goalId) {
        const goal = dbRepository.getGoals(userId).find((g) => g.id === goalId);
        if (goal) {
          dbRepository.updateGoal(goalId, {
            currentAmount: goal.currentAmount + paidAmount,
          });
        }
      } else if (isEmergencyFund) {
        const fund = dbRepository.getEmergencyFund(userId);
        if (fund) {
          dbRepository.upsertEmergencyFund({
            ...fund,
            currentSavings: fund.currentSavings + paidAmount,
            updatedAt: now,
          });
        }
      }

      // Record verified transaction in expenses ledger as an essential allocation or savings deposit
      const expense = dbRepository.createExpense({
        id: `exp_rzp_${Date.now()}`,
        userId,
        amount: paidAmount,
        category: policyId ? 'Insurance' : goalId ? 'Education' : 'Other',
        subcategory: `Razorpay Verified (${razorpay_payment_id})`,
        date: today,
        description: `Verified Payment for ${purpose || 'Financial Plan Contribution'} [Txn: ${razorpay_payment_id}]`,
        paymentMethod: 'UPI',
        necessityLevel: 'Essential',
        isRecurring: false,
        notes: `Razorpay Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id}`,
        createdAt: now,
        updatedAt: now,
      });

      res.json({
        success: true,
        message: 'Payment verified and credited successfully.',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        expense,
      });
    } catch (err: any) {
      console.error('Error verifying Razorpay payment:', err);
      res.status(500).json({ error: err.message || 'Payment verification failed' });
    }
  });

  // ==========================================
  // FINANCIAL HEALTH SCORE ROUTE
  // ==========================================

  app.get('/api/health-score', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const profile = dbRepository.getProfileByUserId(userId);
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const currentMonth = new Date().toISOString().slice(0, 7);
    let budget = dbRepository.getBudget(userId, currentMonth);
    if (!budget) {
      budget = BudgetService.calculateMonthlyAllocation(profile);
      dbRepository.upsertBudget(budget);
    }

    const expenses = dbRepository.getExpensesByUserId(userId).filter((e) => e.date.startsWith(currentMonth));
    const emergencyFund = dbRepository.getEmergencyFund(userId);
    const insurancePolicies = dbRepository.getInsurancePolicies(userId);
    const goals = dbRepository.getGoals(userId);

    const report = HealthScoreService.calculateHealthScore(
      profile,
      budget,
      expenses,
      emergencyFund,
      insurancePolicies,
      goals
    );

    res.json(report);
  });

  // ==========================================
  // ANALYTICS & CHARTS DATA ROUTE
  // ==========================================

  app.get('/api/analytics', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const profile = dbRepository.getProfileByUserId(userId);
    const expenses = dbRepository.getExpensesByUserId(userId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const budget = dbRepository.getBudget(userId, currentMonth) || (profile ? BudgetService.calculateMonthlyAllocation(profile) : null);

    const totalIncome = (profile?.monthlySalary || 0) + (profile?.otherIncome || 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 1. Category Distribution
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const categoryChartData = Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
      allocated: budget?.categoryBudgets[name] || 0,
    }));

    // 2. Necessity Breakdown
    const necessityTotals: Record<string, number> = {
      Essential: 0,
      Important: 0,
      'Non-essential': 0,
      Emergency: 0,
    };
    expenses.forEach((e) => {
      necessityTotals[e.necessityLevel] = (necessityTotals[e.necessityLevel] || 0) + e.amount;
    });
    const necessityChartData = Object.entries(necessityTotals).map(([name, value]) => ({
      name,
      value,
    }));

    // 3. Income Allocation Waterfall Chart Data
    const allocationData = budget
      ? [
          { name: 'Mandatory', amount: budget.mandatoryExpenses, fill: '#3b82f6' },
          { name: 'Family', amount: budget.familyExpenses, fill: '#6366f1' },
          { name: 'Insurance', amount: budget.insuranceExpenses, fill: '#8b5cf6' },
          { name: 'Emergency', amount: budget.emergencyFundContribution, fill: '#10b981' },
          { name: 'Savings/SIP', amount: budget.savingsContribution, fill: '#059669' },
          { name: 'Discretionary', amount: budget.discretionaryBudget, fill: '#f59e0b' },
        ]
      : [];

    res.json({
      totalIncome,
      totalExpenses,
      netSavings: Math.max(0, totalIncome - totalExpenses),
      savingsRatePercent: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
      categoryChartData,
      necessityChartData,
      allocationData,
    });
  });

  // ==========================================
  // MONTHLY SUMMARY REPORT ROUTE
  // ==========================================

  app.get('/api/reports/monthly', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const profile = dbRepository.getProfileByUserId(userId);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const expenses = dbRepository.getExpensesByUserId(userId).filter((e) => e.date.startsWith(currentMonth));
    const budget = dbRepository.getBudget(userId, currentMonth) || (profile ? BudgetService.calculateMonthlyAllocation(profile) : null);
    const emergencyFund = dbRepository.getEmergencyFund(userId);
    const policies = dbRepository.getInsurancePolicies(userId);
    const goals = dbRepository.getGoals(userId);

    const totalIncome = (profile?.monthlySalary || 0) + (profile?.otherIncome || 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const health = profile && budget ? HealthScoreService.calculateHealthScore(profile, budget, expenses, emergencyFund, policies, goals) : null;

    // Top categories
    const categoryTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const topCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => ({ category: cat, amount: amt, percent: totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0 }));

    res.json({
      monthYear: currentMonth,
      generatedDate: new Date().toISOString(),
      userName: profile ? req.user?.name : 'Household Planner',
      financials: {
        totalIncome,
        totalExpenses,
        netSavings: totalIncome - totalExpenses,
        discretionaryAllocated: budget?.discretionaryBudget || 0,
        emergencyFundContribution: budget?.emergencyFundContribution || 5000,
        goalsContribution: goals.reduce((sum, g) => sum + g.monthlyContribution, 0),
      },
      healthScore: health?.overallScore || 75,
      healthGrade: health?.grade || 'Good',
      topCategories,
      recommendations: health?.actionItems || [
        'Maintain emergency fund deposits to achieve 6 months essential runway.',
        'Keep non-essential shopping within 35% of discretionary allowance.',
      ],
    });
  });

  // ==========================================
  // NOTIFICATIONS ROUTES
  // ==========================================

  app.get('/api/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    const notifs = dbRepository.getNotifications(userId);
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    res.json({ notifications: notifs, unreadCount });
  });

  app.put('/api/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const ok = dbRepository.markNotificationAsRead(req.params.id);
    res.json({ success: ok });
  });

  app.post('/api/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id || 'usr_demo_smartspend';
    dbRepository.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  // ==========================================
  // SYSTEM VERIFICATION TESTS & RESET DEMO
  // ==========================================

  app.get('/api/system/tests', async (req: Request, res: Response) => {
    const report = await TestSuiteService.runAllTests();
    res.json(report);
  });

  app.get('/api/system/db-status', (req: Request, res: Response) => {
    const status = dbDriver.getStatus();
    const userCount = dbRepository.getUserCount();
    res.json({
      ...status,
      userCount,
      description: 'SQLite (zero-configuration embedded engine) with schema ported from backend/schema.sql',
    });
  });

  app.get('/api/system/evaluation-report', async (req: Request, res: Response) => {
    try {
      let report = EvaluationService.getLatestReport();
      if (!report) {
        report = await EvaluationService.runBenchmark(false);
      }
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch evaluation report' });
    }
  });

  app.post('/api/system/run-evaluation', async (req: Request, res: Response) => {
    try {
      const useAi = req.body.useAi !== false;
      const report = await EvaluationService.runBenchmark(useAi);
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to run evaluation' });
    }
  });

  app.post('/api/system/reset-demo', (req: Request, res: Response) => {
    dbRepository.resetToDemo();
    res.json({ success: true, message: 'Database reset to demo state' });
  });

  // ==========================================
  // VITE MIDDLEWARE (SPA & ASSETS)
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartSpend] Production server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
