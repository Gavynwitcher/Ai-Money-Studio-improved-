import { AuthForm } from "@/components/forms/auth-form";
import { Container } from "@/components/ui/container";

export default function SignInPage() {
  return (
    <section className="page-section pt-16">
      <Container>
        <AuthForm mode="signin" />
      </Container>
    </section>
  );
}
