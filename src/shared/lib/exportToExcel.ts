import ExcelJS from 'exceljs';
import type { Account, Category, Transaction } from '@/shared/types/finance';

const TYPE_LABEL: Record<Transaction['type'], string> = {
  income: 'Доход',
  expense: 'Расход',
  transfer: 'Перевод',
};

const PRIMARY_ARGB = 'FF4F46E5';

export interface ExportExcelOptions {
  filename?: string;
  sheetName?: string;
}

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Record<string, Category>,
  accounts: Record<string, Account>,
  options: ExportExcelOptions = {},
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Finance Tracker';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName ?? 'Операции', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Дата', key: 'date', width: 12 },
    { header: 'Время', key: 'time', width: 8 },
    { header: 'Тип', key: 'type', width: 12 },
    { header: 'Категория', key: 'category', width: 20 },
    { header: 'Счёт', key: 'account', width: 18 },
    { header: 'Сумма', key: 'amount', width: 14 },
    { header: 'Валюта', key: 'currency', width: 8 },
    { header: 'Теги', key: 'tags', width: 24 },
    { header: 'Комментарий', key: 'comment', width: 32 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIMARY_ARGB } };
  headerRow.alignment = { vertical: 'middle' };
  headerRow.height = 22;

  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? -1 : 1));
  let totalIncome = 0;
  let totalExpense = 0;

  sorted.forEach((t, index) => {
    const account = accounts[t.accountId];
    const category = categories[t.categoryId];
    const date = new Date(t.date);

    if (t.type === 'income') totalIncome += t.amount;
    if (t.type === 'expense') totalExpense += t.amount;

    const row = sheet.addRow({
      date: date.toLocaleDateString('ru-RU'),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      type: TYPE_LABEL[t.type],
      category: category?.name ?? '—',
      account: account?.name ?? '—',
      amount: t.type === 'expense' ? -t.amount : t.amount,
      currency: account?.currency ?? 'RUB',
      tags: (t.tags ?? []).join(', '),
      comment: t.comment ?? '',
    });

    row.getCell('amount').numFmt = '#,##0;[Red]-#,##0';
    row.getCell('amount').font = { color: { argb: t.type === 'income' ? 'FF059669' : 'FF12131A' } };
    if (index % 2 === 1) {
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9FB' } };
    }
  });

  sheet.addRow({});

  const incomeRow = sheet.addRow({ category: 'Доходы', amount: totalIncome });
  incomeRow.font = { bold: true, color: { argb: 'FF059669' } };
  incomeRow.getCell('amount').numFmt = '#,##0';

  const expenseRow = sheet.addRow({ category: 'Расходы', amount: -totalExpense });
  expenseRow.font = { bold: true };
  expenseRow.getCell('amount').numFmt = '#,##0';

  const netRow = sheet.addRow({ category: 'Итого', amount: totalIncome - totalExpense });
  netRow.font = { bold: true };
  netRow.getCell('amount').numFmt = '#,##0';
  netRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFEFFB' } };

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBuffer(
    buffer,
    options.filename ?? `operations-${new Date().toISOString().slice(0, 10)}.xlsx`,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

function downloadBuffer(buffer: ExcelJS.Buffer, filename: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}