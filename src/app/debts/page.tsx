'use client';

import React, { useEffect, useState } from 'react';
import { useDebtStore } from '@/store/useDebtStore';
import { Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Trash2, Calendar } from 'lucide-react';

export default function DebtsPage() {
  const { debts, fetchDebts, addDebt, updateDebtStatus, deleteDebt, isLoading } = useDebtStore();
  const [isOpen, setIsOpen] = useState(false);

  // Форма добавления
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'OWES_ME' | 'I_OWE'>('OWES_ME');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName || !amount) return;

    await addDebt({
      personName,
      amount: parseFloat(amount),
      type,
      dueDate: dueDate || undefined,
      description,
    });

    setPersonName('');
    setAmount('');
    setDueDate('');
    setDescription('');
    setIsOpen(false);
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Долги и Должники</h1>
          <p className="text-xs text-gray-500">Учет взаимных расчетов</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg hover:bg-violet-700 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Список Долгов */}
      <div className="space-y-3">
        {debts.length === 0 && !isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            У вас пока нет активных долгов или должников.
          </div>
        ) : (
          debts.map((debt) => (
            <div
              key={debt.id}
              className={`p-4 rounded-2xl bg-white dark:bg-zinc-800 border ${
                debt.status === 'PAID'
                  ? 'border-gray-200 dark:border-zinc-700 opacity-60'
                  : 'border-violet-100 dark:border-zinc-700/50 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      debt.type === 'OWES_ME'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400'
                    }`}
                  >
                    {debt.type === 'OWES_ME' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {debt.personName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {debt.type === 'OWES_ME' ? 'Должен мне' : 'Я должен'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className={`font-bold ${
                      debt.type === 'OWES_ME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {debt.amount.toLocaleString('ru-RU')} {debt.currency}
                  </p>
                  {debt.dueDate && (
                    <span className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(debt.dueDate).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>

              {/* Действия с долгом */}
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700/50">
                {debt.status !== 'PAID' && (
                  <button
                    onClick={() => updateDebtStatus(debt.id, 'PAID')}
                    className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Отметить погашенным
                  </button>
                )}
                <button
                  onClick={() => deleteDebt(debt.id)}
                  className="text-gray-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно добавления долга */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Новая запись о долге</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Имя человека / Контакт</label>
                <input
                  type="text"
                  required
                  value={personName}
                  onChange={(e) => setPersonName(e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Иван Петров"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Сумма</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-violet-500"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Тип</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full mt-1 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="OWES_ME">Мне должны</option>
                    <option value="I_OWE">Я должен</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">Дата возврата (опционально)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full mt-1 p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl text-sm border-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-1/2 py-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 rounded-xl font-medium text-sm"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-violet-600 text-white rounded-xl font-medium text-sm hover:bg-violet-700"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}