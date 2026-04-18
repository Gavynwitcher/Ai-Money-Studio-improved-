import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left"
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <Badge tone="teal">{eyebrow}</Badge> : null}
      <h2 className="mt-4 font-heading text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="mt-4 text-base leading-7 text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}
