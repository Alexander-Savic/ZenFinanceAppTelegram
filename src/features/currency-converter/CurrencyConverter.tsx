'use client';

import { useEffect, useMemo, useState, type FC } from 'react';
import { ArrowUpDown } from 'lucide-react';
import type { CurrencyCode } from '@/shared/types/finance';
import { BANKS, fetchBankRates, convertAmount, type BankRatesResponse } from '@/shared/utils/mockBankRatesService';

const CURRENCIES: CurrencyCode[] = ['RUB', 'USD', 'EUR', 'KZT', 'BYN', 'UAH'];

export const CurrencyConverter: FC = () => {
  const [bankId, setBankId] = useState(BANKS[0].id);
  const [amount, setAmount] = useState('1000');
  const [from, setFrom] = useState<CurrencyCode>('RUB');
  const [to, setTo] = useState<CurrencyCode>('USD');
  const [data, setData] = useState<BankRatesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchBankRates(bankId).then((response) => {
      if (!cancelled) {
        setData(response);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [bankId]);

  const result = useMemo(() => {
    if (!data) return null;
    const numeric = Number(amount.replace(',', '.'));
    if (!Number.isFinite(numeric)) return null;
    return convertAmount(numeric, from, to, data.rates);
  }, [data, amount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4">
      {/* Выбор банка */}
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BANKS.map((bank) => (
          <button
            key={bank.id}
            onClick={() => setBankId(bank.id)}
            className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={
              bankId === bank.id
                ? { backgroundColor: 'var(--primary)', color: '#fff' }
                : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }
            }
          >
            {bank.name}
          </button>
        ))}
      </div>

      {/* Поле "отдаёте" */}
      <div className="rounded-xl bg-black/[0.04] p-3">
        <p className="text-xs text-black/40">Отдаёте</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-transparent text-2xl font-semibold tabular-nums text-black/85 focus:outline-none"
          />
          <CurrencySelect value={from} onChange={setFrom} />
        </div>
      </div>

      {/* Поменять валюты местами */}
      <button
        onClick={swap}
        aria-label="Поменять валюты местами"
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/[0.05] text-black/50"
      >
        <ArrowUpDown className="h-4 w-4" />
      </button>

      {/* Поле "получаете" */}
      <div className="rounded-xl bg-black/[0.04] p-3">
        <p className="text-xs text-black/40">Получаете</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-2xl font-semibold tabular-nums text-black/85">
            {loading ? '···' : result !== null ? result.toLocaleString('ru-RU', { maximumFractionDigits: 2 }) : '—'}
          </p>
          <CurrencySelect value={to} onChange={setTo} />
        </div>
      </div>

      {data && (
        <p className="text-center text-[11px] text-black/35">
          Курс {BANKS.find((b) => b.id === bankId)?.name}, обновлено{' '}
          {new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(data.updatedAt))}
        </p>
      )}
    </div>
  );
};

const CurrencySelect: FC<{ value: CurrencyCode; onChange: (value: CurrencyCode) => void }> = ({ value, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="flex-shrink-0 rounded-lg bg-white px-2 py-1.5 text-sm font-medium text-black/70 focus:outline-none"
  >
    {CURRENCIES.map((currency) => (
      <option key={currency} value={currency}>
        {currency}
      </option>
    ))}
  </select>
);
