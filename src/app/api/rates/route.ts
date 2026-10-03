import { NextResponse } from "next/server";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  RUB: 92.5,
  BYN: 3.28,
  KZT: 495,
  USDT: 1,
  BTC: 0.000011,
  ETH: 0.00029,
};

export async function GET() {
  try {
    await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  return NextResponse.json({
    base: "USD",
    rates: USD_RATES,
    asOf: new Date().toISOString(),
    isLive: false, 
  });
}
