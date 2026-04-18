import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "inverse";
};

const styles = {
  primary:
    "border border-[rgba(11,31,51,0.18)] bg-[var(--navy)] text-white shadow-[0_18px_36px_rgba(11,31,51,0.18)] hover:bg-[#122c46]",
  secondary:
    "border border-[var(--line-strong)] bg-white/90 text-[var(--navy)] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-[var(--ocean)] hover:bg-white",
  ghost: "text-[var(--navy)] hover:bg-slate-900/5",
  inverse:
    "border border-white/18 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-white/16"
};

export function Button({ href, children, className, variant = "primary" }: ButtonProps) {
  const shared = cn(
    "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200",
    styles[variant],
    className
  );

  if (href) {
    return (
      <Link href={href} className={shared}>
        {children}
      </Link>
    );
  }

  return <button className={shared}>{children}</button>;
}
