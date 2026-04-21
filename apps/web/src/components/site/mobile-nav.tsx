"use client";

import { useState } from "react";
import Link from "next/link";
import { navigation } from "@/data/site";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Toggle navigation"
        className="rounded-[16px] border border-[var(--line)] bg-white/88 px-4 py-2 text-sm font-semibold text-[var(--navy)] shadow-[0_8px_24px_rgba(8,23,41,0.04)]"
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      <div
        className={cn(
          "absolute left-5 right-5 top-[calc(100%+0.75rem)] rounded-[24px] border border-[var(--line)] bg-white/96 p-4 shadow-[0_20px_56px_rgba(8,23,41,0.14)] transition",
          open ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        )}
      >
        <div className="grid gap-2">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-3 text-sm font-medium text-[var(--navy)] hover:bg-slate-900/5"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/signup"
            className="mt-2 rounded-full bg-[var(--navy)] px-4 py-3 text-center text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}
