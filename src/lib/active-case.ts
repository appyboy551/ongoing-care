// Request-scoped cache for the active case lookup. Both ShellLayout and
// LiveCaseBanner need to know if a case is open or escalated; without the
// cache we'd run two near-identical Postgres roundtrips per page render.
// React's `cache()` dedupes calls within the same render pass.

import { cache } from "react";
import { db } from "./db";

export type ActiveCaseLite = {
  id: string;
  status: "OPEN" | "ESCALATED";
  title: string;
  lastActivityAt: Date;
  originSeroquelLogId: string | null;
};

export const getActiveCase = cache(async (): Promise<ActiveCaseLite | null> => {
  const row = await db.case.findFirst({
    where: { status: { in: ["OPEN", "ESCALATED"] } },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      status: true,
      title: true,
      lastActivityAt: true,
      originSeroquelLogId: true,
    },
  });
  return row as ActiveCaseLite | null;
});
