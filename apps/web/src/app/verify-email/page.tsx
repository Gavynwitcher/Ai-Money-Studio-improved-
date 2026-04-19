import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Verify Email",
  robots: {
    index: false,
    follow: false
  }
};

export default function VerifyEmailPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="verify" />
      </Container>
    </section>
  );
}
