import { featureFlags } from "@/lib/feature-flags";

export const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/accounts", label: "Accounts" },
  { href: "/transactions", label: "Transactions" },
  { href: "/cash-flow", label: "Cash Flow" },
  { href: "/insights", label: "Insights" },
  { href: "/plaid-integration", label: "Connect" },
  { href: "/assistant", label: "AI" },
  { href: "/pricing", label: "Pricing" },
  { href: "/settings", label: "Settings" }
];

export const featureCategories = [
  {
    title: "Multi-bank account aggregation",
    status: featureFlags.aggregation,
    description:
      "Bring checking, savings, and business operating accounts into one view so users stop hopping between bank portals.",
    bullets: ["Connect multiple institutions", "Unified account cards", "Institution-level health status"]
  },
  {
    title: "Real-time balance visibility",
    status: featureFlags.balances,
    description:
      "Surface total cash position, account-level balances, and read-only account context from a single dashboard.",
    bullets: ["Cash position summary", "Available vs. current balance", "Account status context"]
  },
  {
    title: "Transaction history and summaries",
    status: featureFlags.transactions,
    description:
      "Categorize activity, monitor recurring spend, and give owners or households a simpler way to understand flow across institutions.",
    bullets: ["Recent transactions feed", "Category summaries", "Cash in / cash out snapshots"]
  },
  {
    title: "Cash-flow insights",
    status: featureFlags.cashFlow,
    description:
      "Summarize inflow, outflow, net cash flow, category pressure, larger expenses, and recurring transaction candidates.",
    bullets: ["30-day inflow and outflow", "Top categories", "Recurring activity candidates"]
  },
  {
    title: "AI transaction review",
    status: featureFlags.aiInsights,
    description:
      "Generate informational summaries from imported Plaid transaction rows for the signed-in user only.",
    bullets: ["Source-limited context", "Confidence language", "No regulated advice"]
  }
];

export const howItWorks = [
  {
    step: "01",
    title: "Connect institutions securely",
    copy:
      "Users launch a Plaid-powered linking flow, pick their bank, and authorize the account connections they want included."
  },
  {
    step: "02",
    title: "See balances and transactions in one place",
    copy:
      "Northline consolidates balances, account health, and transaction activity into one dashboard built for clarity."
  },
  {
    step: "03",
    title: "Understand cash flow",
    copy:
      "Users can review transaction patterns, recurring expenses, category pressure, and what changed across their accounts."
  },
  {
    step: "04",
    title: "Review read-only AI insights",
    copy:
      "Northline AI summarizes imported transaction activity for informational review without tax, legal, investment, credit, or lending advice."
  }
];

export const trustPillars = [
  {
    title: "Built around secure third-party connectivity",
    copy:
      "Plaid-powered account linking is positioned as the secure bridge for institution connectivity while the product focuses on user experience and orchestration."
  },
  {
    title: "Careful compliance positioning",
    copy:
      "Northline v1 is read-only. It does not hold funds, initiate bank actions, provide tax advice, repair credit, or approve lending."
  },
  {
    title: "Transparent product staging",
    copy:
      "Users can see what is available now, what is in the MVP, and what is planned, which helps investors and testers evaluate the roadmap honestly."
  }
];

export const audienceCards = [
  {
    title: "Small business owners",
    copy:
      "Monitor operating, reserve, payroll, and tax-account activity without paying for enterprise finance tooling."
  },
  {
    title: "Everyday consumers",
    copy:
      "Monitor checking, savings, and spending accounts from multiple banks without piecing together separate logins."
  },
  {
    title: "Cost-sensitive users",
    copy:
      "Choose a lightweight free or starter path first, then upgrade only when premium visibility and support features matter."
  }
];

