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
        <div className="bank-shell grid-fade relative overflow-hidden rounded-[34px] px-6 py-10 sm:px-10 sm:py-12 lg:px-12">
          <div className="hero-orb left-0 top-10 h-24 w-24 bg-[rgba(25,106,117,0.2)]" />
          <div className="hero-orb right-10 top-0 h-20 w-20 bg-[rgba(200,164,90,0.18)]" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end">
            <div className="max-w-3xl">
              <Badge tone="gold">{eyebrow}</Badge>
              <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-[3.6rem]">
                {title}
              </h1>
              <p className="mt-5 max-w-2xl text-[1.02rem] leading-8 text-slate-200">{description}</p>
              {(primaryCta || secondaryCta) && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {primaryCta ? <Button href={primaryCta.href}>{primaryCta.label}</Button> : null}
                  {secondaryCta ? (
                    <Button href={secondaryCta.href} variant="inverse">
                      {secondaryCta.label}
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
            <div className="grid gap-3 lg:pl-4">
              <div className="bank-stat-dark rounded-[24px] p-5 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Operating model</p>
                <p className="mt-3 text-lg font-semibold">Connected cash visibility with guided next actions</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">Built to help users connect institutions, monitor balances, and move through banking workflows with less friction.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bank-stat-dark rounded-[22px] p-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Institution-ready</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Structured surfaces, approval-aware copy, and balance-first hierarchy.</p>
                </div>
                <div className="bank-stat-dark rounded-[22px] p-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/75">Customer signal</p>
                  <p className="mt-3 text-sm leading-6 text-slate-200">Built to validate account connection, cash review, and transfer intent.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
