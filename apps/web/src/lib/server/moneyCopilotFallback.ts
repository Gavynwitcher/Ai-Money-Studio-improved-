export function isDbUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Schema engine error") ||
    message.includes("P1001") ||
    message.includes("ECONNREFUSED")
  );
}

export function fallbackDashboardPayload() {
  return {
    kpis: [
      {
        label: "Safe To Spend (This Week)",
        value: 0,
        change: "Awaiting live data",
        tone: "neutral" as const
      },
      {
        label: "Forecasted Month-End Cushion",
        value: 0,
        change: "Awaiting live data",
        tone: "neutral" as const
      },
      {
        label: "Avoidable Cost Opportunities",
        value: 0,
        change: "Awaiting live data",
        tone: "neutral" as const
      },
      {
        label: "Debt Utilization",
        value: 0,
        change: "Awaiting live data",
        tone: "neutral" as const
      }
    ],
    upcomingBills: [],
    recommendations: []
  };
}

export function fallbackTransactionsPayload(limit = 200) {
  return {
    transactions: []
  };
}

export function fallbackActionsPayload() {
  return {
    actions: []
  };
}
