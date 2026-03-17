# AI Money Copilot (US/UK) — V1 Product Specification

## 1) One-Paragraph Product Summary
AI Money Copilot is a mobile-first personal finance assistant for US/UK consumers that connects bank, credit, and investment accounts, automatically categorizes spending, and provides proactive coaching through a conversational AI interface plus actionable workflows. Unlike insight-only budgeting apps, the product combines explainable recommendations with user-approved agentic actions such as canceling subscriptions, negotiating recurring bills, and moving money to optimize cash flow. V1 focuses on three outcomes: (1) increase monthly cash cushion and confidence via "safe-to-spend" guidance, (2) reduce avoidable costs through automated interventions, and (3) help users navigate high-stakes decisions with scenario simulations, while operating within strict compliance boundaries (education and planning, not securities/tax/legal advice).

---

## 2) Target User Segments & Main Jobs-To-Be-Done

## Primary Segments
- **Segment A: Financially stressed professionals (22–40)**
  - Characteristics: paycheck-to-paycheck periods, multiple subscriptions, credit card balances, variable monthly expenses.
  - Needs: avoid overdrafts, pay down debt, automate savings without cash crunch.
- **Segment B: Organized optimizers (28–50)**
  - Characteristics: already use budgeting apps/spreadsheets; want better automation and intelligence.
  - Needs: consolidate visibility, optimize account usage, improve net worth trajectory.
- **Segment C: Life-transition planners (25–55)**
  - Characteristics: moving, changing jobs, starting family, considering large purchases.
  - Needs: compare financial scenarios quickly and confidently.

## Jobs-To-Be-Done (JTBD)
- "Help me understand where my money is going without doing manual categorization."
- "Tell me what I can safely spend this week/month and why."
- "Find and fix waste (unused subscriptions, high bills, fees) with minimal effort from me."
- "Nudge me toward better habits at the right moment, not with generic reminders."
- "Show me what happens if I make a big decision before I commit."
- "Take actions for me, but only with clear controls and approval."

---

## 3) Detailed Feature List

## A. Core V1 Features

### 1) Unified Financial Hub
- Account linking via Plaid-like aggregators for:
  - Checking/savings
  - Credit cards
  - Loans
  - Investment accounts
- Manual account support (user-entered balances for unsupported institutions/assets).
- Near-real-time balance and transaction sync.
- Account health indicators (cash runway, credit utilization, payment due timeline).

### 2) Transaction Intelligence
- Auto-categorization with confidence scores.
- Merchant normalization (e.g., "AMZN Mktp US*..." → "Amazon").
- Recurring transaction detection (subscriptions, utilities, rent, salary).
- User feedback loop:
  - recategorize once → apply rule going forward;
  - merge/split categories;
  - mark anomalies.

### 3) Safe-to-Spend Engine
- Dynamic safe-to-spend number at daily/weekly/monthly levels.
- Inputs:
  - current balances,
  - upcoming bills,
  - paycheck schedule,
  - savings goals,
  - debt minimum payments,
  - risk buffer settings.
- Explainability panel:
  - "Your safe-to-spend is $420 this week because rent and card payment are due in 5 days."
- Confidence badge (high/medium/low based on data completeness and income volatility).

### 4) Conversational Money Coach
- Natural-language Q&A over user finances:
  - "Why am I short this month?"
  - "How much did dining out increase?"
  - "Can I afford a $2,000 vacation in July?"
- Structured answer format:
  - direct answer,
  - top drivers,
  - recommended actions,
  - caveats.
- Weekly summary briefing:
  - spending highlights,
  - bill changes,
  - missed savings opportunities,
  - priority actions.

### 5) Alerts & Behavioral Nudges
- Event-driven alerts:
  - unusually high spending,
  - low-balance risk,
  - duplicate charges,
  - bill increase,
  - subscription renewal upcoming.
- Behavioral design nudges:
  - implementation-intent prompts ("If I exceed dining budget, pause delivery apps for 3 days").
  - streaks for savings/debt actions.
  - friction-inserting prompts for impulse categories.

