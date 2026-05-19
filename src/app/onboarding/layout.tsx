// Standalone shell for onboarding. No sidebar; we want the member focused
// on the flow until they finish it.

import { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-card-lg w-full max-w-[560px] p-7 md:p-10">
        {children}
      </div>
    </div>
  );
}
