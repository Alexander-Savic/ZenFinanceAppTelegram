'use client';

import { useState } from 'react';
import { Category, TransactionType } from '@/shared/types/finance';
import { Plus, Trash2 } from 'lucide-react';

const DEFAULT_ICONS = ['☕', '🛒', '🚗', '🏠', '🎮', '💊', '✈️', '💼', '🎁', '📱', '🏋️', '🎓'];
const DEFAULT_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'];

interface CategoryManagerProps {
  categories: Category[];
  onAddCategory?: (category: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryManager({ categories, onAddCategory, onDeleteCategory }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<Extract<TransactionType, 'expense' | 'income'>>('expense');
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [color, setColor] = useState('#3B82F6');
  const [budgetLimit, setBudgetLimit] = useState('');

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (onAddCategory) {
      onAddCategory({
        name: name.trim(),
        icon,
        color,
        type: activeTab,
        budgetLimit: budgetLimit ? Number(budgetLimit) : undefined,
      });
    }

    setName('');
    setBudgetLimit('');
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-2xl bg-slate-200/60 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('expense')}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'expense'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Категории расходов
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('income')}
          className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
            activeTab === 'income'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Категории доходов
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: `${cat.color || '#3B82F6'}15`, color: cat.color || '#3B82F6' }}
              >
                {cat.icon || '📁'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                {cat.budgetLimit && (
                  <p className="text-xs text-slate-400">
                    Лимит: <span className="font-medium text-slate-600">${cat.budgetLimit}</span>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteCategory(cat.id)}
              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              title="Удалить категорию"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {!isAdding ? (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3.5 text-xs font-semibold text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600 bg-white/50"
        >
          <Plus className="h-4 w-4" /> Добавить новую категорию
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Новая категория ({activeTab === 'expense' ? 'Расход' : 'Доход'})
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Отмена
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400">Название</label>
            <input
              type="text"
              required
              placeholder="Например: Продукты, Такси..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400">Иконка</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DEFAULT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition ${
                    icon === i ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400">Цвет</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DEFAULT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-slate-900 ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          {activeTab === 'expense' && (
            <div>
              <label className="text-xs font-medium text-slate-400">Лимит бюджета в месяц (опционально)</label>
              <input
                type="number"
                placeholder="Например: 300"
                value={budgetLimit}
                onChange={(e) => setBudgetLimit(e.target.value)}
                className="mt-1 w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
          >
            Сохранить категорию
          </button>
        </form>
      )}
    </div>
  );
}