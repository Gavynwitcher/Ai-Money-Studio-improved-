import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
};

const styles = {
  primary:
    "bg-[var(--navy)] text-white shadow-[0_18px_40px_rgba(10,37,64,0.22)] hover:bg-[#14375d]",
  secondary:
    "border border-[var(--line-strong)] bg-white/70 text-[var(--navy)] hover:border-[var(--ocean)] hover:bg-white",
  ghost: "text-[var(--navy)] hover:bg-slate-900/5"
};

export function Button({ href, children, className, variant = "primary" }: ButtonProps) {
  const shared = cn(
    "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200",
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
