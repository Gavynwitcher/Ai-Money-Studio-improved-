import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export function CtaBanner() {
  return (
    <section className="page-section pt-0">
      <Container>
        <Card className="mesh-card overflow-hidden rounded-[32px] px-6 py-8 sm:px-10 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--teal)]">
                Launch-ready MVP
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--navy)]">
                Validate demand for affordable multi-bank money management.
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--muted)]">
                Use the site to test waitlist conversion, pricing sensitivity, transfer interest,
                and segment demand across consumers and small businesses.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/signup">Join the early access list</Button>
              <Button href="/contact" variant="secondary">
                Request investor demo
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}