### 6) Goal & Debt Planning
- Goal setup (emergency fund, travel, purchase down payment).
- Debt dashboard with paydown projections.
- Strategy simulations (avalanche vs snowball) with timeline and interest cost comparisons.

## B. "Agentic" Actions (AI-triggerable with user approval)

### Action Principles
- Every external action requires explicit user approval (step-up confirmation).
- Actions are reversible where possible.
- System always shows expected outcome, potential downside, and fallback.

### V1 Agentic Actions
1. **Cancel subscription flow**
   - Detect likely unused subscription.
   - Generate cancel plan (self-serve deep link/email template).
   - Optional automated cancellation through partner/API where supported.
2. **Bill renegotiation initiation**
   - Identify candidate bills (internet, phone, insurance).
   - Prepare negotiation packet (current bill, competitor benchmark, script).
   - Trigger assisted call/chat flow via partner service.
3. **Smart transfer recommendations + execution**
   - Recommend moving funds between checking/savings to avoid overdraft or hit savings targets.
   - Execute transfer only after confirmation and institution auth.
4. **Credit utilization guardrail action**
   - Recommend pre-due-date payment amount to keep utilization under threshold.
   - Trigger payment workflow with user confirmation.
5. **Bill timing optimization**
   - Suggest changing due dates to align with payroll.
   - Draft provider requests / direct user to provider portal.
6. **Auto-save sweeps (rule-based)**
   - User-defined rules (e.g., move 20% of weekly surplus on Friday).
   - AI can propose temporary pause during constrained cash weeks.

## C. Risk, Compliance & Safety Features

### Regulatory/Advice Boundaries
- Product language must be "educational" and "scenario-based," not directive financial advice.
- Explicitly avoid:
  - security-specific buy/sell recommendations,
  - tax filing strategies,
  - legal interpretations.
- Required disclaimers by context (investments, debt, scenario uncertainty).

### AI Safety & Reliability
- Human-readable rationale for all high-impact recommendations.
- Confidence-aware responses:
  - low confidence triggers clarifying questions or "I don't know" behavior.
- Hallucination mitigation:
  - retrieval only from verified user data + deterministic calculators for numeric outputs.
- Policy filters for prohibited output categories.

### User Protection Controls
- Fine-grained permissions by action type (read, suggest, transact).
- Step-up auth (PIN/biometric + re-consent) for money movement and recurring automations.
- Action preview + confirmation receipts.
- Kill switch: pause all automations instantly.

### Privacy & Security
- Encryption in transit and at rest.
- Tokenized credential handling via aggregator; no raw banking credentials stored.
- Data minimization and retention controls.
- Audit logs for all AI recommendations and user approvals.

---

## 4) End-to-End User Journeys

## A. New User Onboarding (First 15 Minutes)
1. **Sign-up + trust setup**
   - User selects country (US/UK), consents to terms, sees data-use summary.
2. **Account linking**
   - Connects primary checking, credit card, optional savings/investment.
   - System checks sync quality and prompts to add missing recurring bills manually.
3. **Profile calibration**
   - User sets payday cadence, essential bills, risk comfort, top goal.
4. **Initial insights generated**
   - Safe-to-spend baseline.
   - Top 3 savings opportunities.
   - Potential risks in next 14 days.
5. **Enable first automation**
   - User selects one: low-balance alert, subscription watchlist, or weekly surplus sweep.
6. **Onboarding completion moment**
   - AI gives "first-week plan" with 2–3 simple actions.

## B. Typical Weekly Power-User Session (10–20 Minutes)
1. User opens weekly brief notification.
2. Dashboard shows:
   - cash position,
   - spend vs plan,
   - due bills,
   - prioritized actions.
3. User asks conversational query (e.g., "Can I spend £150 this weekend?").
4. AI returns safe-to-spend, caveats, and optional tradeoff actions.
5. User approves one agentic action (e.g., transfer £100 from savings buffer to checking, or cancel a trial renewal).
6. Session ends with updated forecast and one nudge commitment.

