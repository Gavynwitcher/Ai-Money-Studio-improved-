import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  stacked?: boolean;
  showTagline?: boolean;
};

export function BrandLogo({ className, stacked = false, showTagline = true }: BrandLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", stacked && "flex-col items-start gap-4", className)}>
      <Image
        src="/northline-mark.png"
        alt="Northline logo mark"
        width={56}
        height={56}
        className="h-11 w-11 object-contain"
        priority
      />
      <div className="min-w-0">
        {showTagline ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--teal)]">Multi-bank workspace</p>
        ) : null}
        <Image
          src="/northline-wordmark.png"
          alt="Northline"
          width={402}
          height={120}
          className="mt-1 h-auto w-[132px] object-contain sm:w-[150px]"
        />
      </div>
    </div>
  );
}
