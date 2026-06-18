import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Sign In",
  robots: {
    index: false,
    follow: false
  }
};

export default function SignInPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="signin" />
      </Container>
    </section>
  );
}
