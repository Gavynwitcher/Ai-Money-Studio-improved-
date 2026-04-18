import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export default function SignUpPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="signup" />
      </Container>
    </section>
  );
}
