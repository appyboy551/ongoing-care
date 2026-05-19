// ClickSend SMS wrapper. Used only for urgent events (currently: missed
// check-in escalation). One Australian SMS via ClickSend costs roughly
// $0.085 AUD; the portal sends at most 4 per missed-check-in event.
//
// Configured via env vars:
//   CLICKSEND_USERNAME (your ClickSend account username)
//   CLICKSEND_API_KEY  (from ClickSend dashboard > API credentials)
//
// If either env var is missing, the wrapper returns ok:false with a clear
// reason rather than throwing. Caller treats this as "log it and move on" so
// a configuration miss does not break the escalation path; emails still go.

const CLICKSEND_API = "https://rest.clicksend.com/v3/sms/send";

export type SmsArgs = {
  to: string;
  bodyText: string;
};

export async function sendSms(args: SmsArgs): Promise<{ ok: boolean; reason?: string }> {
  const username = process.env.CLICKSEND_USERNAME;
  const apiKey = process.env.CLICKSEND_API_KEY;
  if (!username || !apiKey) {
    return { ok: false, reason: "CLICKSEND credentials not configured" };
  }
  if (!args.to || !args.to.startsWith("+")) {
    return { ok: false, reason: "Phone must be in international format starting with +" };
  }
  try {
    const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");
    const res = await fetch(CLICKSEND_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
        messages: [
          {
            // Source = our internal label, shows in the ClickSend dashboard.
            source: "ongoingcare-portal",
            // From = what the recipient sees as the sender. Alphanumeric ID
            // means the SMS shows "DavidAlert" (registered in ClickSend as the
            // Alpha Tag) instead of a random rotating number from ClickSend's
            // shared pool (which can appear foreign and gets blocked by
            // recipients as "unknown number"). Must match the registered
            // Alpha Tag in the ClickSend dashboard or carriers will reject.
            // Note: alphanumeric sender IDs are one-way; recipients cannot
            // reply by SMS. That is fine for this portal.
            from: "DavidAlert",
            to: args.to,
            body: args.bodyText,
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, reason: `ClickSend ${res.status}: ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "SMS send failed" };
  }
}
