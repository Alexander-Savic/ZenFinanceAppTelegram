import { createHmac } from "crypto";
import { z } from "zod";

/**
 * Validates Telegram WebApp `initData` per the official spec:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Algorithm:
 *   1. secret_key = HMAC_SHA256(bot_token, key="WebAppData")
 *   2. data_check_string = all fields except `hash`, sorted alphabetically,
 *      joined as "key=value" with "\n"
 *   3. computed_hash = HMAC_SHA256(data_check_string, key=secret_key), hex
 *   4. valid iff computed_hash === hash (timing-safe compare)
 *   5. reject if auth_date is older than the configured max age (replay protection)
 */

const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60; // 24h — tune to your session policy

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  photo_url: z.string().optional(),
  is_premium: z.boolean().optional(),
});

export type TelegramUser = z.infer<typeof telegramUserSchema>;

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  raw: string;
}

export class TelegramAuthError extends Error {}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function validateTelegramInitData(
  initData: string,
  botToken: string = process.env.TELEGRAM_BOT_TOKEN!
): ValidatedInitData {
  if (!initData) throw new TelegramAuthError("Missing initData");
  if (!botToken) throw new TelegramAuthError("Server misconfigured: no bot token");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new TelegramAuthError("initData missing hash");

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!timingSafeEqualHex(computedHash, hash)) {
    throw new TelegramAuthError("Invalid initData signature");
  }

  const authDate = Number(params.get("auth_date"));
  if (!authDate || Date.now() / 1000 - authDate > MAX_AUTH_AGE_SECONDS) {
    throw new TelegramAuthError("initData expired");
  }

  const userRaw = params.get("user");
  if (!userRaw) throw new TelegramAuthError("initData missing user");

  const user = telegramUserSchema.parse(JSON.parse(userRaw));

  return { user, authDate, raw: initData };
}
