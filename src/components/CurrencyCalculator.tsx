'use client';

import React, { useState } from 'react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';

export const CurrencyCalculator: React.FC = () => {
  const { isLoading, isLive, getRate } = useExchangeRates();
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('RUB');

  const convert = () => {
    const rate = getRate(fromCurrency, toCurrency) ?? 1;
    return amount * rate;
  };

  return (
    <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700/60">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
          Конвертер валют
        </h3>
        <button
          onClick={() => {
              
          }}
          className="p-1 text-gray-400 hover:text-violet-500 transition"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400">Сумма</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl text-sm border-none font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 items-center">
          <div>
            <label className="text-xs text-gray-400">Из</label>
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl text-sm border-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="RUB">RUB</option>
              <option value="BYN">BYN</option>
              <option value="USDT">USDT</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400">В</label>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="w-full mt-1 p-2.5 bg-gray-50 dark:bg-zinc-900 rounded-xl text-sm border-none"
            >
              <option value="RUB">RUB</option>
              <option value="BYN">BYN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="USDT">USDT</option>
            </select>
          </div>
        </div>

        <div className="p-3 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-center mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Результат:</span>
          <p className="text-lg font-extrabold text-violet-600 dark:text-violet-400">
            {convert().toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {toCurrency}
          </p>
        </div>
      </div>
    </div>
  );
};