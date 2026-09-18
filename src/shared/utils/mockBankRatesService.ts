import type { CurrencyCode } from '@/shared/types/finance';

// ============================================================================
// Mock-сервис банковских курсов.
// Структура спроектирована так, чтобы реальный запрос к API банка подменил
// только тело fetchBankRates — сигнатура и форма ответа не меняются.
// ============================================================================

export interface Bank {
  id: string;
  name: string;
}

export interface BankRate {
  currency: CurrencyCode;
  /** По какому курсу банк покупает валюту у клиента (даёт ₽) */
  buy: number;
  /** По какому курсу банк продаёт валюту клиенту (клиент отдаёт ₽) */
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

// Базовые курсы (условные, для демонстрации) — от них считается спред каждого банка
const BASE_RATES: Record<string, number> = {
  USD: 97.2,
  EUR: 104.8,
  KZT: 0.2,
  BYN: 30.1,
  UAH: 2.35,
};

// Спред банка относительно базового курса (buy ниже базы, sell — выше)
const BANK_SPREAD: Record<string, number> = {
  cbrf: 0,
  tbank: 0.012,
  sber: 0.018,
  alfa: 0.015,
};

function seededJitter(seed: string): number {
  // Небольшое псевдослучайное отклонение, стабильное для (банк, валюта, минута) —
  // курс "меняется" между обновлениями, но не скачет на каждый рендер
  const bucket = Math.floor(Date.now() / 60_000);
  let hash = 0;
  for (const char of `${seed}-${bucket}`) hash = (hash * 31 + char.charCodeAt(0)) % 1000;
  return (hash / 1000 - 0.5) * 0.006; // ±0.3%
}

/**
 * Имитация запроса к API конкретного банка. В продакшене здесь будет
 * fetch(`https://api.<bank>.ru/exchange-rates`, { headers: { Authorization: ... } }).
 */
export async function fetchBankRates(bankId: string): Promise<BankRatesResponse> {
  await new Promise((resolve) => setTimeout(resolve, 350 + Math.random() * 250)); // имитация сетевой задержки

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

// ============================================================================
// Конвертация с использованием курсов банка (кросс-курс через ₽)
// ============================================================================

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
