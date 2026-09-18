'use client';

import { useState } from 'react';
import { Plus, CreditCard, Wallet, Coins, PiggyBank, Trash2, Check } from 'lucide-react';
import { Account, AccountType } from '@/shared/types/finance';

interface AccountManagerProps {
  accounts: Account[];
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
}

// Доступные стили карточек (градиенты и цвета)
const CARD_GRADIENTS = [
  { name: 'Emerald', bg: 'bg-gradient-to-br from-emerald-600 to-teal-800', color: '#10B981' },
  { name: 'Midnight', bg: 'bg-gradient-to-br from-slate-900 to-slate-800', color: '#0F172A' },
  { name: 'Indigo Neon', bg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500', color: '#6366F1' },
  { name: 'Sunset Gold', bg: 'bg-gradient-to-br from-amber-500 to-rose-500', color: '#F59E0B' },
  { name: 'Crypto Cyan', bg: 'bg-gradient-to-br from-cyan-500 to-blue-700', color: '#06B6D4' },
];

const CURRENCIES = ['USD', 'EUR', 'BYN', 'RUB', 'BTC', 'USDT'];

export function AccountManager({ accounts, onAddAccount, onDeleteAccount }: AccountManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedType, setSelectedType] = useState<AccountType>('card');

  // Поля формы
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedGradient, setSelectedGradient] = useState(CARD_GRADIENTS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let icon = '💳';
    if (selectedType === 'cash') icon = '💵';
    if (selectedType === 'crypto') icon = '🪙';
    if (selectedType === 'savings') icon = '🏦';

    onAddAccount({
      name: name.trim(),
      type: selectedType,
      balance: Number(balance) || 0,
      currency,
      color: selectedGradient.color,
      icon,
    });

    // Сброс
    setName('');
    setBalance('');
    setIsAdding(false);
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'card':
      case 'bank':
        return <CreditCard className="h-5 w-5" />;
      case 'cash':
        return <Wallet className="h-5 w-5" />;
      case 'crypto':
        return <Coins className="h-5 w-5" />;
      case 'savings':
        return <PiggyBank className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Карусель визуальных карточек счетов */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:none]">
        {accounts.map((acc) => {
          const matchedGrad = CARD_GRADIENTS.find((g) => g.color === acc.color) || CARD_GRADIENTS[0];
          return (
            <div
              key={acc.id}
              className={`relative flex min-w-[220px] flex-col justify-between rounded-3xl p-5 text-white shadow-lg transition-transform hover:-translate-y-1 ${matchedGrad.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                  {getAccountIcon(acc.type)}
                </span>
                <span className="text-xs font-semibold tracking-wider text-white/70 uppercase">
                  {acc.currency}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-xs text-white/70 font-medium">{acc.name}</p>
                <h3 className="mt-0.5 text-2xl font-extrabold tracking-tight tabular-nums">
                  {acc.balance.toLocaleString()} {acc.currency}
                </h3>
              </div>

              {/* Удаление счета */}
              <button
                type="button"
                onClick={() => onDeleteAccount(acc.id)}
                className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white transition-colors"
                title="Удалить счет"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Кнопка или Форма добавления нового счета */}
      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-xs font-semibold text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600 bg-white"
        >
          <Plus className="h-4 w-4" /> Добавить новый счет или кошелек
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">Добавление нового счета</h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Отмена
            </button>
          </div>

          {/* Выбор типа счета */}
          <div>
            <label className="text-xs font-medium text-slate-400">Тип счета</label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {[
                { type: 'card' as AccountType, label: 'Карта', icon: CreditCard },
                { type: 'cash' as AccountType, label: 'Наличные', icon: Wallet },
                { type: 'crypto' as AccountType, label: 'Крипта', icon: Coins },
                { type: 'savings' as AccountType, label: 'Копилка', icon: PiggyBank },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType(item.type)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl p-3 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Название и Валюта */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-400">Название счета</label>
              <input
                type="text"
                required
                placeholder="Напр: Visa Gold, Tether, Кошелек..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400">Валюта</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Начальный баланс */}
          <div>
            <label className="text-xs font-medium text-slate-400">Начальный баланс</label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 font-semibold"
            />
          </div>

          {/* Выбор визуального оформления (Градиента) */}
          <div>
            <label className="text-xs font-medium text-slate-400">Дизайн карты</label>
            <div className="mt-1.5 flex gap-2.5">
              {CARD_GRADIENTS.map((grad) => (
                <button
                  key={grad.name}
                  type="button"
                  onClick={() => setSelectedGradient(grad)}
                  className={`relative h-9 flex-1 rounded-xl shadow-sm transition-transform ${grad.bg} ${
                    selectedGradient.name === grad.name ? 'scale-105 ring-2 ring-emerald-500 ring-offset-2' : ''
                  }`}
                >
                  {selectedGradient.name === grad.name && (
                    <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
          >
            Создать счет
          </button>
        </form>
      )}
    </div>
  );
}