# SmartSpend – Personal Financial Planning & AI Household Budget Guardian

A production-grade personal and family financial planning platform built for Indian households, young professionals, married couples, and families managing dependent responsibilities.

SmartSpend evaluates prospective purchases against live salary allocations, tracks filial commitments and insurance coverage, isolates ambiguous P2P transactions, and verifies all mathematical calculations with automated test assertions.

---

## 🏛️ System Architecture

SmartSpend operates as a single, unified, consolidated TypeScript stack:

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Backend:** Node.js Express 4, TypeScript (`server.ts`).
- **AI Intelligence:** Gemini 3.7 Flash (`@google/genai`) with high-precision Indian merchant heuristics.
- **Payment Gateway:** Razorpay SDK with HMAC-SHA256 signature verification for goal & emergency deposits.
- **Database:** Persistent embedded SQLite engine (`sql.js`) with relational schema.
- **Verification Engine:** Automated unit assertions and a 60-sample synthetic Indian transaction benchmark suite.

```
├── server.ts                       # Express API Server with Vite SPA fallback
├── server/
│   ├── db/
│   │   └── database.ts             # SQLite driver and schema initializer
│   ├── repository.ts               # Relational SQL repository
│   ├── services/
│   │   ├── classifierService.ts    # Gemini 3.7 Flash + Heuristic Classifier
│   │   ├── spendingDecisionEngine.ts # 5-rule spending decision evaluator
│   │   ├── razorpayService.ts      # Razorpay order creation & HMAC verification
│   │   ├── healthScoreService.ts   # 5-factor financial health score (0-100)
│   │   ├── testSuiteService.ts     # 10 automated unit test assertions
│   │   └── evaluationService.ts    # 60-transaction classification benchmark
│   ├── data/
│   │   └── syntheticDataset.ts     # 60 synthetic Indian transactions
│   └── scripts/
│       └── evaluate.ts             # CLI benchmark evaluation runner
└── src/                            # React 19 Frontend Components
```

---

## 🚀 Key Features

### 1. AI-Powered Indian Transaction Classification
- Classifies incoming merchants into **Essential**, **Family Support**, **Insurance**, **Discretionary**, and **Uncertain**.
- Handles Indian context: LIC, HDFC Life, Bescom, BigBasket, Blinkit, Swiggy, Zomato, geriatric care, and parental remittances.
- **Uncertainty Guardrail:** Obfuscated strings, raw phone number P2P IDs, and payment aggregator codes are routed to a manual review queue rather than hallucinated.

### 2. Pre-Purchase Spending Evaluation Engine
- Evaluates prospective purchases **before** money is spent.
- 5-Tier Decision Matrix: **Allowed**, **Needs Caution**, **Recommended to Delay**, **Highly Discouraged**, or **Over-budget Alert**.
- Analyzes Category Headroom, Essential Shielding, Emergency Fund impact, Goal timelines, and Monthly Debt Commitments.

### 3. Family Support & Filial Commitment Planner
- Dedicated tracking for remittances sent to retired parents, elder healthcare, geriatric medicines, and dependent education.
- Ensures family support obligations are ring-fenced from discretionary lifestyle splurges.

### 4. Razorpay Test-Mode Integration
- Real Razorpay SDK integration for creating mock orders and verifying HMAC-SHA256 signatures.
- Enables instant micro-deposits into Emergency Funds and Financial Goals.

### 5. Automated Benchmarking & Quality Assurance
- **CLI Benchmark:** Run `npm run evaluate` to test the AI classifier against 60 synthetic transactions.
- **Unit Assertion Suite:** 10 core mathematical rules validated with pass/fail verification in the UI and test runner.

---

## 🛠️ Quickstart & Commands

```bash
# Start development server (Port 3000)
npm run dev

# Run the 60-transaction AI classification benchmark
npm run evaluate

# Lint codebase
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

---

## 🔐 Environment Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for `gemini-3.7-flash` model inference |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID for payment order creation |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key for HMAC-SHA256 signature verification |
| `JWT_SECRET` | Secret token for secure session authentication |
| `NODE_ENV` | Application environment (`development` or `production`) |
