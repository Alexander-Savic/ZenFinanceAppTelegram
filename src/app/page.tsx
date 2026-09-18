'use client';

import { useState, useMemo } from 'react';
import { Plus, Minus } from 'lucide-react';
import { BottomNav, type TabType } from '@/widgets/bottom-nav/BottomNav';
import { CurrencyConverter } from '@/features/currency-converter/CurrencyConverter';
import { GoalsAndPiggybank } from '@/widgets/goals-and-piggybank/GoalsAndPiggybank';
import { BudgetOverview } from '@/widgets/budget-overview/BudgetOverview';
import { RecurringTransactions } from '@/features/recurring-transactions/RecurringTransactions';
import { TransactionHistory } from '@/widgets/transaction-history/TransactionHistory';
import { AnalyticsCharts } from '@/widgets/analytics-charts/AnalyticsCharts';
import { AccountManager } from '@/widgets/account-manager/AccountManager';
import { CategoryManager } from '@/widgets/category-manager/CategoryManager';
import type { PiggybankSettings, Transaction, Category, Account } from '@/shared/types/finance';

const mockGoals = [
  { 
    id: 'g-1', 
    name: 'Новый MacBook', 
    targetAmount: 2000, 
    currentAmount: 650, 
    currency: 'USD', 
    icon: '💻', 
    color: '#3B82F6', 
    deadline: '2026-12-31'
  },
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Состояние Счетов
  const [accounts, setAccounts] = useState<Account[]>([
    { id: 'acc-1', name: 'Основная Visa', type: 'card', balance: 1240, currency: 'USD', color: '#10B981', icon: '💳' },
    { id: 'acc-2', name: 'Наличный кошелек', type: 'cash', balance: 350, currency: 'USD', color: '#0F172A', icon: '💵' },
    { id: 'acc-3', name: 'Крипто портфель', type: 'crypto', balance: 0.05, currency: 'BTC', color: '#06B6D4', icon: '🪙' },
  ]);

  const handleAddAccount = (newAcc: Omit<Account, 'id'>) => {
    setAccounts((prev) => [...prev, { ...newAcc, id: `acc-${Date.now()}` }]);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  // Состояние Категорий
  const [categories, setCategories] = useState<Category[]>([
    { id: 'cat-1', name: 'Еда и Кофейни', icon: '☕', color: '#10B981', type: 'expense', budgetLimit: 150 },
    { id: 'cat-2', name: 'Продукты', icon: '🛒', color: '#3B82F6', type: 'expense', budgetLimit: 400 },
    { id: 'cat-3', name: 'Транспорт', icon: '🚗', color: '#F59E0B', type: 'expense' },
    { id: 'cat-4', name: 'Зарплата', icon: '💼', color: '#10B981', type: 'income' },
  ]);

  const handleAddCategory = (category: Partial<Category>) => {
    if (!category.name) return;

    const safeId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `cat-${Date.now()}`;

    const newCategory: Category = {
      id: safeId,
      name: category.name,
      type: category.type ?? 'expense',
      icon: category.icon ?? '📁',
      color: category.color ?? '#6B7280',
      budgetLimit: category.budgetLimit,
    };

    setCategories((prev) => [...prev, newCategory]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Состояние Транзакций
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: 'tx-1', 
      amount: 4.5, 
      type: 'expense', 
      categoryId: 'cat-1', 
      accountId: 'acc-1', 
      date: new Date().toISOString(), 
      comment: 'Кофейня', 
      tags: ['Еда'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { 
      id: 'tx-2', 
      amount: 500, 
      type: 'income', 
      categoryId: 'cat-4', 
      accountId: 'acc-1', 
      date: new Date().toISOString(), 
      comment: 'Аванс', 
      tags: ['Зарплата'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [piggybank, setPiggybank] = useState<PiggybankSettings>({
    enabled: true,
    roundTo: 100,
    targetGoalId: 'g-1',
    totalSaved: 340,
  });

  // Преобразование массива категорий в Record<string, Category> специально для BudgetOverview
  const categoriesMap = useMemo(() => {
    return categories.reduce<Record<string, Category>>((acc, cat) => {
      acc[cat.id] = cat;
      return acc;
    }, {});
  }, [categories]);

  // Расчет общего баланса по USD счетам
  const totalBalance = useMemo(() => {
    return accounts
      .filter((acc) => acc.currency === 'USD')
      .reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      <div className="mx-auto max-w-md px-4 pt-4">

        {/* ----------------- ВКЛАДКА: ОБЗОР (HOME) ----------------- */}
        {activeTab === 'home' && (
          <div className="flex flex-col gap-5">
            {/* Баланс и быстрые действия */}
            <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl shadow-slate-900/10">
              <p className="text-xs text-slate-400">Общий баланс (USD)</p>
              <h1 className="mt-1 text-3xl font-bold tabular-nums text-emerald-400">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>

              <div className="mt-5 flex gap-3">
                <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-95">
                  <Plus className="h-4 w-4" /> Доход
                </button>
                <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-500 active:scale-95">
                  <Minus className="h-4 w-4" /> Расход
                </button>
              </div>
            </div>

            {/* Карточки счетов */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Счета</p>
              <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none]">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex min-w-[140px] flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <span className="text-xs text-slate-400">{acc.icon} {acc.name}</span>
                    <span className="mt-2 text-lg font-bold text-slate-800">{acc.balance} {acc.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BudgetOverview ждет Category[] */}
            <BudgetOverview categories={categories} transactions={transactions} />

            {/* TransactionHistory ждет массивы Category[] и Account[] */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">История операций</p>
              <TransactionHistory
                transactions={transactions}
                categories={categories}
                accounts={accounts}
              />
            </div>
          </div>
        )}

        {/* ----------------- ВКЛАДКА: СЧЕТА (ACCOUNTS) ----------------- */}
        {activeTab === 'accounts' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-slate-800">Мои Счета и Кошельки</h2>
            <AccountManager
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onDeleteAccount={handleDeleteAccount}
            />
          </div>
        )}

        {/* ----------------- ВКЛАДКА: АНАЛИТИКА (ANALYTICS) ----------------- */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-slate-800">Аналитика и Графики</h2>
            {/* AnalyticsCharts ждет Record<string, Category> */}
            <AnalyticsCharts transactions={transactions} categories={categoriesMap} />
            <CurrencyConverter />
          </div>
        )}

        {/* ----------------- ВКЛАДКА: ЦЕЛИ И КОПИЛКА (GOALS) ----------------- */}
        {activeTab === 'goals' && (
          <div className="flex flex-col gap-5">
            <h2 className="text-xl font-bold text-slate-800">Цели и Копилка</h2>
            <GoalsAndPiggybank
              goals={mockGoals}
              piggybank={piggybank}
              onTogglePiggybank={(enabled) => setPiggybank((prev) => ({ ...prev, enabled }))}
              onChangeRoundTo={(roundTo) => setPiggybank((prev) => ({ ...prev, roundTo }))}
              onChangeTargetGoal={(targetGoalId) => setPiggybank((prev) => ({ ...prev, targetGoalId }))}
            />
          </div>
        )}

        {/* ----------------- ВКЛАДКА: ЕЩЁ / НАСТРОЙКИ (SETTINGS) ----------------- */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-5">
            <RecurringTransactions categories={categories} accounts={accounts} />
            <h2 className="text-xl font-bold text-slate-800">Управление категориями</h2>
            <CategoryManager
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />

            <h2 className="pt-3 text-xl font-bold text-slate-800">Настройки</h2>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-sm shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-50 py-2">
                <span>Тема оформления</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Светлая</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-50 py-2">
                <span>Экспорт данных</span>
                <span className="text-xs font-semibold text-emerald-600">PDF / Excel</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span>Версия приложения</span>
                <span className="text-xs text-slate-400">v1.0.0</span>
              </div>
            </div>
          </div>
        )}

      </div>

      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}