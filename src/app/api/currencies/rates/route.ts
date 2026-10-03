import { NextResponse } from "next/server";

export const revalidate = 43200;

export async function GET() {
  try {
    const nbrbRes = await fetch("https://api.nbrb.by/exrates/rates?periodicity=0", {
      next: { revalidate: 43200 },
    });

    const cryptoRes = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
      { next: { revalidate: 3600 } }
    );

    const nbrbData = await nbrbRes.json();
    const cryptoData = await cryptoRes.json();

    const rates: Record<string, number> = {
      BYN: 1.0,
    };

    if (Array.isArray(nbrbData)) {
      nbrbData.forEach((item: any) => {
        if (item.Cur_Abbreviation && item.Cur_OfficialRate && item.Cur_Scale) {
          rates[item.Cur_Abbreviation] = item.Cur_OfficialRate / item.Cur_Scale;
        }
      });
    }

    const usdToByn = rates["USD"] || 3.25;
    if (cryptoData.bitcoin?.usd) {
      rates["BTC"] = cryptoData.bitcoin.usd * usdToByn;
    }
    if (cryptoData.ethereum?.usd) {
      rates["ETH"] = cryptoData.ethereum.usd * usdToByn;
    }

    return NextResponse.json({ rates, base: "BYN", updatedAt: new Date() });
  } catch (err) {
    console.error("NBRB Rates Fetch Error:", err);

    const fallbackRates: Record<string, number> = {
      BYN: 1.0,
      USD: 3.25,
      EUR: 3.55,
      RUB: 0.035,
      BTC: 210000,
      ETH: 8500,
    };

    return NextResponse.json({ rates: fallbackRates, base: "BYN" });
  }
}