const partnerLogos = ["Moss", "Northline", "Cinder", "Strata", "Luma", "Driftwell", "Fable", "Summit"];

const principles = [
  {
    eyebrow: "Locally tuned",
    title: "Seattle instincts. Subscription discipline.",
    body:
      "The service is shaped for founder-led teams operating in a city that values technical depth, measured risk, and clear commercial outcomes."
  },
  {
    eyebrow: "Weekly momentum",
    title: "A marketing rhythm that does not disappear after kickoff.",
    body:
      "Each month starts with a sharp planning sprint, then moves into weekly analysis, shipping, and KPI review so the work stays alive."
  },
  {
    eyebrow: "Premium execution",
    title: "Sharp strategy, polished assets, and fewer moving parts.",
    body:
      "Instead of stitching together freelancers, prompts, and disconnected tools, clients get one operating system with one accountable team."
  }
] as const;

const subscriptionPlans = [
  {
    name: "Starter",
    price: "$1,500",
    cadence: "/month",
    tag: "Lean advisory",
    summary: "For founders who need sharper positioning, a consistent content point of view, and one strong acquisition lane.",
    bullets: ["Monthly strategy sprint", "Weekly async direction", "One landing-page iteration", "Monthly KPI review"]
  },
  {
    name: "Growth",
    price: "$3,000",
    cadence: "/month",
    tag: "Most popular",
    summary:
      "For service businesses that want the full subscription system: onboarding, messaging, content, funnel improvements, and weekly optimization.",
    bullets: ["Week-one onboarding sprint", "Weekly growth analysis", "Copy and funnel updates", "Experiment backlog and reporting"]
  },
  {
    name: "Scale",
    price: "$5,500",
    cadence: "/month",
    tag: "Embedded partner",
    summary:
      "For teams with active demand that need a higher-touch growth partner managing priorities, reporting, and faster iteration.",
    bullets: ["Weekly strategy call", "Priority asset production", "Deeper reporting layer", "Higher testing cadence"]
  }
] as const;

const caseStudies = [
  {
    title: "Professional services relaunch",
    metric: "+41%",
    label: "Booked-call conversion",
    body: "Reframed the offer, rebuilt the homepage narrative, and tightened the CTA path into a clearer subscription pitch."
  },
  {
    title: "Founder-led consultancy content engine",
    metric: "12 assets",
    label: "Shipped in month one",
    body: "Turned fragmented insights into a weekly content system spanning short-form, email, and search-aware landing pages."
  },
  {
    title: "Ops-heavy service brand",
    metric: "3 weeks",
    label: "To first measurable lead signal",
    body: "Installed a cleaner acquisition funnel with lead magnet, nurture flow, and weekly reporting cadence."
  }
] as const;

const services = [
  "Offer strategy",
  "Brand positioning",
  "Landing pages",
  "Lifecycle email",
  "Content systems",
  "SEO planning",
  "Funnel diagnostics",
  "Experiment design"
] as const;

const insights = [
  {
    date: "Mar 2026",
    title: "Why subscription marketing beats one-off retainers for service businesses",
    category: "Operating model"
  },
  {
    date: "Feb 2026",
    title: "How to rebuild a founder-led homepage so it finally books calls",
    category: "Conversion"
  },
  {
    date: "Jan 2026",
    title: "The Seattle advantage: technical buyers, tighter messaging, stronger proof",
    category: "Local strategy"
  }
] as const;

const weeklyCadence = [
  ["Monday", "Review pipeline health, lead quality, and the main conversion bottleneck."],
  ["Tuesday", "Adjust angle, offer framing, and campaign priorities."],
  ["Wednesday", "Ship core assets: landing-page updates, emails, or high-intent content."],
  ["Thursday", "Refine distribution, CTA placement, and experiment setup."],
  ["Friday", "Send the executive summary with numbers, risks, and next moves."]
] as const;

