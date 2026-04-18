import { featureFlags } from "@/lib/feature-flags";

export const navigation = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/dashboard-demo", label: "Dashboard Demo" },
  { href: "/plaid-integration", label: "Plaid Flow" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/contact", label: "Contact" }
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
      "Surface total cash position, account-level balances, and quick cash movement cues from a single dashboard.",
    bullets: ["Cash position summary", "Available vs. current balance", "Low-balance and deposit alerts"]
  },
  {
    title: "Transaction history and summaries",
    status: featureFlags.transactions,
    description:
      "Categorize activity, monitor recurring spend, and give owners or households a simpler way to understand flow across institutions.",
    bullets: ["Recent transactions feed", "Category summaries", "Cash in / cash out snapshots"]
  },
  {
    title: "Transfer workflows between linked institutions",
    status: featureFlags.transfers,
    description:
      "Provide a compliant, guided workflow for moving funds between approved linked accounts as capabilities mature.",
    bullets: ["Transfer initiation flow", "Fee visibility", "Transfer status timeline"]
  },
  {
    title: "Debt assistance tools",
    status: featureFlags.debtAssistance,
    description:
      "Planned budgeting and payoff coaching that helps users understand balances, due dates, and debt reduction options.",
    bullets: ["Debt roadmap", "Payment priority prompts", "Guided payoff planning"]
  },
  {
    title: "Credit repair assistant",
    status: featureFlags.creditRepair,
    description:
      "Planned education and action checklists that help users work through credit report issues without overpromising outcomes.",
    bullets: ["Dispute workflow guidance", "Action checklists", "Education library"]
  },
  {
    title: "Credit monitoring",
    status: featureFlags.creditMonitoring,
    description:
      "Future notifications and score-trend reporting designed to keep users aware of major changes over time.",
    bullets: ["Score change alerts", "Trend history", "Monitoring overview"]
  },
  {
    title: "Credit simulation",
    status: featureFlags.creditSimulation,
    description:
      "Planned scenario tools that estimate how utilization or payoff changes may influence credit profile directionally.",
    bullets: ["What-if simulator", "Utilization scenarios", "Education-first forecasts"]
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
      "Unified Banking Hub consolidates balances, account health, and transaction activity into one dashboard built for clarity."
  },
  {
    step: "03",
    title: "Take action with guided money movement",
    copy:
      "Users can review a transfer path, expected timing, and fees before initiating supported movement between linked institutions."
  },
  {
    step: "04",
    title: "Grow into financial wellness tools",
    copy:
      "As the product expands, users unlock debt support, credit insight tools, and additional online banking assistance."
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
      "The MVP copy avoids unsupported claims and clearly labels transfer capabilities and advanced services as subject to review and future approvals."
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
      "Track operating cash across payroll, reserve, and tax accounts without paying for enterprise treasury tooling."
  },
  {
    title: "Everyday consumers",
    copy:
      "Monitor checking, savings, and spending accounts from multiple banks without piecing together separate logins."
  },
  {
    title: "Cost-sensitive users",
    copy:
      "Choose a lightweight free or starter path first, then upgrade only when premium insights or transfer features matter."
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
    name: "Starter",
    price: "$0",
    subtitle: "Free trial for early users validating account visibility",
    cta: "Start free",
    accent: false,
    bullets: [
      "Up to 2 connected institutions",
      "Unified balances dashboard",
      "Basic transaction feed",
      "Waitlist access for transfer features"
    ]
  },
  {
    name: "Hub Plus",
    price: "$19/mo",
    subtitle: "Premium plan for multi-account households and small businesses",
    cta: "Choose Hub Plus",
    accent: true,
    bullets: [
      "Unlimited connected institutions",
      "Cash flow summaries and alerts",
      "Priority support and onboarding analytics",
      "Early access to money movement workflows"
    ]
  },
  {
    name: "Transfer Flex",
    price: "From $2",
    subtitle: "Pay-as-you-go path for users who want transfer access without a full subscription",
    cta: "View transfer pricing",
    accent: false,
    bullets: [
      "Per-transfer fee model",
      "Transparent fee preview",
      "Status tracking and transfer history",
      "Subject to feature availability and compliance review"
    ]
  }
];

export const comparisonRows = [
  {
    label: "Connected institutions",
    starter: "2",
    plus: "Unlimited",
    flex: "Up to linked institutions"
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
    flex: "Basic"
  },
  {
    label: "Transfer initiation",
    starter: "Waitlist",
    plus: "Priority access",
    flex: "Per transfer"
  },
  {
    label: "Credit and debt tools",
    starter: "Planned",
    plus: "Planned",
    flex: "Planned"
  }
];

export const faqs = [
  {
    question: "How does account linking work?",
    answer:
      "Users launch a secure Plaid-powered connection flow, choose their financial institution, authenticate with that provider, and select which accounts to share with Unified Banking Hub."
  },
  {
    question: "Can users move money between banks today?",
    answer:
      "The MVP demonstrates a transfer workflow and can be wired to supported Plaid transfer capabilities later. Production rollout would remain subject to compliance, approvals, and product readiness."
  },
  {
    question: "What is available now versus later?",
    answer:
      "Account aggregation, balances visibility, dashboard insights, pricing exploration, and the Plaid linking demo are available in the MVP. Debt assistance, credit repair guidance, monitoring, and score simulation are planned features."
  },
  {
    question: "How does pricing work?",
    answer:
      "The product supports a free entry path, a monthly subscription for broader usage and premium insights, and a transfer-fee option for users who prefer pay-as-you-go access."
  },
  {
    question: "Is Unified Banking Hub a bank?",
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
      { href: "/dashboard-demo", label: "Dashboard Demo" },
      { href: "/plaid-integration", label: "Plaid Integration" },
      { href: "/pricing", label: "Pricing" }
    ]
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/security", label: "Security" },
      { href: "/contact", label: "Contact" },
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
