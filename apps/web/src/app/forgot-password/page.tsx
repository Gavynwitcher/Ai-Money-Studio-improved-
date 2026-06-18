import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Forgot Password",
  robots: {
    index: false,
    follow: false
  }
};

export default function ForgotPasswordPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="forgot" />
      </Container>
    </section>
  );
}
