import type { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";
import { LangSwitcher } from "@/components/ui/LangSwitcher";

/**
 * Common page frame for standalone auth pages. The header spans the same
 * max-w-[1200px] track as the landing and dashboard bars so the logo stays
 * put across the whole app; the form itself keeps the classic narrow
 * max-w-md card, optically centred in the space below.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-10 md:py-5">
        <Logo />
        <LangSwitcher />
      </header>
      <main className="flex w-full flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
