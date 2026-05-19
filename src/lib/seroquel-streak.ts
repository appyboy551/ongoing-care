// Windowed dose-day count for the Seroquel signal.
//
// Phase 0 safety fix. The previous helper counted consecutive days and a
// single missed day reset the count to zero, which in an acute period made
// the signal read as calm. The windowed count cannot be silenced by one
// missed dose: it counts distinct days with at least one dose inside the
// rolling window. AU timezone is preserved from the previous helper.

import { db } from "./db";

const AU_TZ = "Australia/Sydney";

// UNCONFIRMED. Pending review with prescriber. See handover Section 6.
// Number of dose-days in the last 7 that flips the signal to warning.
export const WARNING_DOSE_DAYS = 2;

// UNCONFIRMED. Pending review with prescriber. See handover Section 6.
// Number of dose-days in the last 7 that flips the signal to critical.
export const CRITICAL_DOSE_DAYS = 3;

export type SeroquelSignalState = "calm" | "warning" | "critical";

function auDateKey(d: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: AU_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Count distinct AU days, in the last `days` days, on which at least one
 * Seroquel dose was logged. A missed day does not reset the count; it just
 * does not contribute to it.
 */
export async function getSeroquelDoseDaysInWindow(days = 7): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const logs = await db.seroquelLog.findMany({
    where: { takenAt: { gte: since } },
    select: { takenAt: true },
  });
  if (logs.length === 0) return 0;
  const distinctDays = new Set(logs.map((l) => auDateKey(l.takenAt)));
  return distinctDays.size;
}

export function getSeroquelSignalState(doseDays: number): SeroquelSignalState {
  if (doseDays >= CRITICAL_DOSE_DAYS) return "critical";
  if (doseDays >= WARNING_DOSE_DAYS) return "warning";
  return "calm";
}
