import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta
}: PageHeroProps) {
  return (
    <section className="page-section pt-16 sm:pt-20">
      <Container>
        <div className="glass-panel-strong grid-fade relative overflow-hidden rounded-[32px] px-6 py-12 sm:px-10 lg:px-12">
          <div className="hero-orb left-0 top-10 h-24 w-24 bg-[rgba(26,139,141,0.28)]" />
          <div className="hero-orb right-10 top-0 h-20 w-20 bg-[rgba(243,201,106,0.3)]" />
          <div className="relative z-10 max-w-3xl">
            <Badge tone="gold">{eyebrow}</Badge>
            <h1 className="mt-5 font-heading text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">{description}</p>
            {(primaryCta || secondaryCta) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {primaryCta ? <Button href={primaryCta.href}>{primaryCta.label}</Button> : null}
                {secondaryCta ? (
                  <Button href={secondaryCta.href} variant="secondary">
                    {secondaryCta.label}
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
