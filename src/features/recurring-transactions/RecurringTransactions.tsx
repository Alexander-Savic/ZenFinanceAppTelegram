'use client';

import { useState } from 'react';
import { Calendar, RefreshCw, Plus, Trash2 } from 'lucide-react';
import type { Category, Account } from '@/shared/types/finance';

export interface RecurringPayment {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  frequency: 'monthly' | 'weekly' | 'yearly';
  nextDate: string;
  categoryId: string;
  accountId: string;
}

interface RecurringTransactionsProps {
  categories: Category[];
  accounts: Account[];
}

export function RecurringTransactions({ categories, accounts }: RecurringTransactionsProps) {
  const [payments, setPayments] = useState<RecurringPayment[]>([
    {
      id: 'rec-1',
      title: 'Подписка Telegram Premium',
      amount: 4.99,
      type: 'expense',
      frequency: 'monthly',
      nextDate: '2026-10-01',
      categoryId: 'cat-3',
      accountId: 'acc-1',
    },
    {
      id: 'rec-2',
      title: 'Зарплата',
      amount: 2500,
      type: 'income',
      frequency: 'monthly',
      nextDate: '2026-10-05',
      categoryId: 'cat-4',
      accountId: 'acc-1',
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [nextDate, setNextDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const newPayment: RecurringPayment = {
      id: `rec-${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      type,
      frequency,
      nextDate: nextDate || new Date().toISOString().split('T')[0],
      categoryId: categories[0]?.id || '',
      accountId: accounts[0]?.id || '',
    };

    setPayments((prev) => [...prev, newPayment]);
    setTitle('');
    setAmount('');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-emerald-600" /> Регулярные платежи
        </h3>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" /> Добавить
          </button>
        )}
      </div>

      {/* Список регулярных подписок / платежей */}
      <div className="flex flex-col gap-2.5">
        {payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${
                  p.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}
              >
                <RefreshCw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{p.title}</p>
                <p className="text-xs text-slate-400">
                  {p.frequency === 'monthly' ? 'Ежемесячно' : p.frequency === 'weekly' ? 'Еженедельно' : 'Ежегодно'} •{' '}
                  Списание: {p.nextDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold tabular-nums ${p.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                {p.type === 'income' ? '+' : '-'}${p.amount}
              </span>
              <button
                onClick={() => handleDelete(p.id)}
                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Форма добавления */}
      {isAdding && (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-2xl bg-white p-4 border border-slate-100 shadow-md">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-700">Новый регулярный платеж</span>
            <button type="button" onClick={() => setIsAdding(false)} className="text-xs text-slate-400">
              Отмена
            </button>
          </div>

          <div className="flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${type === 'expense' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Расход
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${type === 'income' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
            >
              Доход
            </button>
          </div>

          <input
            type="text"
            placeholder="Название (например: Аренда, Подписка)"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Сумма"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="monthly">Ежемесячно</option>
              <option value="weekly">Еженедельно</option>
              <option value="yearly">Ежегодно</option>
            </select>
          </div>

          <input
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
            className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
          />

          <button
            type="submit"
            className="mt-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            Сохранить платеж
          </button>
        </form>
      )}
    </div>
  );
}