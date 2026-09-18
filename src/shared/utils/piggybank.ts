import type { Goal, PiggybankSettings } from '@/shared/types/finance';

// ============================================================================
// Логика "Копилки": авто-округление расходов в пользу выбранной цели
// ============================================================================

export interface RoundUpResult {
  /** Сумма, до которой округлён расход (спишется со счёта) */
  roundedAmount: number;
  /** Разница, которая уходит в копилку */
  savedAmount: number;
}

/**
 * Округляет сумму расхода вверх до ближайшего кратного roundTo.
 * Пример: amount=180, roundTo=200 → { roundedAmount: 200, savedAmount: 20 }.
 * Если сумма уже кратна roundTo — округление не требуется (savedAmount: 0).
 */
export function calculateRoundUp(amount: number, roundTo: number): RoundUpResult {
  if (roundTo <= 0 || amount <= 0) return { roundedAmount: amount, savedAmount: 0 };

  const roundedAmount = Math.ceil(amount / roundTo) * roundTo;
  const savedAmount = Math.round((roundedAmount - amount) * 100) / 100;

  return { roundedAmount, savedAmount };
}

export interface ApplyPiggybankResult {
  savedAmount: number;
  nextSettings: PiggybankSettings;
  nextGoal: Goal | undefined;
}

/**
 * Применяет настройки копилки к конкретной расходной операции.
 * Ничего не мутирует — возвращает обновлённые totalSaved и currentAmount цели.
 */
export function applyPiggybankToExpense(
  expenseAmount: number,
  settings: PiggybankSettings,
  goal: Goal | undefined,
): ApplyPiggybankResult {
  if (!settings.enabled || !goal) {
    return { savedAmount: 0, nextSettings: settings, nextGoal: goal };
  }

  const { savedAmount } = calculateRoundUp(expenseAmount, settings.roundTo);
  if (savedAmount <= 0) {
    return { savedAmount: 0, nextSettings: settings, nextGoal: goal };
  }

  return {
    savedAmount,
    nextSettings: { ...settings, totalSaved: Math.round((settings.totalSaved + savedAmount) * 100) / 100 },
    nextGoal: { ...goal, currentAmount: goal.currentAmount + savedAmount, updatedAt: new Date().toISOString() },
  };
}
