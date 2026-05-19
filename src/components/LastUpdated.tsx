import { formatDistanceToNow } from "date-fns";

export default function LastUpdated({ date }: { date: Date | null }) {
  if (!date) return null;
  return (
    <div className="mt-4 pt-3 border-t border-line flex items-center justify-end">
      <span className="text-[11px] font-medium uppercase tracking-wider text-ink-soft">
        Updated {formatDistanceToNow(new Date(date), { addSuffix: true })}
      </span>
    </div>
  );
}
