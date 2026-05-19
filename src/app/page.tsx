// Landing page. Redirects authenticated users to /dashboard, otherwise to /login.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";

export default async function Home() {
  const m = await getCurrentMember();
  if (!m) redirect("/login");
  if (m.tier === "ADMIN") redirect("/admin");
  redirect("/dashboard");
}
