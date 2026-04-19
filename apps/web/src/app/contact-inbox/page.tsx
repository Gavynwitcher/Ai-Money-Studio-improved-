import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { authOptions } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { getContactInbox } from "@/lib/server/contact";

export const metadata: Metadata = {
  ...buildMetadata({
    title: "Contact Inbox",
    description: "Internal inbox for contact inquiries and owner notifications.",
    path: "/contact-inbox"
  }),
  robots: {
    index: false,
    follow: false
  }
};

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export default async function ContactInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/contact-inbox");
  }

  const inquiries = await getContactInbox();

  return (
    <>
      <PageHero
        eyebrow="Internal inbox"
        title="Review inbound contact requests and owner alert status."
        description="This protected inbox shows every contact inquiry captured by the application, along with whether the owner notification email was delivered."
        primaryCta={{ href: "/contact", label: "Open contact page" }}
        secondaryCta={{ href: "/dashboard-demo", label: "Back to dashboard demo" }}
      />

      <section className="page-section pt-0">
        <Container>
          <Card className="rounded-[32px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                  Contact requests
                </h2>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  Signed in as {session.user.email}. Owner alert emails are routed to `sales@hibark.com` unless overridden in environment settings.
                </p>
              </div>
              <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                {inquiries.length} total
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              {inquiries.length > 0 ? (
                inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="rounded-[26px] border border-[var(--line)] bg-white/80 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--teal)]">
                          Ref {inquiry.reference}
                        </p>
                        <h3 className="mt-2 font-heading text-2xl font-semibold text-[var(--navy)]">
                          {inquiry.name}
                        </h3>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {inquiry.email}
                          {inquiry.company ? ` · ${inquiry.company}` : ""}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted)]">Submitted {formatTimestamp(inquiry.createdAt)}</p>
                      </div>

                      <div className="grid gap-2 text-right">
                        <div className="rounded-full bg-[rgba(25,106,117,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--ocean)]">
                          Inquiry {inquiry.status}
                        </div>
                        <div
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                            inquiry.ownerAlertStatus === "sent"
                              ? "bg-[rgba(30,142,99,0.12)] text-[var(--success)]"
                              : inquiry.ownerAlertStatus === "failed"
                                ? "bg-[rgba(178,67,67,0.12)] text-[var(--danger)]"
                                : "bg-[rgba(185,111,25,0.12)] text-[var(--warning)]"
                          }`}
                        >
                          Owner alert {inquiry.ownerAlertStatus.replace(/_/g, " ")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Customer message</p>
                        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{inquiry.message}</p>
                      </div>
                      <div className="rounded-[22px] border border-[var(--line)] bg-slate-50/80 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Owner delivery</p>
                        <p className="mt-3 text-sm text-[var(--navy)]">{inquiry.ownerAlertEmail}</p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          {inquiry.ownerAlertSentAt
                            ? `Sent ${formatTimestamp(inquiry.ownerAlertSentAt)}`
                            : "Not yet delivered"}
                        </p>
                        {inquiry.ownerAlertError ? (
                          <p className="mt-2 text-sm text-[var(--danger)]">{inquiry.ownerAlertError}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      {inquiry.notifications.map((notification) => (
                        <div key={notification.id} className="rounded-[18px] border border-[var(--line)] bg-white px-4 py-3">
                          <p className="text-sm font-semibold text-[var(--navy)]">{notification.title}</p>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{notification.message}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-500">
                            {notification.channel.replace(/_/g, " ")} · {formatTimestamp(notification.sentAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--line-strong)] bg-slate-50 px-4 py-4 text-sm text-[var(--muted)]">
                  No contact submissions yet.
                </div>
              )}
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
