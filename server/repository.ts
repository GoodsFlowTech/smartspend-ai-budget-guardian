import bcrypt from 'bcryptjs';
import { dbDriver } from './db/database';
import {
  UserEntity,
  FinancialProfileEntity,
  ExpenseEntity,
  FamilyMemberEntity,
  FinancialGoalEntity,
  EmergencyFundEntity,
  InsurancePolicyEntity,
  NotificationEntity,
  MonthlyBudgetEntity,
} from './types';

class DatabaseRepository {
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    if (this.initialized) return;
    await dbDriver.initialize();
    const count = this.getUserCount();
    if (count === 0) {
      this.seedInitialData();
    }
    this.initialized = true;
  }

  public getUserCount(): number {
    try {
      const res = dbDriver.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
      return res ? Number(res.count) : 0;
    } catch {
      return 0;
    }
  }

  public seedInitialData(): void {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('password123', salt);
    const demoUserId = 'usr_demo_smartspend';
    const now = new Date().toISOString();
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. 2026-08

    // Clear existing
    dbDriver.run('DELETE FROM users');
    dbDriver.run('DELETE FROM financial_profiles');
    dbDriver.run('DELETE FROM expenses');
    dbDriver.run('DELETE FROM family_members');
    dbDriver.run('DELETE FROM financial_goals');
    dbDriver.run('DELETE FROM emergency_funds');
    dbDriver.run('DELETE FROM insurance_policies');
    dbDriver.run('DELETE FROM monthly_budgets');
    dbDriver.run('DELETE FROM notifications');

    // 1. User
    dbDriver.run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [demoUserId, 'Aarav & Priya Sharma', 'demo@smartspend.app', passwordHash, 'user', now, now]
    );

    // 2. Financial Profile
    dbDriver.run(
      `INSERT INTO financial_profiles (
        id, user_id, monthly_salary, other_income, rent_expenses, food_expenses,
        transport_expenses, utilities_expenses, medical_expenses, emi_expenses,
        insurance_expenses, family_support_expenses, discretionary_budget, savings_target,
        existing_emergency_fund, desired_emergency_months, number_of_children,
        number_of_dependents, marital_status, risk_profile, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'prof_demo',
        demoUserId,
        65000,
        5000,
        18000,
        9000,
        3500,
        2800,
        2000,
        4500,
        3200,
        7000,
        14000,
        10000,
        65000,
        6,
        1,
        2,
        'Married',
        'Moderate',
        now,
        now,
      ]
    );

    // 3. Family Members
    const family = [
      {
        id: 'fam_01',
        name: 'Priya Sharma (Spouse)',
        relationship: 'Spouse',
        age: 31,
        dependency: 'Partial',
        allocation: 6000,
        notes: 'Freelance designer & co-budget planner',
      },
      {
        id: 'fam_02',
        name: 'Rohan Sharma (Child)',
        relationship: 'Child',
        age: 5,
        dependency: 'Full',
        allocation: 5500,
        notes: 'Kindergarten & pediatric healthcare',
      },
      {
        id: 'fam_03',
        name: 'Suresh Sharma (Father)',
        relationship: 'Parent',
        age: 67,
        dependency: 'Full',
        allocation: 4000,
        notes: 'Retired, diabetic maintenance medicines',
      },
      {
        id: 'fam_04',
        name: 'Kamla Sharma (Mother)',
        relationship: 'Parent',
        age: 63,
        dependency: 'Full',
        allocation: 3000,
        notes: 'Arthritis physiotherapy & wellness',
      },
    ];

    for (const f of family) {
      dbDriver.run(
        'INSERT INTO family_members (id, user_id, name, relationship, age, financial_dependency, monthly_allocation, important_notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [f.id, demoUserId, f.name, f.relationship, f.age, f.dependency, f.allocation, f.notes, now]
      );
    }

    // 4. Emergency Fund
    dbDriver.run(
      'INSERT INTO emergency_funds (id, user_id, monthly_essential_expenses, desired_months, current_savings, target_amount, monthly_contribution, notes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        'emf_demo',
        demoUserId,
        35000,
        6,
        65000,
        210000,
        5000,
        'HDFC High-Yield Flexi FD earmarked for unforeseen emergencies',
        now,
      ]
    );

    // 5. Goals
    const goals = [
      {
        id: 'goal_01',
        name: "Rohan's Higher Education & Schooling",
        cat: 'Child Education',
        target: 500000,
        cur: 145000,
        date: '2030-03-31',
        sip: 4500,
        prio: 'High',
        notes: 'Targeting top ICSE Academy and college corpus fund',
      },
      {
        id: 'goal_02',
        name: 'Family Apartment Down Payment',
        cat: 'Home Purchase',
        target: 1200000,
        cur: 280000,
        date: '2028-12-31',
        sip: 6000,
        prio: 'High',
        notes: 'Down payment for 3BHK flat in residential suburbs',
      },
      {
        id: 'goal_03',
        name: 'Annual Shimla & Manali Vacation',
        cat: 'Vacation',
        target: 60000,
        cur: 38000,
        date: '2026-11-15',
        sip: 2500,
        prio: 'Medium',
        notes: 'Year-end family winter vacation',
      },
    ];

    for (const g of goals) {
      dbDriver.run(
        'INSERT INTO financial_goals (id, user_id, goal_name, category, target_amount, current_amount, target_date, monthly_contribution, priority, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [g.id, demoUserId, g.name, g.cat, g.target, g.cur, g.date, g.sip, g.prio, g.notes, now]
      );
    }

    // 6. Insurance Policies
    const policies = [
      {
        id: 'ins_01',
        type: 'Health',
        provider: 'Star Health Family Health Optima',
        insured: 'Aarav, Priya & Rohan',
        cover: 1500000,
        prem: 1850,
        freq: 'Monthly',
        num: 'STAR-FAM-882109',
        start: '2025-01-10',
        renew: '2027-01-10',
        notes: '₹15 Lakh family floater with maternity and restore benefit',
      },
      {
        id: 'ins_02',
        type: 'Term Life',
        provider: 'HDFC Life Click 2 Protect',
        insured: 'Aarav Sharma',
        cover: 10000000,
        prem: 1350,
        freq: 'Monthly',
        num: 'HDFC-TERM-90112',
        start: '2024-06-01',
        renew: '2026-09-01',
        notes: '₹1 Crore pure risk term cover with accidental disability rider',
      },
      {
        id: 'ins_03',
        type: 'Critical Illness',
        provider: 'Care Health Senior First',
        insured: 'Suresh & Kamla Sharma',
        cover: 800000,
        prem: 2200,
        freq: 'Monthly',
        num: 'CARE-SR-44102',
        start: '2024-11-20',
        renew: '2026-11-20',
        notes: 'Covers cardiac, oncology & diabetic surgical emergencies for parents',
      },
    ];

    for (const p of policies) {
      dbDriver.run(
        'INSERT INTO insurance_policies (id, user_id, policy_type, provider, insured_person, coverage_amount, premium, frequency, policy_number, start_date, renewal_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, demoUserId, p.type, p.provider, p.insured, p.cover, p.prem, p.freq, p.num, p.start, p.renew, p.notes, now]
      );
    }

    // 7. Expenses
    const expenses = [
      {
        id: 'exp_01',
        amt: 18000,
        cat: 'Housing',
        sub: 'Apartment Rent',
        d: `${currentMonth}-02`,
        desc: 'Monthly flat rent transfer to landlord',
        meth: 'Net Banking',
        nec: 'Essential',
        rec: 1,
      },
      {
        id: 'exp_02',
        amt: 5400,
        cat: 'Food',
        sub: 'Monthly Groceries',
        d: `${currentMonth}-04`,
        desc: 'DMart monthly provisions, grains & household supplies',
        meth: 'UPI',
        nec: 'Essential',
        rec: 1,
      },
      {
        id: 'exp_03',
        amt: 4500,
        cat: 'EMI/Loan',
        sub: 'Two Wheeler EMI',
        d: `${currentMonth}-05`,
        desc: 'HDFC Bank auto-debit for Honda Activa EMI',
        meth: 'Net Banking',
        nec: 'Essential',
        rec: 1,
      },
      {
        id: 'exp_04',
        amt: 2800,
        cat: 'Bills',
        sub: 'Electricity & Gas',
        d: `${currentMonth}-07`,
        desc: 'Bescom power bill & piped natural gas',
        meth: 'UPI',
        nec: 'Essential',
        rec: 1,
      },
      {
        id: 'exp_05',
        amt: 3200,
        cat: 'Insurance',
        sub: 'Health & Life Premium',
        d: `${currentMonth}-08`,
        desc: 'Star Health & HDFC Life combined monthly premiums',
        meth: 'Net Banking',
        nec: 'Essential',
        rec: 1,
      },
      {
        id: 'exp_06',
        amt: 4000,
        cat: 'Family',
        sub: 'Parental Support',
        d: `${currentMonth}-09`,
        desc: 'Monthly filial allowance & medicine support for Suresh & Kamla',
        meth: 'UPI',
        nec: 'Important',
        fam: 'fam_03',
        rec: 1,
      },
      {
        id: 'exp_07',
        amt: 3500,
        cat: 'Education',
        sub: 'School Activity Fee',
        d: `${currentMonth}-11`,
        desc: "Rohan's kindergarten quarterly extracurricular fees",
        meth: 'UPI',
        nec: 'Important',
        fam: 'fam_02',
        rec: 0,
      },
      {
        id: 'exp_08',
        amt: 1450,
        cat: 'Transportation',
        sub: 'Fuel & Metro',
        d: `${currentMonth}-13`,
        desc: 'HP Petrol bunk refill & Smart Card recharge',
        meth: 'UPI',
        nec: 'Essential',
        rec: 0,
      },
      {
        id: 'exp_09',
        amt: 1850,
        cat: 'Medical',
        sub: 'Senior Citizen Care',
        d: `${currentMonth}-15`,
        desc: 'Apollo Pharmacy diabetic strips & BP maintenance refills',
        meth: 'Credit Card',
        nec: 'Essential',
        fam: 'fam_03',
        rec: 1,
      },
      {
        id: 'exp_10',
        amt: 2200,
        cat: 'Food',
        sub: 'Dining Out',
        d: `${currentMonth}-17`,
        desc: 'Weekend family dinner at Barbeque Nation',
        meth: 'Credit Card',
        nec: 'Non-essential',
        rec: 0,
      },
      {
        id: 'exp_11',
        amt: 1600,
        cat: 'Shopping',
        sub: 'Apparel',
        d: `${currentMonth}-19`,
        desc: 'Myntra monsoon sale kids wear for Rohan',
        meth: 'UPI',
        nec: 'Non-essential',
        fam: 'fam_02',
        rec: 0,
      },
      {
        id: 'exp_12',
        amt: 850,
        cat: 'Entertainment',
        sub: 'Cinema & Streaming',
        d: `${currentMonth}-20`,
        desc: 'PVR Inox weekend movie tickets & Netflix subscription',
        meth: 'UPI',
        nec: 'Non-essential',
        rec: 0,
      },
    ];

    for (const e of expenses) {
      dbDriver.run(
        'INSERT INTO expenses (id, user_id, amount, category, subcategory, date, description, payment_method, necessity_level, family_member_id, is_recurring, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          e.id,
          demoUserId,
          e.amt,
          e.cat,
          e.sub,
          e.d,
          e.desc,
          e.meth,
          e.nec,
          (e as any).fam || null,
          e.rec,
          null,
          now,
          now,
        ]
      );
    }

    // 8. Notifications
    const notifs = [
      {
        id: 'notif_01',
        title: 'Insurance Renewal Approaching',
        msg: 'HDFC Life Click 2 Protect (Policy: HDFC-TERM-90112) is due for renewal on 2026-09-01. Please ensure ₹1,350 is allocated.',
        type: 'warning',
        link: '/insurance',
        read: 0,
      },
      {
        id: 'notif_02',
        title: 'Emergency Fund Below 6-Month Target',
        msg: 'Current emergency reserve is ₹65,000 (31% of ₹2,10,000 target). We recommend maintaining the ₹5,000 monthly contribution.',
        type: 'alert',
        link: '/emergency-fund',
        read: 0,
      },
      {
        id: 'notif_03',
        title: 'Education Goal Milestone Reached',
        msg: "You have achieved 29% progress towards Rohan's Higher Education fund! Keep up the consistent SIP.",
        type: 'success',
        link: '/goals',
        read: 1,
      },
    ];

    for (const n of notifs) {
      dbDriver.run(
        'INSERT INTO notifications (id, user_id, title, message, type, date, is_read, action_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [n.id, demoUserId, n.title, n.msg, n.type, now, n.read, n.link]
      );
    }

    // 9. Monthly Budget
    const categoryBudgets = {
      Housing: 18000,
      Food: 9000,
      Transportation: 3500,
      Medical: 3000,
      Education: 4500,
      Bills: 3000,
      Insurance: 3200,
      Family: 7000,
      'EMI/Loan': 4500,
      Shopping: 4000,
      Entertainment: 2500,
      Travel: 2000,
      Other: 2000,
    };

    dbDriver.run(
      `INSERT INTO monthly_budgets (
        id, user_id, month, total_income, essential_allocated,
        family_support_allocated, insurance_allocated, savings_allocated,
        discretionary_allocated, emergency_allocated, investments_allocated,
        category_breakdown_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `bgt_${demoUserId}_${currentMonth}`,
        demoUserId,
        currentMonth,
        70000,
        30800,
        7000,
        3200,
        10000,
        14000,
        5000,
        0,
        JSON.stringify(categoryBudgets),
        now,
        now,
      ]
    );
  }

  // --- USERS ---
  public findUserByEmail(email: string): UserEntity | undefined {
    const row = dbDriver.queryOne<any>('SELECT * FROM users WHERE LOWER(email) = LOWER(?)', [email]);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public findUserById(id: string): UserEntity | undefined {
    const row = dbDriver.queryOne<any>('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public createUser(user: UserEntity): UserEntity {
    dbDriver.run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.name, user.email, user.passwordHash, user.role, user.createdAt, user.updatedAt]
    );
    return user;
  }

  // --- FINANCIAL PROFILES ---
  public getProfileByUserId(userId: string): FinancialProfileEntity | undefined {
    const row = dbDriver.queryOne<any>('SELECT * FROM financial_profiles WHERE user_id = ?', [userId]);
    if (!row) return undefined;
    return {
      id: row.id,
      userId: row.user_id,
      monthlySalary: Number(row.monthly_salary),
      otherIncome: Number(row.other_income),
      rentExpenses: Number(row.rent_expenses),
      foodExpenses: Number(row.food_expenses),
      transportExpenses: Number(row.transport_expenses),
      utilitiesExpenses: Number(row.utilities_expenses),
      medicalExpenses: Number(row.medical_expenses),
      emiExpenses: Number(row.emi_expenses),
      insuranceExpenses: Number(row.insurance_expenses),
      numberOfFamilyMembers: 1 + Number(row.number_of_children) + Number(row.number_of_dependents),
      numberOfChildren: Number(row.number_of_children),
      numberOfDependents: Number(row.number_of_dependents),
      existingSavings: Number(row.savings_target || 45000),
      existingEmergencyFund: Number(row.existing_emergency_fund),
      monthlySavingsTarget: Number(row.savings_target),
      desiredEmergencyMonths: Number(row.desired_emergency_months),
      currency: '₹',
      updatedAt: row.updated_at,
    };
  }

  public upsertProfile(profile: FinancialProfileEntity): FinancialProfileEntity {
    const existing = this.getProfileByUserId(profile.userId);
    const now = new Date().toISOString();

    if (existing) {
      dbDriver.run(
        `UPDATE financial_profiles SET
          monthly_salary = ?, other_income = ?, rent_expenses = ?, food_expenses = ?,
          transport_expenses = ?, utilities_expenses = ?, medical_expenses = ?, emi_expenses = ?,
          insurance_expenses = ?, savings_target = ?, existing_emergency_fund = ?,
          desired_emergency_months = ?, number_of_children = ?, number_of_dependents = ?,
          updated_at = ?
        WHERE user_id = ?`,
        [
          profile.monthlySalary,
          profile.otherIncome || 0,
          profile.rentExpenses,
          profile.foodExpenses,
          profile.transportExpenses,
          profile.utilitiesExpenses,
          profile.medicalExpenses,
          profile.emiExpenses,
          profile.insuranceExpenses,
          profile.monthlySavingsTarget || 0,
          profile.existingEmergencyFund || 0,
          profile.desiredEmergencyMonths || 6,
          profile.numberOfChildren || 0,
          profile.numberOfDependents || 0,
          now,
          profile.userId,
        ]
      );
    } else {
      dbDriver.run(
        `INSERT INTO financial_profiles (
          id, user_id, monthly_salary, other_income, rent_expenses, food_expenses,
          transport_expenses, utilities_expenses, medical_expenses, emi_expenses,
          insurance_expenses, family_support_expenses, discretionary_budget, savings_target,
          existing_emergency_fund, desired_emergency_months, number_of_children,
          number_of_dependents, marital_status, risk_profile, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.id || `prof_${profile.userId}`,
          profile.userId,
          profile.monthlySalary,
          profile.otherIncome || 0,
          profile.rentExpenses,
          profile.foodExpenses,
          profile.transportExpenses,
          profile.utilitiesExpenses,
          profile.medicalExpenses,
          profile.emiExpenses,
          profile.insuranceExpenses,
          0,
          0,
          profile.monthlySavingsTarget || 0,
          profile.existingEmergencyFund || 0,
          profile.desiredEmergencyMonths || 6,
          profile.numberOfChildren || 0,
          profile.numberOfDependents || 0,
          'Married',
          'Moderate',
          now,
          now,
        ]
      );
    }

    return profile;
  }

  // --- EXPENSES ---
  public getExpensesByUserId(userId: string): ExpenseEntity[] {
    const rows = dbDriver.query<any>(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      amount: Number(r.amount),
      category: r.category,
      subcategory: r.subcategory || undefined,
      date: r.date,
      description: r.description,
      paymentMethod: r.payment_method,
      necessityLevel: r.necessity_level,
      familyMemberId: r.family_member_id || undefined,
      isRecurring: Boolean(r.is_recurring),
      notes: r.notes || undefined,
      confidence: r.confidence ? Number(r.confidence) : undefined,
      reasoning: r.reasoning || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  public getExpenseById(id: string): ExpenseEntity | undefined {
    const r = dbDriver.queryOne<any>('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!r) return undefined;
    return {
      id: r.id,
      userId: r.user_id,
      amount: Number(r.amount),
      category: r.category,
      subcategory: r.subcategory || undefined,
      date: r.date,
      description: r.description,
      paymentMethod: r.payment_method,
      necessityLevel: r.necessity_level,
      familyMemberId: r.family_member_id || undefined,
      isRecurring: Boolean(r.is_recurring),
      notes: r.notes || undefined,
      confidence: r.confidence ? Number(r.confidence) : undefined,
      reasoning: r.reasoning || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  public createExpense(expense: ExpenseEntity): ExpenseEntity {
    dbDriver.run(
      `INSERT INTO expenses (
        id, user_id, amount, category, subcategory, date, description,
        payment_method, necessity_level, family_member_id, is_recurring,
        notes, confidence, reasoning, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expense.id,
        expense.userId,
        expense.amount,
        expense.category,
        expense.subcategory || null,
        expense.date,
        expense.description,
        expense.paymentMethod,
        expense.necessityLevel,
        expense.familyMemberId || null,
        expense.isRecurring ? 1 : 0,
        expense.notes || null,
        expense.confidence || null,
        expense.reasoning || null,
        expense.createdAt,
        expense.updatedAt,
      ]
    );
    return expense;
  }

  public updateExpense(id: string, updates: Partial<ExpenseEntity>): ExpenseEntity | null {
    const existing = this.getExpenseById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    dbDriver.run(
      `UPDATE expenses SET
        amount = ?, category = ?, subcategory = ?, date = ?, description = ?,
        payment_method = ?, necessity_level = ?, family_member_id = ?, is_recurring = ?,
        notes = ?, updated_at = ?
      WHERE id = ?`,
      [
        merged.amount,
        merged.category,
        merged.subcategory || null,
        merged.date,
        merged.description,
        merged.paymentMethod,
        merged.necessityLevel,
        merged.familyMemberId || null,
        merged.isRecurring ? 1 : 0,
        merged.notes || null,
        merged.updatedAt,
        id,
      ]
    );
    return merged;
  }

  public deleteExpense(id: string): boolean {
    dbDriver.run('DELETE FROM expenses WHERE id = ?', [id]);
    return true;
  }

  // --- FAMILY MEMBERS ---
  public getFamilyMembers(userId: string): FamilyMemberEntity[] {
    const rows = dbDriver.query<any>('SELECT * FROM family_members WHERE user_id = ? ORDER BY created_at ASC', [
      userId,
    ]);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      relationship: r.relationship,
      age: Number(r.age),
      financialDependency: r.financial_dependency,
      monthlyAllocation: Number(r.monthly_allocation),
      importantNotes: r.important_notes || undefined,
      createdAt: r.created_at,
    }));
  }

  public addFamilyMember(member: FamilyMemberEntity): FamilyMemberEntity {
    dbDriver.run(
      `INSERT INTO family_members (id, user_id, name, relationship, age, financial_dependency, monthly_allocation, important_notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member.id,
        member.userId,
        member.name,
        member.relationship,
        member.age,
        member.financialDependency,
        member.monthlyAllocation,
        member.importantNotes || null,
        member.createdAt,
      ]
    );
    return member;
  }

  public updateFamilyMember(id: string, updates: Partial<FamilyMemberEntity>): FamilyMemberEntity | null {
    const rows = dbDriver.query<any>('SELECT * FROM family_members WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const existing = rows[0];
    const merged = { ...existing, ...updates };

    dbDriver.run(
      `UPDATE family_members SET
        name = ?, relationship = ?, age = ?, financial_dependency = ?, monthly_allocation = ?, important_notes = ?
      WHERE id = ?`,
      [
        merged.name,
        merged.relationship,
        Number(merged.age),
        merged.financialDependency || merged.financial_dependency,
        Number(merged.monthlyAllocation || merged.monthly_allocation),
        merged.importantNotes || merged.important_notes || null,
        id,
      ]
    );

    return {
      id: merged.id,
      userId: merged.user_id,
      name: merged.name,
      relationship: merged.relationship,
      age: Number(merged.age),
      financialDependency: merged.financialDependency || merged.financial_dependency,
      monthlyAllocation: Number(merged.monthlyAllocation || merged.monthly_allocation),
      importantNotes: merged.importantNotes || merged.important_notes || undefined,
      createdAt: merged.created_at,
    };
  }

  public deleteFamilyMember(id: string): boolean {
    dbDriver.run('DELETE FROM family_members WHERE id = ?', [id]);
    return true;
  }

  // --- FINANCIAL GOALS ---
  public getGoals(userId: string): FinancialGoalEntity[] {
    const rows = dbDriver.query<any>('SELECT * FROM financial_goals WHERE user_id = ? ORDER BY target_date ASC', [
      userId,
    ]);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      goalName: r.goal_name,
      category: r.category,
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      targetDate: r.target_date,
      monthlyContribution: Number(r.monthly_contribution),
      priority: r.priority,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));
  }

  public addGoal(goal: FinancialGoalEntity): FinancialGoalEntity {
    dbDriver.run(
      `INSERT INTO financial_goals (id, user_id, goal_name, category, target_amount, current_amount, target_date, monthly_contribution, priority, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.userId,
        goal.goalName,
        goal.category,
        goal.targetAmount,
        goal.currentAmount,
        goal.targetDate,
        goal.monthlyContribution,
        goal.priority,
        goal.notes || null,
        goal.createdAt,
      ]
    );
    return goal;
  }

  public updateGoal(id: string, updates: Partial<FinancialGoalEntity>): FinancialGoalEntity | null {
    const rows = dbDriver.query<any>('SELECT * FROM financial_goals WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const existing = rows[0];
    const merged = { ...existing, ...updates };

    dbDriver.run(
      `UPDATE financial_goals SET
        goal_name = ?, category = ?, target_amount = ?, current_amount = ?, target_date = ?, monthly_contribution = ?, priority = ?, notes = ?
      WHERE id = ?`,
      [
        merged.goalName || merged.goal_name,
        merged.category,
        Number(merged.targetAmount !== undefined ? merged.targetAmount : merged.target_amount),
        Number(merged.currentAmount !== undefined ? merged.currentAmount : merged.current_amount),
        merged.targetDate || merged.target_date,
        Number(merged.monthlyContribution !== undefined ? merged.monthlyContribution : merged.monthly_contribution),
        merged.priority,
        merged.notes !== undefined ? merged.notes : null,
        id,
      ]
    );

    return {
      id: merged.id,
      userId: merged.user_id,
      goalName: merged.goalName || merged.goal_name,
      category: merged.category,
      targetAmount: Number(merged.targetAmount !== undefined ? merged.targetAmount : merged.target_amount),
      currentAmount: Number(merged.currentAmount !== undefined ? merged.currentAmount : merged.current_amount),
      targetDate: merged.targetDate || merged.target_date,
      monthlyContribution: Number(
        merged.monthlyContribution !== undefined ? merged.monthlyContribution : merged.monthly_contribution
      ),
      priority: merged.priority,
      notes: merged.notes || undefined,
      createdAt: merged.created_at,
    };
  }

  public deleteGoal(id: string): boolean {
    dbDriver.run('DELETE FROM financial_goals WHERE id = ?', [id]);
    return true;
  }

  // --- EMERGENCY FUND ---
  public getEmergencyFund(userId: string): EmergencyFundEntity | undefined {
    const row = dbDriver.queryOne<any>('SELECT * FROM emergency_funds WHERE user_id = ?', [userId]);
    if (!row) return undefined;
    return {
      id: row.id,
      userId: row.user_id,
      monthlyEssentialExpenses: Number(row.monthly_essential_expenses),
      desiredMonths: Number(row.desired_months),
      currentSavings: Number(row.current_savings),
      targetAmount: Number(row.target_amount),
      monthlyContribution: Number(row.monthly_contribution),
      notes: row.notes || undefined,
      updatedAt: row.updated_at,
    };
  }

  public upsertEmergencyFund(fund: EmergencyFundEntity): EmergencyFundEntity {
    const existing = this.getEmergencyFund(fund.userId);
    const now = new Date().toISOString();

    if (existing) {
      dbDriver.run(
        `UPDATE emergency_funds SET
          monthly_essential_expenses = ?, desired_months = ?, current_savings = ?, target_amount = ?, monthly_contribution = ?, notes = ?, updated_at = ?
        WHERE user_id = ?`,
        [
          fund.monthlyEssentialExpenses,
          fund.desiredMonths,
          fund.currentSavings,
          fund.targetAmount,
          fund.monthlyContribution,
          fund.notes || null,
          now,
          fund.userId,
        ]
      );
    } else {
      dbDriver.run(
        `INSERT INTO emergency_funds (id, user_id, monthly_essential_expenses, desired_months, current_savings, target_amount, monthly_contribution, notes, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          fund.id || `emf_${fund.userId}`,
          fund.userId,
          fund.monthlyEssentialExpenses,
          fund.desiredMonths,
          fund.currentSavings,
          fund.targetAmount,
          fund.monthlyContribution,
          fund.notes || null,
          now,
        ]
      );
    }

    return fund;
  }

  // --- INSURANCE POLICIES ---
  public getInsurancePolicies(userId: string): InsurancePolicyEntity[] {
    const rows = dbDriver.query<any>(
      'SELECT * FROM insurance_policies WHERE user_id = ? ORDER BY renewal_date ASC',
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      policyType: r.policy_type,
      provider: r.provider,
      insuredPerson: r.insured_person,
      coverageAmount: Number(r.coverage_amount),
      premium: Number(r.premium),
      frequency: r.frequency,
      policyNumber: r.policy_number || undefined,
      startDate: r.start_date,
      renewalDate: r.renewal_date,
      notes: r.notes || undefined,
      createdAt: r.created_at,
    }));
  }

  public addInsurancePolicy(policy: InsurancePolicyEntity): InsurancePolicyEntity {
    dbDriver.run(
      `INSERT INTO insurance_policies (id, user_id, policy_type, provider, insured_person, coverage_amount, premium, frequency, policy_number, start_date, renewal_date, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        policy.id,
        policy.userId,
        policy.policyType,
        policy.provider,
        policy.insuredPerson,
        policy.coverageAmount,
        policy.premium,
        policy.frequency,
        policy.policyNumber || null,
        policy.startDate,
        policy.renewalDate,
        policy.notes || null,
        policy.createdAt,
      ]
    );
    return policy;
  }

  public updateInsurancePolicy(id: string, updates: Partial<InsurancePolicyEntity>): InsurancePolicyEntity | null {
    const rows = dbDriver.query<any>('SELECT * FROM insurance_policies WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const existing = rows[0];
    const merged = { ...existing, ...updates };

    dbDriver.run(
      `UPDATE insurance_policies SET
        policy_type = ?, provider = ?, insured_person = ?, coverage_amount = ?, premium = ?, frequency = ?, policy_number = ?, start_date = ?, renewal_date = ?, notes = ?
      WHERE id = ?`,
      [
        merged.policyType || merged.policy_type,
        merged.provider,
        merged.insuredPerson || merged.insured_person,
        Number(merged.coverageAmount !== undefined ? merged.coverageAmount : merged.coverage_amount),
        Number(merged.premium),
        merged.frequency,
        merged.policyNumber || merged.policy_number || null,
        merged.startDate || merged.start_date,
        merged.renewalDate || merged.renewal_date,
        merged.notes || null,
        id,
      ]
    );

    return {
      id: merged.id,
      userId: merged.user_id,
      policyType: merged.policyType || merged.policy_type,
      provider: merged.provider,
      insuredPerson: merged.insuredPerson || merged.insured_person,
      coverageAmount: Number(merged.coverageAmount !== undefined ? merged.coverageAmount : merged.coverage_amount),
      premium: Number(merged.premium),
      frequency: merged.frequency,
      policyNumber: merged.policyNumber || merged.policy_number || undefined,
      startDate: merged.startDate || merged.start_date,
      renewalDate: merged.renewalDate || merged.renewal_date,
      notes: merged.notes || undefined,
      createdAt: merged.created_at,
    };
  }

  public deleteInsurancePolicy(id: string): boolean {
    dbDriver.run('DELETE FROM insurance_policies WHERE id = ?', [id]);
    return true;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(userId: string): NotificationEntity[] {
    const rows = dbDriver.query<any>(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY date DESC, is_read ASC',
      [userId]
    );
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      title: r.title,
      message: r.message,
      createdAt: r.date,
      isRead: Boolean(r.is_read),
      link: r.action_url || undefined,
    }));
  }

  public createNotification(notif: NotificationEntity): NotificationEntity {
    dbDriver.run(
      'INSERT INTO notifications (id, user_id, type, title, message, date, is_read, action_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [notif.id, notif.userId, notif.type, notif.title, notif.message, notif.createdAt, notif.isRead ? 1 : 0, notif.link || null]
    );
    return notif;
  }

  public markNotificationAsRead(id: string): boolean {
    dbDriver.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
    return true;
  }

  public markAllNotificationsRead(userId: string): void {
    dbDriver.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  }

  // --- BUDGETS ---
  public getBudget(userId: string, monthYear: string): MonthlyBudgetEntity | undefined {
    const row = dbDriver.queryOne<any>('SELECT * FROM monthly_budgets WHERE user_id = ? AND month = ?', [
      userId,
      monthYear,
    ]);
    if (!row) return undefined;

    let categoryBudgets: Record<string, number> = {};
    try {
      if (row.category_breakdown_json) {
        categoryBudgets = JSON.parse(row.category_breakdown_json);
      }
    } catch {}

    return {
      id: row.id,
      userId: row.user_id,
      monthYear: row.month,
      totalIncome: Number(row.total_income),
      mandatoryExpenses: Number(row.essential_allocated),
      familyExpenses: Number(row.family_support_allocated),
      insuranceExpenses: Number(row.insurance_allocated),
      emergencyFundContribution: Number(row.emergency_allocated || 0),
      savingsContribution: Number(row.savings_allocated),
      discretionaryBudget: Number(row.discretionary_allocated),
      categoryBudgets,
      updatedAt: row.updated_at,
    };
  }

  public upsertBudget(budget: MonthlyBudgetEntity): MonthlyBudgetEntity {
    const existing = this.getBudget(budget.userId, budget.monthYear);
    const now = new Date().toISOString();
    const categoryJson = JSON.stringify(budget.categoryBudgets || {});

    if (existing) {
      dbDriver.run(
        `UPDATE monthly_budgets SET
          total_income = ?, essential_allocated = ?, family_support_allocated = ?,
          insurance_allocated = ?, savings_allocated = ?, discretionary_allocated = ?,
          emergency_allocated = ?, category_breakdown_json = ?, updated_at = ?
        WHERE user_id = ? AND month = ?`,
        [
          budget.totalIncome,
          budget.mandatoryExpenses,
          budget.familyExpenses,
          budget.insuranceExpenses,
          budget.savingsContribution,
          budget.discretionaryBudget,
          budget.emergencyFundContribution,
          categoryJson,
          now,
          budget.userId,
          budget.monthYear,
        ]
      );
    } else {
      dbDriver.run(
        `INSERT INTO monthly_budgets (
          id, user_id, month, total_income, essential_allocated,
          family_support_allocated, insurance_allocated, savings_allocated,
          discretionary_allocated, emergency_allocated, investments_allocated,
          category_breakdown_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          budget.id || `bgt_${budget.userId}_${budget.monthYear}`,
          budget.userId,
          budget.monthYear,
          budget.totalIncome,
          budget.mandatoryExpenses,
          budget.familyExpenses,
          budget.insuranceExpenses,
          budget.savingsContribution,
          budget.discretionaryBudget,
          budget.emergencyFundContribution,
          0,
          categoryJson,
          now,
          now,
        ]
      );
    }

    return budget;
  }

  // --- RESET TO DEMO ---
  public resetToDemo(): void {
    this.seedInitialData();
  }
}

export const dbRepository = new DatabaseRepository();
