// Seroquel-log timer: compute expected check-in time and current state.

import { db } from "./db";
import { getSettingNumber } from "./settings";

export async function getConfiguredTimerHours(): Promise<number> {
  return getSettingNumber("seroquel.timer.hours", 14);
}

export type ActionPlanState =
  | { state: "IDLE" }
  | {
      state: "ARMED";
      logId: string;
      doseMg: number;
      takenAt: Date;
      expectedCheckInBy: Date;
      hoursRemaining: number;
    }
  | {
      state: "MISSED";
      logId: string;
      doseMg: number;
      takenAt: Date;
      expectedCheckInBy: Date;
      hoursOverdue: number;
    };

export async function getActionPlanState(): Promise<ActionPlanState> {
  // The most recent unclosed Seroquel log dictates the state.
  const recent = await db.seroquelLog.findFirst({
    where: { closedAt: null, checkedInAt: null },
    orderBy: { takenAt: "desc" },
  });
  if (!recent) return { state: "IDLE" };

  const now = new Date();
  const expected = recent.expectedCheckInBy;
  const diffMs = expected.getTime() - now.getTime();
  const hours = diffMs / 3_600_000;

  if (hours > 0) {
    return {
      state: "ARMED",
      logId: recent.id,
      doseMg: recent.doseMg,
      takenAt: recent.takenAt,
      expectedCheckInBy: expected,
      hoursRemaining: Math.round(hours * 10) / 10,
    };
  }
  return {
    state: "MISSED",
    logId: recent.id,
    doseMg: recent.doseMg,
    takenAt: recent.takenAt,
    expectedCheckInBy: expected,
    hoursOverdue: Math.round((-hours) * 10) / 10,
  };
}
