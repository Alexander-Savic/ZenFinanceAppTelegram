import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomePage from '@/app/page';

// Мокаем компоненты, использующие Canvas/Charts или внешние либы
vi.mock('@/widgets/analytics-charts/AnalyticsCharts', () => ({
  AnalyticsCharts: () => <div data-testid="analytics-charts">Analytics Charts Widget</div>,
}));

describe('Integration test for HomePage', () => {
  it('renders overall balance header', () => {
    render(<HomePage />);
    expect(screen.getByText('Общий баланс')).toBeInTheDocument();
  });

  it('switches tabs correctly via BottomNav', () => {
    render(<HomePage />);
    
    // Находим именно КНОПКУ в нижнем меню "Счета"
    const accountsBtn = screen.getByRole('button', { name: /счета/i });
    fireEvent.click(accountsBtn);

    // Проверяем смену экрана на "Мои Счета и Кошельки"
    expect(screen.getByText('Мои Счета и Кошельки')).toBeInTheDocument();
  });
});