export function MarketingAgencyHome() {
  return (
    <div className="space-y-8 pb-12">
      <section className="agency-panel reveal-up overflow-hidden rounded-[2.4rem]">
        <div className="grid gap-8 px-7 py-8 md:px-10 md:py-12 lg:grid-cols-[1.25fr_0.95fr]">
          <div className="relative">
            <div className="premium-orb left-[-5%] top-[-8%] h-32 w-32 bg-[#d7b58d]/45" />
            <div className="premium-orb left-[62%] top-[12%] h-24 w-24 bg-[#b85c38]/18" />
            <p className="text-xs uppercase tracking-[0.34em] text-[#8e4f33]">Seattle Subscription Marketing Service</p>
            <h1 className="mt-5 max-w-4xl font-heading text-5xl leading-[0.94] text-[#171717] md:text-7xl">
              Premium growth infrastructure for founder-led brands in Seattle.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#51473d] md:text-lg">
              Inspired by the confidence and editorial polish of top agency sites, but sold as a recurring service:
              sharper positioning, better conversion assets, and a weekly operating rhythm that keeps demand moving.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#plans"
                className="rounded-full bg-[#171717] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#f5ecdf]"
              >
                View subscriptions
              </a>
              <a
                href="#work"
                className="rounded-full border border-[#171717]/10 bg-white/60 px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#171717]"
              >
                Explore work style
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["Month-to-month", "No bloated project scope, no dead kickoff decks."],
                ["Seattle-first", "Calibrated for technical founders and service operators."],
                ["Weekly delivery", "Strategy, assets, and reporting inside one rhythm."]
              ].map(([title, body], idx) => (
                <div
                  key={title}
                  className="reveal-up rounded-[1.5rem] border border-[#171717]/10 bg-white/58 p-4"
                  style={{ animationDelay: `${idx * 90 + 120}ms` }}
                >
                  <p className="text-sm font-semibold text-[#171717]">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5b4f43]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-rows-[1.1fr_0.9fr]">
            <article className="reveal-up rounded-[2rem] bg-[#171717] p-6 text-[#f5ebdc]" style={{ animationDelay: "160ms" }}>
              <p className="text-xs uppercase tracking-[0.22em] text-[#d7b58d]">Why it feels premium</p>
              <h2 className="mt-4 font-heading text-4xl leading-tight">Editorial presence up front. Operating rigor underneath.</h2>
              <p className="mt-4 text-sm leading-7 text-[#efe3d2]">
                The visual language is richer, but the sale is still practical: one clear ICP, one accountable team,
                one recurring system instead of disposable campaign work.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  ["$3,000/mo", "Default Growth tier"],
                  ["5-day rhythm", "Work shipped every week"],
                  ["3 plans", "Clear ladder, no custom chaos"],
                  ["1 operator", "Founder-facing subscription model"]
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[1.3rem] bg-white/8 px-4 py-4">
                    <p className="font-heading text-3xl text-[#fff6ea]">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#d7b58d]">{label}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="agency-grid reveal-up rounded-[2rem] border border-[#171717]/10 bg-[#fff8ee] p-6" style={{ animationDelay: "240ms" }}>
              <p className="text-xs uppercase tracking-[0.22em] text-[#8e4f33]">Primary message</p>
              <p className="mt-4 font-heading text-3xl leading-tight text-[#171717]">
                Subscribe to a marketing system that gets sharper every month.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#5b4f43]">
                Week one handles onboarding, message alignment, and priorities. After that, the subscription turns into
                a live operating cadence across content, conversion, and reporting.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#171717]/10 bg-[#171717] py-4">
        <div className="marquee-track">
          {[...partnerLogos, ...partnerLogos].map((name, idx) => (
            <span
              key={`${name}-${idx}`}
              className="mx-5 inline-flex items-center text-sm font-semibold uppercase tracking-[0.22em] text-[#e9d9c4]"
            >
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="agency-panel reveal-up rounded-[2rem] p-7 md:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#8e4f33]">Why Seattle</p>
          <h2 className="mt-3 font-heading text-4xl text-[#171717] md:text-5xl">Globally polished, locally credible.</h2>
          <p className="mt-4 text-sm leading-7 text-[#5c5044] md:text-base">
            Terra&apos;s Seattle page works because it balances place, proof, and personality. This version does the
            same, but adapts the story to a subscription product for Seattle founders who expect better thinking and
            better taste from the teams they hire.
          </p>
          <div className="mt-8 space-y-3">
            {principles.map((item, idx) => (
              <div
                key={item.title}
                className="reveal-up rounded-[1.5rem] border border-[#171717]/10 bg-white/65 p-5"
                style={{ animationDelay: `${idx * 90 + 140}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#8e4f33]">{item.eyebrow}</p>
                <p className="mt-2 text-xl font-semibold text-[#171717]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#5c5044]">{item.body}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="agency-panel reveal-up rounded-[2rem] bg-[#20493b] p-7 text-[#f7efe4] md:p-10" style={{ animationDelay: "120ms" }}>
          <p className="text-xs uppercase tracking-[0.28em] text-[#d7b58d]">Founder quote</p>
          <blockquote className="mt-4 font-heading text-4xl leading-tight">
            &ldquo;We needed a marketing partner that could think like an operator and still make the brand feel expensive.&rdquo;
          </blockquote>
          <p className="mt-6 max-w-xl text-sm leading-7 text-[#efe3d2]">
            This is the core promise of the site: disciplined growth work wrapped in a visual identity that feels more
            like a premium firm than a generic funnel vendor.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Offer clarity", "Sharper packaging and pricing"],
              ["Content velocity", "A recurring system instead of content bursts"],
              ["Conversion focus", "Pages, emails, and CTAs tuned monthly"]
            ].map(([label, body]) => (
              <div key={label} className="rounded-[1.3rem] bg-white/8 p-4">
                <p className="font-semibold text-[#fff5e8]">{label}</p>
                <p className="mt-2 text-sm leading-6 text-[#efe3d2]">{body}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section id="plans" className="agency-panel reveal-up rounded-[2rem] p-7 md:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[#8e4f33]">Subscriptions</p>
            <h2 className="mt-3 font-heading text-4xl text-[#171717] md:text-5xl">Recurring plans, not dead-end projects.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-[#5c5044]">
            Each plan starts with a structured onboarding sprint and then rolls into weekly execution. The site now
            sells that rhythm clearly instead of pretending the work ends after delivery.
          </p>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-3">
          {subscriptionPlans.map((plan, idx) => (
            <article
              key={plan.name}
              className={`reveal-up rounded-[1.9rem] border p-6 ${
                idx === 1 ? "border-[#171717] bg-[#171717] text-[#f7ecdc]" : "border-[#171717]/10 bg-white/65 text-[#171717]"
              }`}
              style={{ animationDelay: `${idx * 90 + 180}ms` }}
            >
              <div className="flex items-center justify-between gap-4">
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                    idx === 1 ? "bg-[#f3e7d8] text-[#171717]" : "bg-[#f0e3d2] text-[#8e4f33]"
                  }`}
                >
                  {plan.tag}
                </span>
                <p className={`text-xs uppercase tracking-[0.18em] ${idx === 1 ? "text-[#d7b58d]" : "text-[#8a6d55]"}`}>
                  {plan.cadence}
                </p>
              </div>

              <h3 className="mt-5 font-heading text-4xl">{plan.name}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-heading text-5xl">{plan.price}</span>
                <span className={`pb-2 text-sm ${idx === 1 ? "text-[#d7b58d]" : "text-[#7b6c5f]"}`}>{plan.cadence}</span>
              </div>
              <p className={`mt-5 text-sm leading-6 ${idx === 1 ? "text-[#efe3d2]" : "text-[#574b40]"}`}>{plan.summary}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.bullets.map((item) => (
                  <li key={item} className={`rounded-[1.1rem] px-4 py-3 ${idx === 1 ? "bg-white/8" : "bg-[#fff8ee]"}`}>
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-6 inline-flex rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] ${
                  idx === 1 ? "bg-[#f4e8da] text-[#171717]" : "bg-[#171717] text-[#f5ecdf]"
                }`}
              >
                Start this plan
              </a>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="agency-panel reveal-up rounded-[2rem] p-7 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#8e4f33]">Selected Work Style</p>
              <h2 className="mt-3 font-heading text-4xl text-[#171717] md:text-5xl">
                Case-study energy without pretending every card is a trophy wall.
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {caseStudies.map((item, idx) => (
              <article
                key={item.title}
                className={`reveal-up rounded-[1.7rem] p-5 ${idx === 1 ? "bg-[#b85c38] text-[#fff3e8]" : "bg-[#fff8ee] text-[#171717]"}`}
                style={{ animationDelay: `${idx * 90 + 180}ms` }}
              >
                <p className={`text-xs uppercase tracking-[0.18em] ${idx === 1 ? "text-[#f5d7c3]" : "text-[#8e4f33]"}`}>{item.title}</p>
                <p className="mt-5 font-heading text-5xl">{item.metric}</p>
                <p className={`mt-1 text-sm font-semibold ${idx === 1 ? "text-[#fff3e8]" : "text-[#20493b]"}`}>{item.label}</p>
                <p className={`mt-4 text-sm leading-6 ${idx === 1 ? "text-[#fff1e7]" : "text-[#5c5044]"}`}>{item.body}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="agency-panel reveal-up rounded-[2rem] p-7 md:p-10" style={{ animationDelay: "120ms" }}>
          <p className="text-xs uppercase tracking-[0.28em] text-[#8e4f33]">Service Surface</p>
          <h2 className="mt-3 font-heading text-4xl text-[#171717] md:text-5xl">Everything the subscription can touch.</h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {services.map((item, idx) => (
              <span
                key={item}
                className="reveal-up rounded-full border border-[#171717]/10 bg-white/70 px-4 py-3 text-sm font-semibold text-[#171717]"
                style={{ animationDelay: `${idx * 45 + 160}ms` }}
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-8 rounded-[1.8rem] border border-[#171717]/10 bg-[#171717] p-6 text-[#f5ebdc]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#d7b58d]">Working rule</p>
            <p className="mt-3 text-sm leading-6 text-[#efe3d2]">
              One primary acquisition lane first. One reporting view tied to revenue or booked calls. No bloated
              channel sprawl until the system proves itself.
            </p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="agency-panel reveal-up rounded-[2rem] bg-[#171717] p-7 text-[#f4e8da] md:p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d7b58d]">Weekly cadence</p>
          <h2 className="mt-3 font-heading text-4xl md:text-5xl">A lively site should still sell an operational truth.</h2>
          <div className="mt-8 space-y-3">
            {weeklyCadence.map(([day, copy], idx) => (
              <div
                key={day}
                className="reveal-up rounded-[1.5rem] bg-white/8 p-5"
                style={{ animationDelay: `${idx * 80 + 180}ms` }}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#d7b58d]">{day}</p>
                <p className="mt-2 text-sm leading-6 text-[#f4e8da]">{copy}</p>
              </div>
            ))}
          </div>
        </article>

        <article id="insights" className="agency-panel reveal-up rounded-[2rem] p-7 md:p-10" style={{ animationDelay: "120ms" }}>
          <p className="text-xs uppercase tracking-[0.28em] text-[#8e4f33]">Latest Insights</p>
          <h2 className="mt-3 font-heading text-4xl text-[#171717] md:text-5xl">Give the homepage an editorial pulse.</h2>
          <div className="mt-8 space-y-4">
            {insights.map((item, idx) => (
              <article
                key={item.title}
                className="reveal-up rounded-[1.6rem] border border-[#171717]/10 bg-white/70 p-5"
                style={{ animationDelay: `${idx * 80 + 180}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8e4f33]">{item.category}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8a6d55]">{item.date}</p>
                </div>
                <p className="mt-3 text-xl font-semibold leading-8 text-[#171717]">{item.title}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section id="contact" className="agency-panel reveal-up overflow-hidden rounded-[2.2rem]">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#171717_0%,#1d352d_48%,#b85c38_100%)] px-7 py-8 text-[#f9f0e3] md:px-10 md:py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#e5c8ab]">Closing CTA</p>
            <h2 className="mt-4 max-w-3xl font-heading text-5xl leading-[0.96] md:text-6xl">
              Ready to make the site feel expensive and the service feel inevitable?
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-[#f6e9d9] md:text-base">
              This version keeps the subscription sale intact while borrowing the premium, place-aware energy that makes
              Terra&apos;s location pages feel alive. The next move is wiring a real contact flow or checkout.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-[#e5c8ab]">Primary CTA</p>
              <p className="mt-3 text-2xl font-semibold">Book a subscription strategy call</p>
            </div>
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-[#e5c8ab]">Default sale</p>
              <p className="mt-3 text-2xl font-semibold">Growth Subscription · $3,000/month</p>
            </div>
            <div className="rounded-[1.8rem] bg-white/10 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-[#e5c8ab]">Suggested next build</p>
              <p className="mt-3 text-2xl font-semibold">Add intake form, checkout, and case-study detail pages</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
