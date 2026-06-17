import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";

export const metadata: Metadata = {
  title: "Account Settings",
  robots: {
    index: false,
    follow: false
  }
};

async function deleteAccount() {
  "use server";

  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    redirect("/signin?callbackUrl=/account");
  }

  await prisma.user.delete({
    where: { email }
  });

  redirect("/signin?accountDeleted=1");
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/account");
  }

  return (
    <>
      <PageHero
        eyebrow="Account settings"
        title="Manage your Northline beta account."
        description="Review your account access, manage billing, unlink connected bank data, and request deletion when needed."
        primaryCta={{ href: "/pricing", label: "Manage billing" }}
        secondaryCta={{ href: "/plaid-integration", label: "Manage bank linking" }}
      />

      <section className="page-section pt-0">
        <Container>
          <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">Profile</h2>
              <div className="mt-6 grid gap-4 text-sm text-[var(--muted)]">
                <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4">
                  <p className="font-semibold text-[var(--navy)]">Signed in as</p>
                  <p className="mt-1">{session.user.email}</p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-white/80 p-4">
                  <p className="font-semibold text-[var(--navy)]">Private beta scope</p>
                  <p className="mt-1 leading-7">
                    Northline currently supports account linking, balances, transaction visibility, billing, support,
                    unlinking, and deletion controls. Transfer, lending, and credit workflows are not enabled.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[32px]">
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">Data controls</h2>
              <div className="mt-6 grid gap-3">
                <Button href="/plaid-integration" variant="secondary">
                  Review bank connections
                </Button>
                <Button href="/contact" variant="secondary">
                  Contact support
                </Button>
                <Link href="/legal/privacy" className="text-sm font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
                  Read privacy policy
                </Link>
              </div>

              <form action={deleteAccount} className="mt-8 rounded-[24px] border border-red-200 bg-red-50 p-5">
                <h3 className="font-heading text-xl font-semibold text-red-950">Delete account</h3>
                <p className="mt-3 text-sm leading-7 text-red-900">
                  This permanently deletes your Northline user record and cascaded app data in this database. If you have
                  active billing, cancel it through Stripe before deleting the account.
                </p>
                <button
                  type="submit"
                  className="mt-5 rounded-[18px] bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  Delete my Northline account
                </button>
              </form>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
}
