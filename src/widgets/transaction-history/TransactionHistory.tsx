'use client';

import { useState } from 'react';
import { Search, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Filter, Calendar } from 'lucide-react';
import { ShareTransaction } from '@/features/share-transaction/ShareTransaction';
import type { Transaction, Category, Account } from '@/shared/types/finance';

interface TransactionHistoryProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
}

export function TransactionHistory({ transactions, categories, accounts }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Фильтрация
  const filteredTransactions = transactions.filter((tx) => {
    // Поиск по описанию/комментарию
    const matchesSearch = tx.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Фильтр по типу
    const matchesType = selectedType === 'all' || tx.type === selectedType;

    // Фильтр по категории
    const matchesCategory = selectedCategoryId === 'all' || tx.categoryId === selectedCategoryId;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Строка поиска */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white px-4 py-3 border border-slate-100 shadow-sm">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по комментарию или тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Панель фильтров: Все / Расход / Доход */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        <button
          onClick={() => setSelectedType('all')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            selectedType === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-100'
          }`}
        >
          Все
        </button>
        <button
          onClick={() => setSelectedType('expense')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            selectedType === 'expense'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-100'
          }`}
        >
          Расходы
        </button>
        <button
          onClick={() => setSelectedType('income')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
            selectedType === 'income'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-100'
          }`}
        >
          Доходы
        </button>

        {/* Селект категории */}
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none"
        >
          <option value="all">Все категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Список отфильтрованных операций */}
      <div className="flex flex-col gap-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center border border-slate-100">
            <p className="text-sm font-medium text-slate-400">Операции не найдены</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const category = categories.find((c) => c.id === tx.categoryId);
            const account = accounts.find((a) => a.id === tx.accountId);

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${
                      tx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {category?.icon || (tx.type === 'income' ? '💰' : '☕')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {tx.comment || category?.name || 'Операция'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{account?.name || 'Счет'}</span>
                      {tx.tags && tx.tags.length > 0 && (
                        <span>• #{tx.tags.join(', #')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-bold tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('ru-RU')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(tx.date).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  {/* Чек транзакции */}
                  <ShareTransaction
                    transaction={tx}
                    category={category || categories[0]}
                    account={account || accounts[0]}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}