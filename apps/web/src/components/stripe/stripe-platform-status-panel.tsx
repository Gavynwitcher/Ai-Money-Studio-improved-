import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStripePlatformStatus } from "@/lib/server/stripePlatform";

function toneForCapability(value: string) {
  if (value === "active") return "success";
  if (value === "pending") return "warning";
  if (value === "inactive" || value === "unsupported") return "warning";
  return "teal";
}

export async function StripePlatformStatusPanel() {
  const status = await getStripePlatformStatus();

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="rounded-[32px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Stripe transfer rail check
            </p>
            <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Transfer capability
            </h3>
          </div>
          <Badge tone={status.transfers.treasuryReady ? "success" : "warning"}>
            {status.transfers.treasuryReady ? "Treasury ready" : "Partial"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Connect transfers capability</p>
            <Badge tone={toneForCapability(status.transfers.connectTransfersCapability)}>
              {status.transfers.connectTransfersCapability}
            </Badge>
          </div>
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Treasury capability</p>
            <Badge tone={toneForCapability(status.transfers.treasuryCapability)}>
              {status.transfers.treasuryCapability}
            </Badge>
          </div>
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Connected accounts</p>
            <p className="text-sm font-semibold text-[var(--navy)]">{status.connectedAccountsCount}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">{status.transfers.summary}</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{status.transfers.nextStep}</p>
        </div>
      </Card>

      <Card className="rounded-[32px]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
              Stripe credit program check
            </p>
            <h3 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Credit capability
            </h3>
          </div>
          <Badge tone={status.credit.capitalForPlatformsReady ? "success" : "warning"}>
            {status.credit.capitalForPlatformsReady ? "Capital-ready" : "Blocked"}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Capital for platforms</p>
            <Badge tone={status.credit.capitalForPlatformsReady ? "success" : "warning"}>
              {status.credit.capitalForPlatformsReady ? "Possible" : "Not ready"}
            </Badge>
          </div>
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Issuing Credit</p>
            <Badge tone={status.credit.issuingCreditReady ? "success" : "warning"}>
              {status.credit.issuingCreditReady ? "Enabled" : "Preview only"}
            </Badge>
          </div>
          <div className="ledger-row flex items-center justify-between rounded-[22px] px-4 py-3">
            <p className="text-sm font-medium text-[var(--navy)]">Stripe account type</p>
            <p className="text-sm font-semibold text-[var(--navy)]">{status.accountType ?? "unknown"}</p>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-slate-50/80 p-5">
          <p className="text-sm font-semibold text-[var(--navy)]">{status.credit.summary}</p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{status.credit.nextStep}</p>
        </div>
      </Card>
    </div>
  );
}
