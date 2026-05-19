// Server component. Renders the dose-pattern card from the windowed Seroquel
// signal in src/lib/seroquel-streak.ts. Phase 0 safety: the previous version
// read a consecutive-day streak that a single missed dose reset to zero. This
// version cannot be silenced by a missed dose.
//
// Currently unmounted. The Phase 4 admin dashboard rebuild will drop this in.

import { db } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import {
  getSeroquelDoseDaysInWindow,
  getSeroquelSignalState,
} from "@/lib/seroquel-streak";
import { getAlertCtaInfo } from "@/lib/care-team";
import SeroquelAlertModal from "./SeroquelAlertModal";

type Props = { className?: string };

export default async function SeroquelTracker({ className = "" }: Props) {
  const doseDays = await getSeroquelDoseDaysInWindow(7);
  const state = getSeroquelSignalState(doseDays);

  const latestLog = await db.seroquelLog.findFirst({
    orderBy: { takenAt: "desc" },
    select: { id: true, takenAt: true, alertAcknowledgedAt: true },
  });

  // CTA is only meaningful at critical. Skip the care-team query otherwise.
  const ctaInfo = state === "critical" ? await getAlertCtaInfo() : null;

  // Modal fires only when the signal is critical AND the most recent dose
  // has not been acknowledged. A new dose creates a new latest log id with
  // alertAcknowledgedAt null, which re-arms the alert. The old, acknowledged
  // dose is left dormant.
  const showModal =
    state === "critical" &&
    latestLog !== null &&
    latestLog.alertAcknowledgedAt === null &&
    ctaInfo !== null;

  const cardClass =
    state === "critical"
      ? "card-alert pulse-alert"
      : state === "warning"
        ? "card-warning"
        : "card-float";

  const eyebrowColor =
    state === "critical"
      ? "var(--alert-red)"
      : state === "warning"
        ? "#D97706"
        : "var(--color-text-soft)";

  return (
    <>
      <article
        className={`${cardClass} p-7 h-full flex flex-col transition-all duration-500 ${className}`}
      >
        <div
          className="text-[11px] uppercase tracking-[0.15em] font-bold"
          style={{ color: eyebrowColor }}
        >
          Seroquel, last 7 days
        </div>

        <div
          className={
            state === "critical"
              ? "metric-display-alert mt-3"
              : "metric-display mt-3"
          }
        >
          {doseDays}
        </div>

        <div className="text-soft text-[13.5px] mt-2 flex-1">
          {doseDays === 0
            ? "No doses logged in the last 7 days."
            : `${doseDays} of the last 7 days had at least one dose.`}
          {latestLog?.takenAt && (
            <span className="block mt-1 text-[12px]">
              Last logged{" "}
              {formatDistanceToNow(new Date(latestLog.takenAt), {
                addSuffix: true,
              })}
              .
            </span>
          )}
        </div>

        {state === "critical" && (
          <div
            className="mt-4 text-[13px] font-semibold"
            style={{ color: "var(--alert-red)" }}
          >
            Dose-pattern threshold reached. Consider speaking with your care
            team.
          </div>
        )}
        {state === "warning" && (
          <div
            className="mt-4 text-[13px] font-semibold"
            style={{ color: "#D97706" }}
          >
            Dose pattern is climbing. Keep an eye on how the week is feeling.
          </div>
        )}
      </article>

      {showModal && latestLog && ctaInfo && (
        <SeroquelAlertModal
          logId={latestLog.id}
          doseDays={doseDays}
          ctaHref={ctaInfo.href}
          ctaLabel={ctaInfo.label}
        />
      )}
    </>
  );
}
