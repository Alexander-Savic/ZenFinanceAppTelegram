'use client';

import { type FC } from 'react';
import { PiggyBank } from 'lucide-react';
import type { Goal, PiggybankSettings } from '@/shared/types/finance';
import { calculateRoundUp } from '@/shared/utils/piggybank';

const ROUND_OPTIONS = [10, 50, 100];

function formatDeadline(deadline?: string | null): string | null {
  if (!deadline) return null;
  const target = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return 'Срок прошёл';
  if (days === 0) return 'Сегодня последний день';
  return `Осталось ${days} дн.`;
}

// ---- Прогресс одной цели ---------------------------------------------------

const GoalRow: FC<{ goal: Goal; onSelect?: (goal: Goal) => void }> = ({ goal, onSelect }) => {
  const percent = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
  const deadlineLabel = formatDeadline(goal.deadline);

  return (
    <button onClick={() => onSelect?.(goal)} className="flex w-full flex-col gap-2 rounded-2xl bg-white p-4 text-left">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-black/80">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full text-base"
            style={{ backgroundColor: `${goal.color ?? '#4F46E5'}1A` }}
          >
            {goal.icon ?? '🎯'}
          </span>
          {goal.name}
        </span>
        <span className="text-xs font-medium tabular-nums text-black/50">{percent.toFixed(0)}%</span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-black/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: goal.color ?? 'var(--primary)' }}
        />
      </div>

      <div className="flex items-baseline justify-between text-xs text-black/40">
        <span className="tabular-nums">
          {goal.currentAmount.toLocaleString('ru-RU')} / {goal.targetAmount.toLocaleString('ru-RU')}{' '}
          {goal.currency === 'RUB' ? '₽' : goal.currency}
        </span>
        {deadlineLabel && <span>{deadlineLabel}</span>}
      </div>
    </button>
  );
};

// ---- Карточка копилки -------------------------------------------------------

interface PiggybankCardProps {
  settings: PiggybankSettings;
  goals: Goal[];
  onToggle: (enabled: boolean) => void;
  onChangeRoundTo: (value: number) => void;
  onChangeTargetGoal: (goalId: string) => void;
}

const PiggybankCard: FC<PiggybankCardProps> = ({ settings, goals, onToggle, onChangeRoundTo, onChangeTargetGoal }) => {
  const preview = calculateRoundUp(180, settings.roundTo);

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-black/80">
          <PiggyBank className="h-4 w-4" style={{ color: 'var(--primary)' }} />
          Копилка
        </span>
        <button
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => onToggle(!settings.enabled)}
          className="relative h-6 w-10 rounded-full transition-colors"
          style={{ backgroundColor: settings.enabled ? 'var(--primary)' : 'rgba(0,0,0,0.15)' }}
        >
          <span
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: settings.enabled ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-black/45">Округлять расход до</p>
            <div className="flex gap-2">
              {ROUND_OPTIONS.map((value) => (
                <button
                  key={value}
                  onClick={() => onChangeRoundTo(value)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={
                    settings.roundTo === value
                      ? { backgroundColor: 'var(--primary)', color: '#fff' }
                      : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.6)' }
                  }
                >
                  {value} ₽
                </button>
              ))}
            </div>
          </div>

          {goals.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-black/45">Копим на цель</p>
              <select
                value={settings.targetGoalId}
                onChange={(e) => onChangeTargetGoal(e.target.value)}
                className="rounded-xl bg-black/[0.04] px-3 py-2 text-sm text-black/80 focus:outline-none"
              >
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-black/45">
            Например: расход 180 ₽ округлится до {preview.roundedAmount} ₽ — {preview.savedAmount} ₽ уйдут в копилку.
          </p>
        </>
      )}

      <div className="flex items-baseline justify-between border-t border-black/5 pt-3">
        <span className="text-xs text-black/45">Всего накоплено округлениями</span>
        <span className="text-sm font-semibold tabular-nums text-black/80">
          {settings.totalSaved.toLocaleString('ru-RU')} ₽
        </span>
      </div>
    </div>
  );
};

// ---- GoalsAndPiggybank -------------------------------------------------------

export interface GoalsAndPiggybankProps {
  goals: Goal[];
  piggybank: PiggybankSettings;
  onSelectGoal?: (goal: Goal) => void;
  onTogglePiggybank: (enabled: boolean) => void;
  onChangeRoundTo: (value: number) => void;
  onChangeTargetGoal: (goalId: string) => void;
}

export const GoalsAndPiggybank: FC<GoalsAndPiggybankProps> = ({
  goals,
  piggybank,
  onSelectGoal,
  onTogglePiggybank,
  onChangeRoundTo,
  onChangeTargetGoal,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {goals.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-center">
          <p className="text-sm font-medium text-black/60">Целей пока нет</p>
          <p className="mt-1 text-xs text-black/40">Создайте первую цель, чтобы включить копилку</p>
        </div>
      ) : (
        goals.map((goal) => <GoalRow key={goal.id} goal={goal} onSelect={onSelectGoal} />)
      )}

      <PiggybankCard
        settings={piggybank}
        goals={goals}
        onToggle={onTogglePiggybank}
        onChangeRoundTo={onChangeRoundTo}
        onChangeTargetGoal={onChangeTargetGoal}
      />
    </div>
  );
};
