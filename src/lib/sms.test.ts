import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendSms } from "./sms";

const realFetch = global.fetch;

describe("sendSms (ClickSend wrapper)", () => {
  beforeEach(() => {
    process.env.CLICKSEND_USERNAME = "testuser";
    process.env.CLICKSEND_API_KEY = "testkey";
  });
  afterEach(() => {
    global.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it("returns ok:false with a clear reason when credentials are missing", async () => {
    delete process.env.CLICKSEND_USERNAME;
    delete process.env.CLICKSEND_API_KEY;
    const r = await sendSms({ to: "+61400000000", bodyText: "test" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/credentials/i);
  });

  it("rejects phone numbers without international + prefix", async () => {
    const r = await sendSms({ to: "0400000000", bodyText: "test" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/international format/i);
  });

  it("posts to the ClickSend API with the expected body and auth header", async () => {
    const mock = vi.fn(async () => new Response("ok", { status: 200 }));
    global.fetch = mock as unknown as typeof fetch;
    const r = await sendSms({ to: "+61400000000", bodyText: "Hello" });
    expect(r.ok).toBe(true);
    expect(mock).toHaveBeenCalledOnce();
    const [url, opts] = mock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://rest.clicksend.com/v3/sms/send");
    expect(opts.method).toBe("POST");
    const headers = opts.headers as Record<string, string>;
    expect(headers["authorization"]).toMatch(/^Basic /);
    const body = JSON.parse(opts.body as string);
    expect(body.messages[0].to).toBe("+61400000000");
    expect(body.messages[0].body).toBe("Hello");
    expect(body.messages[0].from).toBe("DavidAlert");
  });

  it("returns ok:false when ClickSend responds with non-2xx", async () => {
    global.fetch = vi.fn(async () => new Response("forbidden", { status: 403 })) as unknown as typeof fetch;
    const r = await sendSms({ to: "+61400000000", bodyText: "x" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/ClickSend 403/);
  });

  it("returns ok:false on network error", async () => {
    global.fetch = vi.fn(async () => { throw new Error("boom"); }) as unknown as typeof fetch;
    const r = await sendSms({ to: "+61400000000", bodyText: "x" });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/boom/);
  });
});
