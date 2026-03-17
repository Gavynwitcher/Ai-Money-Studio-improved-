import type { ComplianceStatus } from "./types";

interface ScoreInput {
  status: ComplianceStatus;
  reasons: string[];
  warnings: string[];
}

const BASE_SCORE: Record<ComplianceStatus, number> = {
  ALLOWED: 100,
  WARNINGS: 80,
  BLOCKED: 40
};

export function calculateComplianceScore({ status, reasons, warnings }: ScoreInput) {
  const base = BASE_SCORE[status];
  const penalty = reasons.length * 15 + warnings.length * 5;
  return Math.max(0, Math.min(100, base - penalty));
}