## C. High-Stakes Scenario Journey (Example: Job Loss)
1. **Trigger**
   - User indicates income loss date and expected severance/benefits.
2. **Scenario setup wizard**
   - Confirms fixed costs, discretionary categories, debt obligations, emergency savings.
3. **Simulation output**
   - Runway estimate under multiple spending modes (baseline, moderate cut, aggressive cut).
   - Month-by-month cash projection and "critical date" flags.
4. **Action plan generation**
   - Immediate: pause non-essential subscriptions, reduce transfer rules, adjust bill due dates where possible.
   - Near-term: debt hardship options checklist, benefit application reminders.
5. **Execution layer**
   - User approves selected actions.
   - AI tracks completion and updates runway automatically.
6. **Follow-up cadence**
   - Twice-weekly check-ins until stable income resumes.

---

## 5) Data Model Outline

## Core Entities
1. **User**
   - `user_id`, locale/country, timezone, risk_profile, consent_flags, notification_prefs.
2. **InstitutionConnection**
   - `connection_id`, `user_id`, provider (Plaid/etc.), status, scopes, last_sync_at, error_state.
3. **Account**
   - `account_id`, `user_id`, `connection_id`, type (checking/credit/investment/loan), currency, current_balance, available_balance.
4. **Transaction**
   - `txn_id`, `account_id`, posted_at, amount, currency, merchant_raw, merchant_normalized, category, confidence, recurring_group_id.
5. **RecurringSeries**
   - `series_id`, merchant/service_name, cadence, next_expected_date, expected_amount_range, type (income/expense).
6. **BudgetEnvelope / SpendingPlan**
   - `plan_id`, period, category_limits, essential_vs_discretionary split.
7. **Goal**
   - `goal_id`, target_amount, target_date, contribution_rule, priority, status.
8. **DebtInstrument**
   - `debt_id`, balance, APR, minimum_payment, due_date, issuer.
9. **SafeToSpendSnapshot**
   - `snapshot_id`, timestamp, horizon (day/week/month), amount, confidence, assumptions_json.
10. **Recommendation**
   - `rec_id`, type, rationale, estimated_impact, confidence, status (proposed/accepted/dismissed/executed).
11. **AgentAction**
   - `action_id`, linked_rec_id, action_type, parameters_json, approval_state, execution_state, failure_reason.
12. **ScenarioSimulation**
   - `sim_id`, scenario_type, input_assumptions, output_metrics_json, created_at, version.
13. **AuditEvent**
   - `event_id`, actor (user/system/agent), object_type, object_id, timestamp, metadata.

## Key Relationships
- One `User` has many `InstitutionConnection`, `Account`, `Goal`, `Recommendation`, `ScenarioSimulation`.
- One `Account` has many `Transaction` and can map to many `RecurringSeries` candidates.
- One `Recommendation` may spawn zero/one/many `AgentAction` executions.
- `SafeToSpendSnapshot` and `ScenarioSimulation` are derived artifacts from transactions, obligations, and user preferences.
- All impactful states are traceable via `AuditEvent`.

---

## 6) AI API/Tooling Capabilities Required

## Read/Data Tools
- `get_accounts(user_id)`
- `get_transactions(user_id, filters)`
- `get_recurring_charges(user_id)`
- `get_upcoming_bills(user_id, horizon)`
- `get_income_patterns(user_id)`
- `get_debts(user_id)`
- `get_goals(user_id)`

## Computation/Planning Tools
- `calculate_safe_to_spend(user_id, horizon, assumptions)`
- `detect_spend_anomalies(user_id, window)`
- `run_debt_optimization(user_id, strategy, extra_payment_budget)`
- `simulate_scenario(user_id, scenario_payload)`
- `estimate_bill_savings(user_id, provider_benchmarks)`

