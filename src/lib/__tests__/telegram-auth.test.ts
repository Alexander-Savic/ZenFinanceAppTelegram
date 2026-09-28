import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import { validateTelegramInitData, TelegramAuthError } from "../telegram-auth";

const BOT_TOKEN = "test-bot-token";

function buildInitData(overrides: Record<string, string> = {}, tamperHash = false) {
  const params: Record<string, string> = {
    auth_date: Math.floor(Date.now() / 1000).toString(),
    user: JSON.stringify({ id: 12345, first_name: "Ada", username: "ada" }),
    query_id: "AAH...",
    ...overrides,
  };

  const dataCheckString = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  const search = new URLSearchParams({
    ...params,
    hash: tamperHash ? "0".repeat(64) : hash,
  });
  return search.toString();
}

describe("validateTelegramInitData", () => {
  it("accepts a correctly signed payload", () => {
    const initData = buildInitData();
    const result = validateTelegramInitData(initData, BOT_TOKEN);
    expect(result.user.id).toBe(12345);
    expect(result.user.username).toBe("ada");
  });

  it("rejects a tampered hash", () => {
    const initData = buildInitData({}, true);
    expect(() => validateTelegramInitData(initData, BOT_TOKEN)).toThrow(TelegramAuthError);
  });

  it("rejects a payload where a field was modified post-signing", () => {
    const valid = buildInitData();
    const params = new URLSearchParams(valid);
    params.set("user", JSON.stringify({ id: 99999, first_name: "Eve" }));
    expect(() => validateTelegramInitData(params.toString(), BOT_TOKEN)).toThrow(
      TelegramAuthError
    );
  });

  it("rejects an expired auth_date", () => {
    const eightDaysAgo = Math.floor(Date.now() / 1000) - 8 * 24 * 60 * 60;
    const initData = buildInitData({ auth_date: eightDaysAgo.toString() });
    expect(() => validateTelegramInitData(initData, BOT_TOKEN)).toThrow(TelegramAuthError);
  });

  it("rejects missing initData", () => {
    expect(() => validateTelegramInitData("", BOT_TOKEN)).toThrow(TelegramAuthError);
  });
});
