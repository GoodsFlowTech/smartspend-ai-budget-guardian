import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

export interface DbStatus {
  driver: 'sqlite';
  databasePath: string;
  isReady: boolean;
  tables: string[];
}

export class DatabaseDriver {
  private static instance: DatabaseDriver;
  private db: Database | null = null;
  private SQL: SqlJsStatic | null = null;
  private dbFilePath = path.join(process.cwd(), 'smartspend.sqlite');
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseDriver {
    if (!DatabaseDriver.instance) {
      DatabaseDriver.instance = new DatabaseDriver();
    }
    return DatabaseDriver.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;

    this.SQL = await initSqlJs();

    if (fs.existsSync(this.dbFilePath)) {
      try {
        const fileBuffer = fs.readFileSync(this.dbFilePath);
        this.db = new this.SQL.Database(fileBuffer);
      } catch (err) {
        console.warn('Could not read existing smartspend.sqlite, creating new SQLite database:', err);
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }

    this.createTables();
    this.saveToDisk();
    this.isInitialized = true;
  }

  private createTables(): void {
    if (!this.db) return;

    const ddl = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS financial_profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        monthly_salary REAL NOT NULL DEFAULT 0,
        other_income REAL NOT NULL DEFAULT 0,
        rent_expenses REAL NOT NULL DEFAULT 0,
        food_expenses REAL NOT NULL DEFAULT 0,
        transport_expenses REAL NOT NULL DEFAULT 0,
        utilities_expenses REAL NOT NULL DEFAULT 0,
        medical_expenses REAL NOT NULL DEFAULT 0,
        emi_expenses REAL NOT NULL DEFAULT 0,
        insurance_expenses REAL NOT NULL DEFAULT 0,
        family_support_expenses REAL NOT NULL DEFAULT 0,
        discretionary_budget REAL NOT NULL DEFAULT 0,
        savings_target REAL NOT NULL DEFAULT 0,
        existing_emergency_fund REAL NOT NULL DEFAULT 0,
        desired_emergency_months INT NOT NULL DEFAULT 6,
        number_of_children INT NOT NULL DEFAULT 0,
        number_of_dependents INT NOT NULL DEFAULT 0,
        marital_status TEXT NOT NULL DEFAULT 'Married',
        risk_profile TEXT NOT NULL DEFAULT 'Moderate',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        payment_method TEXT NOT NULL DEFAULT 'UPI',
        necessity_level TEXT NOT NULL DEFAULT 'Non-essential',
        family_member_id TEXT,
        is_recurring INT NOT NULL DEFAULT 0,
        notes TEXT,
        confidence REAL,
        reasoning TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        age INT NOT NULL DEFAULT 0,
        financial_dependency TEXT NOT NULL DEFAULT 'Full',
        monthly_allocation REAL NOT NULL DEFAULT 0,
        important_notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS financial_goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        goal_name TEXT NOT NULL,
        category TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        target_date TEXT NOT NULL,
        monthly_contribution REAL NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'High',
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS emergency_funds (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        monthly_essential_expenses REAL NOT NULL,
        desired_months INT NOT NULL DEFAULT 6,
        current_savings REAL NOT NULL DEFAULT 0,
        target_amount REAL NOT NULL,
        monthly_contribution REAL NOT NULL DEFAULT 0,
        notes TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS insurance_policies (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        policy_type TEXT NOT NULL,
        provider TEXT NOT NULL,
        insured_person TEXT NOT NULL DEFAULT 'Self',
        coverage_amount REAL NOT NULL DEFAULT 0,
        premium REAL NOT NULL DEFAULT 0,
        frequency TEXT NOT NULL DEFAULT 'Monthly',
        policy_number TEXT,
        start_date TEXT NOT NULL,
        renewal_date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS monthly_budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        month TEXT NOT NULL,
        total_income REAL NOT NULL,
        essential_allocated REAL NOT NULL,
        family_support_allocated REAL NOT NULL,
        insurance_allocated REAL NOT NULL,
        savings_allocated REAL NOT NULL,
        discretionary_allocated REAL NOT NULL,
        emergency_allocated REAL NOT NULL DEFAULT 0,
        investments_allocated REAL NOT NULL DEFAULT 0,
        category_breakdown_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (user_id, month),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        date TEXT NOT NULL,
        is_read INT NOT NULL DEFAULT 0,
        action_url TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS evaluation_runs (
        id TEXT PRIMARY KEY,
        run_timestamp TEXT NOT NULL,
        total_tests INT NOT NULL,
        total_correct INT NOT NULL,
        total_uncertain INT NOT NULL,
        total_misclassified INT NOT NULL,
        overall_accuracy REAL NOT NULL,
        report_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
      CREATE INDEX IF NOT EXISTS idx_goals_user ON financial_goals(user_id);
      CREATE INDEX IF NOT EXISTS idx_insurance_user ON insurance_policies(user_id);
    `;

    this.db.exec(ddl);
  }

  public saveToDisk(): void {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbFilePath, buffer);
    } catch (err) {
      console.error('Error writing smartspend.sqlite:', err);
    }
  }

  public run(sql: string, params: any[] = []): void {
    if (!this.db) throw new Error('Database not initialized');
    this.db.run(sql, params);
    this.saveToDisk();
  }

  public query<T = any>(sql: string, params: any[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
    }
    stmt.free();
    return results;
  }

  public queryOne<T = any>(sql: string, params: any[] = []): T | null {
    const results = this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  public getStatus(): DbStatus {
    const tables = this.query<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ).map((r) => r.name);

    return {
      driver: 'sqlite',
      databasePath: this.dbFilePath,
      isReady: this.isInitialized,
      tables,
    };
  }
}

export const dbDriver = DatabaseDriver.getInstance();
