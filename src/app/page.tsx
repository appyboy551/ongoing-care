// Landing page. Redirects authenticated users to /dashboard, otherwise shows landing.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import DavidCarePlanLanding from "@/components/DavidCarePlanLanding";

export default async function Home() {
  const m = await getCurrentMember();
  if (m) {
    if (m.tier === "ADMIN") redirect("/admin");
    redirect("/dashboard");
  }
  
  return <DavidCarePlanLanding />;
}