export const testimonials = [
  {
    quote:
      "This feels like the first multi-bank product that respects smaller operators. I can see cash clearly without paying enterprise software prices.",
    name: "Maya Chen",
    role: "Owner, Harbor Lane Studio"
  },
  {
    quote:
      "The dashboard makes it obvious where our balances sit and which accounts need attention. It’s polished enough for investor demos and early pilots.",
    name: "Andre Lewis",
    role: "Founder, Northfield Services"
  },
  {
    quote:
      "I want one place for my household accounts and future credit tools. The flow is simple and the language doesn’t feel intimidating.",
    name: "Leah Patel",
    role: "Consumer beta waitlist"
  }
];

export const pricingPlans = [
  {
    key: "starter",
    name: "Starter",
    price: "$0",
    subtitle: "Free trial for early users validating account visibility",
    cta: "Start free",
    accent: false,
    bullets: [
      "Up to 2 connected institutions",
      "Basic transaction view",
      "Read-only account overview",
      "Connection and sync status"
    ]
  },
  {
    key: "northline_plus",
    name: "Northline Plus",
    price: "$19/mo",
    subtitle: "Premium plan for multi-account households and small businesses",
    cta: "Choose Northline Plus",
    accent: true,
    bullets: [
      "Unlimited connected institutions",
      "Cash-flow summaries",
      "AI transaction insights",
      "Recurring expense detection"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    price: "$39/mo",
    subtitle: "Advanced read-only insights for operators who need deeper financial review.",
    cta: "Choose Pro",
    accent: false,
    bullets: [
      "Advanced insights",
      "CSV export planning",
      "Tax reserve tracking",
      "Priority onboarding support"
    ]
  }
];

export type PricingPlan = (typeof pricingPlans)[number];

export const comparisonRows = [
  {
    label: "Connected institutions",
    starter: "2",
    plus: "Unlimited",
    flex: "Unlimited"
  },
  {
    label: "Balances dashboard",
    starter: "Included",
    plus: "Included",
    flex: "Included"
  },
  {
    label: "Categorized transactions",
    starter: "Basic",
    plus: "Advanced",
    flex: "Advanced"
  },
  {
    label: "AI transaction insights",
    starter: "Limited",
    plus: "Included",
    flex: "Advanced"
  },
  {
    label: "Tax reserve tracking",
    starter: "Not included",
    plus: "Basic estimate",
    flex: "Advanced estimate"
  }
];

export const faqs = [
  {
    question: "How does account linking work?",
    answer:
      "Users launch a secure Plaid-powered connection flow, choose their financial institution, authenticate with that provider, and select which accounts to share with Northline."
  },
  {
    question: "Can users move money between banks today?",
    answer:
      "No. Northline v1 is read-only. It helps users connect accounts, review imported transactions, and understand cash flow."
  },
  {
    question: "What is available now versus later?",
    answer:
      "Account aggregation, balances visibility, transaction review, cash-flow summaries, pricing, and Plaid linking are the v1 focus. Staged products remain hidden until they are ready for review."
  },
  {
    question: "How does pricing work?",
    answer:
      "The product supports a free entry path plus monthly Plus and Pro plans for broader read-only usage, cash-flow summaries, AI insights, and exports."
  },
  {
    question: "Is Northline a bank?",
    answer:
      "No. The platform is positioned as a financial connectivity and money-management experience powered by secure third-party integrations. It does not replace a chartered bank."
  },
  {
    question: "Can small businesses use it?",
    answer:
      "Yes. The MVP messaging and workflows are designed for both consumers and smaller businesses that manage funds across multiple institutions."
  }
];

export const legalLinks = [
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/disclaimer", label: "Disclaimer" }
];

export const footerColumns = [
  {
    title: "Platform",
    links: [
      { href: "/features", label: "Features" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/transactions", label: "Transactions" },
      { href: "/plaid-integration", label: "Connect" },
      { href: "/pricing", label: "Pricing" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/security", label: "Trust" },
      { href: "/contact", label: "Support" },
      { href: "/faq", label: "FAQ" }
    ]
  },
  {
    title: "Access",
    links: [
      { href: "/signin", label: "Sign in" },
      { href: "/signup", label: "Sign up" },
      { href: "/forgot-password", label: "Forgot password" },
      { href: "/verify-email", label: "Verify email" }
    ]
  }
];
