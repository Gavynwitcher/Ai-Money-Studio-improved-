"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  LinkedAccount,
  LinkTokenResponse,
  PlaidItemSummary,
  PlaidLinkEvent,
  PlaidTransaction,
  PublicTokenExchangeResponse,
  TransferResponse
} from "@/lib/plaid/types";
import { currency } from "@/lib/utils";

type InstitutionOption = {
  id: string;
  name: string;
  subtitle: string;
};

const institutionOptions: InstitutionOption[] = [
  { id: "inst_chase", name: "Chase", subtitle: "Business operating and reserve accounts" },
  { id: "inst_capital", name: "Capital One", subtitle: "Consumer and small business savings" },
  { id: "inst_boa", name: "Bank of America", subtitle: "Tax and treasury accounts" }
];

export function PlaidConnectFlow() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "token" | "exchange" | "success">("idle");
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionOption>(institutionOptions[0]);
  const [linkToken, setLinkToken] = useState<LinkTokenResponse | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [transactions, setTransactions] = useState<PlaidTransaction[]>([]);
  const [transfer, setTransfer] = useState<TransferResponse | null>(null);
  const [exchange, setExchange] = useState<PublicTokenExchangeResponse | null>(null);
  const [item, setItem] = useState<PlaidItemSummary | null>(null);
  const [events, setEvents] = useState<PlaidLinkEvent[]>([]);
  const [error, setError] = useState("");

  const topAccounts = useMemo(() => accounts.slice(0, 3), [accounts]);
  const topTransactions = useMemo(() => transactions.slice(0, 4), [transactions]);

  async function connectBank() {
    try {
      setError("");
      setEvents([
        {
          name: "OPEN",
          timestamp: new Date().toLocaleTimeString(),
          detail: "Plaid Link opened for sandbox institution selection."
        }
      ]);
      setStep("token");

      const tokenResponse = await fetch("/api/plaid/create-link-token", { method: "POST" });
      const tokenData = (await tokenResponse.json()) as LinkTokenResponse;
      setLinkToken(tokenData);
      setEvents((current) => [
        ...current,
        {
          name: "LINK_TOKEN_CREATED",
          timestamp: new Date().toLocaleTimeString(),
          detail: `Received link_token configured for ${tokenData.products.join(", ")}.`
        }
      ]);

      setStep("exchange");
      const exchangeResponse = await fetch("/api/plaid/exchange-public-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicToken: `public-sandbox-${selectedInstitution.id}`,
          institutionName: selectedInstitution.name
        })
      });

      if (!exchangeResponse.ok) {
        throw new Error("Failed to exchange public token");
      }
      const exchangeData = (await exchangeResponse.json()) as PublicTokenExchangeResponse;
      setExchange(exchangeData);
      setEvents((current) => [
        ...current,
        {
          name: "ON_SUCCESS",
          timestamp: new Date().toLocaleTimeString(),
          detail: `public_token exchanged for Item ${exchangeData.itemId}.`
        }
      ]);

      const [accountsResponse, transactionsResponse, itemResponse] = await Promise.all([
        fetch("/api/plaid/accounts"),
        fetch("/api/plaid/transactions"),
        fetch("/api/plaid/item")
      ]);

      const fetchedAccounts = (await accountsResponse.json()) as {
        accounts: LinkedAccount[];
        item: PlaidItemSummary | null;
      };
      const fetchedTransactions = (await transactionsResponse.json()) as { transactions: PlaidTransaction[] };
      const fetchedItem = (await itemResponse.json()) as { item: PlaidItemSummary | null };

      setAccounts(fetchedAccounts.accounts);
      setTransactions(fetchedTransactions.transactions);
      setItem(fetchedItem.item ?? fetchedAccounts.item);
      setEvents((current) => [
        ...current,
        {
          name: "ACCOUNTS_GET",
          timestamp: new Date().toLocaleTimeString(),
          detail: `${fetchedAccounts.accounts.length} accounts normalized from the Item.`
        }
      ]);

      const reviewTransfer = await fetch("/api/plaid/initiate-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAccountId: "acc_reserve",
          toAccountId: "acc_ops",
          amount: 2500
        })
      });
      const transferData = (await reviewTransfer.json()) as TransferResponse;
      setTransfer(transferData);
      setEvents((current) => [
        ...current,
        {
          name: "TRANSFER_REVIEW",
          timestamp: new Date().toLocaleTimeString(),
          detail: `Created a mock transfer review for ${currency(transferData.amount)}.`
        }
      ]);

      setStep("success");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to connect bank");
      setStep("idle");
    }
  }

  return (
    <>
      <Card className="rounded-[32px]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="teal">Mock Plaid Link journey</Badge>
            <h3 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
              Connect your bank with a production-ready handoff point.
            </h3>
            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              This interaction now mirrors the Plaid Quickstart more closely: create a `link_token`,
              launch Link, receive a `public_token` in `onSuccess`, exchange it for an `access_token`
              and `item_id`, then call account and transaction endpoints from the server.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="cursor-pointer"
              variant="secondary"
              href="#developer-placeholder"
            >
              View developer placeholder
            </Button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(10,37,64,0.22)]"
              onClick={() => setModalOpen(true)}
            >
              Connect your bank
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Link token state</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {linkToken
                ? `${linkToken.environment} environment · ${linkToken.mockMode ? "mock" : "live"}`
                : "No token created yet"}
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Accounts loaded</p>
            <p className="mt-3 text-sm text-[var(--muted)]">{accounts.length} linked account records ready for UI rendering</p>
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Transfer preview</p>
            <p className="mt-3 text-sm text-[var(--muted)]">{transfer ? `${currency(transfer.amount)} · ${transfer.status}` : "Transfer review not created yet"}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Sandbox credentials</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>Username: `user_good`</p>
              <p>Password: `pass_good`</p>
              <p>MFA code: `1234`</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Link callbacks</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--muted)]">
              <p>`onSuccess` returns `public_token` and metadata.</p>
              <p>`onExit` captures user exits and request IDs.</p>
              <p>`onEvent` can stream Link lifecycle events for analytics and support.</p>
            </div>
          </div>
          <div className="rounded-[24px] border border-[var(--line)] bg-white/80 p-5">
            <p className="text-sm font-semibold text-[var(--navy)]">Quickstart products</p>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {linkToken ? linkToken.products.join(", ") : "auth, transactions, transfer"}
            </p>
          </div>
        </div>

        {step === "success" ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[rgba(30,142,99,0.18)] bg-[rgba(30,142,99,0.08)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--success)]">Connection complete</p>
              <h4 className="mt-3 font-heading text-2xl font-semibold text-[var(--navy)]">
                {selectedInstitution.name} linked successfully
              </h4>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                The demo immediately hydrates linked accounts, recent transactions, Item details,
                and a sample transfer review state.
              </p>
            </div>
            <div className="rounded-[28px] border border-[var(--line)] bg-white/80 p-6">
              <p className="text-sm font-semibold text-[var(--navy)]">Transfer review state</p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                {transfer?.eta || "Pending transfer configuration"} with a modeled fee of {currency(transfer?.fee || 0)}.
              </p>
              {exchange ? (
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                  Token exchange result: {exchange.accessTokenPreview} for {exchange.itemId}.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {topAccounts.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[var(--line)] bg-white/85 p-6">
              <h4 className="font-heading text-2xl font-semibold text-[var(--navy)]">`/accounts/get` sample</h4>
              <div className="mt-5 grid gap-3">
                {topAccounts.map((account) => (
                  <div key={account.id} className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 p-4">
                    <p className="font-medium text-[var(--navy)]">
                      {account.institutionName} · {account.name}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {account.type} / {account.subtype} · •••• {account.mask}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[var(--navy)]">{currency(account.currentBalance)}</p>
                    {account.officialName ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">{account.officialName}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-white/85 p-6">
              <h4 className="font-heading text-2xl font-semibold text-[var(--navy)]">Recent transactions</h4>
              <div className="mt-5 grid gap-3">
                {topTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-slate-50/80 p-4">
                    <div>
                      <p className="font-medium text-[var(--navy)]">{transaction.merchant}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {transaction.category} · {transaction.accountName}
                      </p>
                    </div>
                    <p className="font-semibold text-[var(--navy)]">{currency(transaction.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {(item || events.length > 0) && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[28px] border border-[var(--line)] bg-white/85 p-6">
              <h4 className="font-heading text-2xl font-semibold text-[var(--navy)]">Item summary</h4>
              {item ? (
                <div className="mt-5 space-y-3 text-sm text-[var(--muted)]">
                  <p>Item ID: {item.itemId}</p>
                  <p>Institution: {item.institutionName} ({item.institutionId})</p>
                  <p>Billed products: {item.billedProducts.join(", ")}</p>
                  <p>Available products: {item.availableProducts.join(", ")}</p>
                  <p>Webhook: {item.webhook || "Not configured"}</p>
                  <p>Access token state: {item.accessTokenStatus}</p>
                </div>
              ) : (
                <p className="mt-5 text-sm text-[var(--muted)]">No Item created yet.</p>
              )}
            </div>

            <div className="rounded-[28px] border border-[var(--line)] bg-white/85 p-6">
              <h4 className="font-heading text-2xl font-semibold text-[var(--navy)]">Link event trail</h4>
              <div className="mt-5 grid gap-3">
                {events.map((event) => (
                  <div key={`${event.name}-${event.timestamp}`} className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--navy)]">{event.name}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">{event.timestamp}</p>
                    </div>
                    <p className="mt-2 text-sm text-[var(--muted)]">{event.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {error ? <p className="mt-6 text-sm text-[var(--danger)]">{error}</p> : null}
      </Card>

      {modalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(7,17,31,0.45)] p-5">
          <div className="w-full max-w-2xl rounded-[32px] border border-[var(--line)] bg-white p-6 shadow-[0_30px_100px_rgba(8,23,41,0.24)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Mock Plaid Link</p>
                <h3 className="mt-2 font-heading text-3xl font-semibold text-[var(--navy)]">Choose an institution</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--navy)]"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              {institutionOptions.map((institution) => (
                <button
                  key={institution.id}
                  type="button"
                  className={`rounded-[24px] border p-4 text-left transition ${
                    selectedInstitution.id === institution.id
                      ? "border-[var(--teal)] bg-[rgba(26,139,141,0.08)]"
                      : "border-[var(--line)] bg-slate-50/80"
                  }`}
                  onClick={() => setSelectedInstitution(institution)}
                >
                  <p className="font-medium text-[var(--navy)]">{institution.name}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{institution.subtitle}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-[24px] border border-dashed border-[var(--line-strong)] bg-slate-50/80 p-4 text-sm leading-7 text-[var(--muted)]" id="developer-placeholder">
              Developer placeholder: replace this modal with Plaid Link, initialize it with the
              `link_token` from `/api/plaid/create-link-token`, handle `onSuccess`, `onExit`, and `onEvent`,
              then pass the returned `public_token` to `/api/plaid/exchange-public-token`. The route files in
              this project mark the exact handoff points for `/link/token/create`, `/item/public_token/exchange`,
              Item persistence, `/accounts/get`, transaction sync, and transfer initiation.
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white"
                onClick={async () => {
                  await connectBank();
                  setModalOpen(false);
                }}
              >
                Link selected institution
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[var(--line)] px-5 py-3 text-sm font-semibold text-[var(--navy)]"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
