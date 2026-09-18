import type { CurrencyCode } from '@/shared/types/finance';

export interface Bank {
  id: string;
  name: string;
}

export interface BankRate {
  currency: CurrencyCode;
  buy: number;
  sell: number;
}

export interface BankRatesResponse {
  bankId: string;
  base: 'RUB';
  rates: BankRate[];
  updatedAt: string;
}

export const BANKS: Bank[] = [
  { id: 'cbrf', name: 'Центробанк РФ' },
  { id: 'tbank', name: 'Т-Банк' },
  { id: 'sber', name: 'Сбербанк' },
  { id: 'alfa', name: 'Альфа-Банк' },
];

const BASE_RATES: Record<string, number> = {
  USD: 97.2,
  EUR: 104.8,
  KZT: 0.2,
  BYN: 30.1,
  UAH: 2.35,
};

const BANK_SPREAD: Record<string, number> = {
  cbrf: 0,
  tbank: 0.012,
  sber: 0.018,
  alfa: 0.015,
};

function seededJitter(seed: string): number {
  const bucket = Math.floor(Date.now() / 60_000);
  let hash = 0;
  for (const char of `${seed}-${bucket}`) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return (hash / 1000 - 0.5) * 0.006; // ±0.3%
}

export async function fetchBankRates(bankId: string): Promise<BankRatesResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250)); 

  const spread = BANK_SPREAD[bankId] ?? 0.015;

  const rates: BankRate[] = Object.entries(BASE_RATES).map(([currency, base]) => {
    const jitter = seededJitter(`${bankId}-${currency}`);
    const adjusted = base * (1 + jitter);
    const precision = currency === 'KZT' || currency === 'UAH' ? 4 : 2;
    return {
      currency,
      buy: Number((adjusted * (1 - spread)).toFixed(precision)),
      sell: Number((adjusted * (1 + spread)).toFixed(precision)),
    };
  });

  return { bankId, base: 'RUB', rates, updatedAt: new Date().toISOString() };
}

export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode, rates: BankRate[]): number | null {
  if (from === to) return amount;

  const findRate = (currency: string) => rates.find((r) => r.currency === currency);

  if (from === 'RUB') {
    const rate = findRate(to);
    return rate ? amount / rate.sell : null;
  }
  if (to === 'RUB') {
    const rate = findRate(from);
    return rate ? amount * rate.buy : null;
  }

  const fromRate = findRate(from);
  const toRate = findRate(to);
  if (!fromRate || !toRate) return null;

  const rub = amount * fromRate.buy;
  return rub / toRate.sell;
}
