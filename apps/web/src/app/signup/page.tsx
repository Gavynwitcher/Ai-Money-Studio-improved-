import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";
import { getBillingOverview } from "@/lib/server/billing";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: false
  }
};

export default async function SignUpPage({
  searchParams
}: {
  searchParams?: { plan?: string };
}) {
  const billing = await getBillingOverview();
  const defaultPlan =
    searchParams?.plan === "northline_plus" || searchParams?.plan === "pro" || searchParams?.plan === "starter"
      ? searchParams.plan
      : "starter";

  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm
          mode="signup"
          signupOptions={{
            defaultPlan,
            stripeConfigured: billing.stripeConfigured,
            checkoutReadyPlans: billing.checkoutReadyPlans
          }}
        />
      </Container>
    </section>
  );
}
