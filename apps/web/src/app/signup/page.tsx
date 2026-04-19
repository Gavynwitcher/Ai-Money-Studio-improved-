import type { Metadata } from "next";
import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Sign Up",
  robots: {
    index: false,
    follow: false
  }
};

export default function SignUpPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="signup" />
      </Container>
    </section>
  );
}
