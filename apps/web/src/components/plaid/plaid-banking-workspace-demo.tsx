const demoAccounts = [
  { name: "Plaid Checking", subtype: "checking", mask: "0000", current: 110, available: 100 },
  { name: "Plaid Saving", subtype: "savings", mask: "1111", current: 210, available: 200 },
  { name: "Plaid CD", subtype: "cd", mask: "2222", current: 1000, available: 1000 },
  { name: "Plaid Credit Card", subtype: "credit card", mask: "3333", current: 410, available: 410 },
  { name: "Plaid Money Market", subtype: "money market", mask: "4444", current: 43200, available: 43200 },
  { name: "Plaid IRA", subtype: "ira", mask: "5555", current: 320.76, available: 320.76 },
  { name: "Plaid 401k", subtype: "401k", mask: "6666", current: 23631.98, available: 23631.98 },
  { name: "Plaid Student Loan", subtype: "student", mask: "7777", current: 65262.8, available: 65262.8 }
];

const demoTransactions = [
  { merchant: "United Airlines", category: "Travel", amount: 500, date: "Jun 8", direction: "outflow" },
  { merchant: "Uber", category: "Transportation", amount: 6.33, date: "Jun 7", direction: "outflow" },
  { merchant: "Touchstone Climbing", category: "Fitness", amount: 78.5, date: "Jun 6", direction: "outflow" },
  { merchant: "Payroll Deposit", category: "Income", amount: 3250, date: "Jun 5", direction: "inflow" }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function PlaidBankingWorkspaceDemo() {
  const totalBalance = 213535.8;
  const availableCash = 213475.8;

  return (
    <section className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(180deg,#f6f9fc_0%,#eef4fb_48%,#ffffff_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.08)]">
      <div className="rounded-[28px] bg-[linear-gradient(135deg,#081628_0%,#0f2742_58%,#163d63_100%)] px-6 py-7 text-white md:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
            Bank interconnectivity
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
            Sandbox
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="font-heading text-4xl font-semibold tracking-[-0.05em]">
              Connect institutions once and manage them from one banking workspace
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200">
              Northline keeps account linking, balance imports, and transaction sync in one guided flow so moving from
              first connection to multi-bank visibility feels fast and predictable.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_45px_rgba(8,22,40,0.18)]">
              Sync now
            </button>
            <button className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white">
              Add another bank
            </button>
            <button className="rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white">
              Refresh bank data
            </button>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Connection status</p>
            <h3 className="mt-4 font-heading text-2xl font-semibold">Accounts connected</h3>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              Your connected institutions are live. Add another bank or refresh balances anytime.
            </p>
            <div className="mt-5 inline-flex rounded-[20px] border border-white/70 px-5 py-4 text-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">Last sync</p>
                <p className="mt-2 text-lg font-semibold">Jun 8, 8:35 PM</p>
                <p className="mt-2 text-xs text-slate-200">Coverage May 10, 2026 to Jun 9, 2026</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {[
                ["01", "Link bank", "1 institution connected"],
                ["02", "Import balances", "12 accounts imported"],
                ["03", "Review activity", "17 transactions ready"]
              ].map(([step, title, copy]) => (
                <div key={step} className="rounded-[20px] border border-teal-300/30 bg-teal-300/10 p-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300 text-xs font-bold text-slate-950">
                      {step}
                    </span>
                    <p className="font-semibold">{title}</p>
                  </div>
                  <p className="mt-4 text-sm text-slate-200">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Institutions</p>
              <p className="mt-3 text-4xl font-semibold">1</p>
              <p className="mt-3 text-sm text-slate-200">Tartan Bank</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Accounts found</p>
              <p className="mt-3 text-4xl font-semibold">12</p>
              <p className="mt-3 text-sm text-slate-200">Available cash {formatCurrency(availableCash)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">Transaction history</p>
              <p className="mt-3 text-4xl font-semibold">17</p>
              <p className="mt-3 text-sm text-slate-200">Coverage: transactions · 1 active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(8,22,40,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Institution snapshot</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">
                Connected banking relationships
              </h3>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              Secure connection ready
            </span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Connected banks</p>
                <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)]">
                  Add another bank
                </button>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-950">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Tartan Bank
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Each Plaid Link session adds another institution without interrupting the banks that are already connected.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Connection health</p>
              <p className="mt-4 text-xl font-semibold text-slate-950">Verified 0 · Pending 0</p>
              <p className="mt-3 text-sm text-slate-600">Transfer-ready accounts: 0</p>
              <button className="mt-5 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                Disconnect all
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(8,22,40,0.04)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Banking snapshot</p>
              <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">Linked account balances</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              12 accounts
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total balance</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Available cash</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatCurrency(availableCash)}</p>
            </div>
          </div>
          <div className="mt-5 max-h-[420px] space-y-3 overflow-auto pr-1">
            {demoAccounts.map((account) => (
              <div key={account.mask} className="rounded-[20px] border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{account.name}</p>
                    <p className="mt-1 text-sm text-slate-500">Tartan Bank · {account.subtype} · •••• {account.mask}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-950">{formatCurrency(account.current)}</p>
                    <p className="mt-1 text-xs text-slate-500">Available {formatCurrency(account.available)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 px-6 pb-6 lg:grid-cols-2">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Transaction history</p>
          <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">Recent categorized activity</h3>
          <div className="mt-5 space-y-3">
            {demoTransactions.map((transaction) => (
              <div key={`${transaction.merchant}-${transaction.date}`} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-950">{transaction.merchant}</p>
                  <p className="mt-1 text-sm text-slate-500">{transaction.category} · {transaction.date}</p>
                </div>
                <p className={transaction.direction === "inflow" ? "font-semibold text-emerald-700" : "font-semibold text-slate-950"}>
                  {transaction.direction === "inflow" ? "+" : "-"}{formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Security and controls</p>
          <h3 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">Clear controls for every connection</h3>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-slate-600">
            <p>Bank login handled by Plaid. Northline does not store bank usernames or passwords.</p>
            <p>Data is encrypted in transit and visible only inside the connected workspace.</p>
            <p>Users can refresh bank data, add another institution, or disconnect accounts when needed.</p>
            <p>Advanced money movement features remain planned and subject to compliance review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