## Action Tools (permissioned)
- `initiate_transfer(from_account, to_account, amount)`
- `schedule_transfer(rule)`
- `cancel_subscription(subscription_id)` (where integrated)
- `start_bill_negotiation(bill_id, mode)`
- `draft_provider_message(template_type, filled_fields)`
- `set_due_date_change_reminder(account_or_bill_id)`

## Governance/Control Tools
- `request_user_approval(action_payload)`
- `check_action_policy(action_payload)`
- `log_advice_and_action_trace(context)`
- `rollback_or_pause_automation(rule_id)`

## Orchestration Requirements
- Tool-call planner that separates:
  - deterministic math,
  - retrieval,
  - user-facing explanation.
- Idempotency keys for all money-moving operations.
- Timeouts and graceful fallbacks for third-party API failures.

---

## 7) Monetization & Pricing Options

## Option A: Freemium + Premium Subscription
- **Free tier**: account aggregation, basic categorization, limited insights.
- **Premium ($8–15/mo equivalent)**: advanced coaching, simulations, agentic actions, custom automations.
- **Pros**: low barrier to adoption, predictable recurring revenue.
- **Cons**: conversion pressure; cost-to-serve AI heavy users.

## Option B: Subscription + Performance-Based Savings Share
- Base subscription + optional success fee on verified bill savings.
- **Pros**: aligns value with outcomes, strong marketing hook.
- **Cons**: operational complexity, attribution disputes, compliance scrutiny.

## Option C: Tiered Plans by Complexity
- Basic / Plus / Pro based on number of connected accounts, scenarios, and automation rules.
- **Pros**: better value capture for power users.
- **Cons**: more pricing friction and packaging overhead.

## Option D: B2B2C via Employers/Financial Institutions
- Per-member licensing for white-labeled wellness offering.
- **Pros**: lower CAC, distribution leverage.
- **Cons**: longer enterprise sales cycles, customization burden.

## Recommended V1 Monetization
- Start with **Option A (Freemium + Premium)** plus paid annual discount.
- Defer savings-share model until action success tracking and legal frameworks mature.

---

## 8) Top 10 Risks & Mitigations

1. **Incorrect financial guidance due to bad/incomplete data**
   - Mitigation: confidence scoring, missing-data prompts, conservative defaults.
2. **Hallucinated explanations eroding trust**
   - Mitigation: force numerical outputs through deterministic engines; cite data sources in UI.
3. **Unauthorized or mistaken transactions**
   - Mitigation: step-up auth, transaction previews, velocity limits, instant pause.
4. **Regulatory overreach into advisory activity**
   - Mitigation: policy guardrails, language controls, legal review workflows.
5. **Aggregator sync instability / broken connections**
   - Mitigation: robust reconnection UX, cached last-known states with staleness labels.
6. **User over-automation leading to loss of control anxiety**
   - Mitigation: progressive automation levels, explain-then-act pattern, easy opt-out.
7. **Security/privacy incident**
   - Mitigation: least-privilege architecture, encryption, red-team testing, incident playbooks.
8. **Poor categorization quality in edge merchants**
   - Mitigation: confidence thresholds, rapid user correction loop, merchant model retraining.
9. **Notification fatigue reducing engagement**
   - Mitigation: nudge throttling, user-tunable alert importance, weekly digest default.
10. **Unit economics pressure from frequent LLM/tool usage**
   - Mitigation: cache summaries, route simple intents to lightweight models, usage-based limits in free tier.

---

## 9) V1 Scope Boundaries (Explicit Non-Goals)
- No direct brokerage trading or security-specific recommendations.
- No tax filing optimization engine.
- No legal document generation.
- No fully autonomous money movement without prior user-defined rules and approvals.

## 10) Suggested V1 Success Metrics
- Activation: % users linking 2+ accounts in first day.
- Insight engagement: weekly active users viewing safe-to-spend and coach insights.
- Action conversion: % recommendations accepted and executed.
- Financial outcomes: median monthly savings identified + realized.
- Trust/safety: action reversal rate, complaint rate, false-alert rate.
- Retention: 4-week and 12-week retention by segment.
