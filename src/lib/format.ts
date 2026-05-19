// Small formatting helpers.

export function doseInWords(doseMg: number): string {
  if (doseMg === 25) return "twenty-five milligrams (one tablet)";
  if (doseMg === 50) return "fifty milligrams (two tablets)";
  return `${doseMg} milligrams`;
}

export function formatAuTime(d: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Sydney",
  }).format(d);
}

export function hoursAndMinutes(hours: number): string {
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) - h) * 60);
  const sign = hours < 0 ? "-" : "";
  return `${sign}${h}h ${m}m`;
}
