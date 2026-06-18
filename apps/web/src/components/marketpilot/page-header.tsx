export function MarketPilotPageHeader({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#3f7d58]">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] md:text-5xl">{title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-[#647067]">{description}</p>
    </div>
  );
}
