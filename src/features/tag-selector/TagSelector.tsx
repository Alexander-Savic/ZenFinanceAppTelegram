'use client';

import { useState } from 'react';
import { Tag as TagIcon, Plus, X } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
  availableTags?: string[];
}

const DEFAULT_SUGGESTED_TAGS = ['Еда', 'Транспорт', 'Развлечения', 'Зарплата', 'Подписки', 'Путешествия', 'Подарки', 'Техника'];

export function TagSelector({
  selectedTags,
  onChangeTags,
  availableTags = DEFAULT_SUGGESTED_TAGS,
}: TagSelectorProps) {
  const [newTagInput, setNewTagInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Добавление выбранного тега
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChangeTags(selectedTags.filter((t) => t !== tag));
    } else {
      onChangeTags([...selectedTags, tag]);
    }
  };

  // Создание нового кастомного тега
  const handleAddNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagInput.trim().replace(/^#/, ''); // удаляем решетку, если пользователь ввел ее
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChangeTags([...selectedTags, trimmed]);
      setNewTagInput('');
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <TagIcon className="h-3.5 w-3.5 text-slate-400" /> Теги операции
        </label>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" /> Новый тег
          </button>
        )}
      </div>

      {/* Выбранные теги */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleToggleTag(tag)}
                className="hover:text-emerald-900"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Поле ввода для нового тега */}
      {isAdding && (
        <form onSubmit={handleAddNewTag} className="flex gap-2">
          <input
            type="text"
            autoFocus
            placeholder="Название тега..."
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
          >
            Добавить
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Быстрые подсказки предложенных тегов */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => handleToggleTag(tag)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                isSelected
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}