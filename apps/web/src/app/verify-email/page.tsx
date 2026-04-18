import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export default function VerifyEmailPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="verify" />
      </Container>
    </section>
  );
}
