import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { Account, Category, Transaction } from '@/shared/types/finance';

export interface ExportPdfOptions {
  title?: string;
  periodLabel?: string;
  filename?: string;
}

const TYPE_LABEL: Record<Transaction['type'], string> = {
  income: 'Доход',
  expense: 'Расход',
  transfer: 'Перевод',
};

export async function exportTransactionsToPdf(
  transactions: Transaction[],
  categories: Record<string, Category>,
  accounts: Record<string, Account>,
  options: ExportPdfOptions = {},
): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('exportTransactionsToPdf доступен только в браузере');
  }

  const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalIncome = sorted.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = sorted.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

  const container = buildReportElement(sorted, categories, accounts, {
    title: options.title ?? 'Отчёт по операциям',
    periodLabel: options.periodLabel,
    totalIncome,
    totalExpense,
  });
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff' });
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(options.filename ?? `report-${new Date().toISOString().slice(0, 10)}.pdf`);
  } finally {
    container.remove();
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatMoney(amount: number, currency: string): string {
  const value = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.abs(amount));
  const symbol = currency === 'RUB' ? '₽' : currency;
  return `${amount < 0 ? '−' : ''}${value} ${symbol}`;
}

function buildReportElement(
  transactions: Transaction[],
  categories: Record<string, Category>,
  accounts: Record<string, Account>,
  meta: { title: string; periodLabel?: string; totalIncome: number; totalExpense: number },
): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 40px;
    background: #ffffff;
    font-family: Inter, system-ui, -apple-system, sans-serif;
    color: #12131A;
  `;

  const net = meta.totalIncome - meta.totalExpense;
  const generatedAt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(),
  );

  const rows = transactions
    .map((t, index) => {
      const account = accounts[t.accountId];
      const category = categories[t.categoryId];
      const date = new Date(t.date);
      const amountColor = t.type === 'income' ? '#059669' : '#12131A';
      const amountValue = t.type === 'expense' ? -t.amount : t.amount;
      const rowBg = index % 2 === 0 ? '#ffffff' : '#F9F9FB';

      return `
        <tr style="background:${rowBg};">
          <td style="padding:10px 12px; font-size:12px; color:rgba(0,0,0,0.6);">${date.toLocaleDateString('ru-RU')}</td>
          <td style="padding:10px 12px; font-size:12px;">${escapeHtml(category?.name ?? '—')}</td>
          <td style="padding:10px 12px; font-size:12px; color:rgba(0,0,0,0.6);">${escapeHtml(account?.name ?? '—')}</td>
          <td style="padding:10px 12px; font-size:12px;">${escapeHtml(TYPE_LABEL[t.type])}</td>
          <td style="padding:10px 12px; font-size:12px; text-align:right; font-weight:600; color:${amountColor};">
            ${formatMoney(amountValue, account?.currency ?? 'RUB')}
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:28px;">
      <div>
        <h1 style="margin:0; font-size:22px; font-weight:700;">${escapeHtml(meta.title)}</h1>
        ${meta.periodLabel ? `<p style="margin:4px 0 0; font-size:13px; color:rgba(0,0,0,0.45);">${escapeHtml(meta.periodLabel)}</p>` : ''}
      </div>
      <p style="margin:0; font-size:11px; color:rgba(0,0,0,0.35);">Сформирован ${generatedAt}</p>
    </div>

    <div style="display:flex; gap:12px; margin-bottom:24px;">
      <div style="flex:1; background:#F5F6F8; border-radius:14px; padding:14px 16px;">
        <p style="margin:0; font-size:11px; color:rgba(0,0,0,0.45);">Доходы</p>
        <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:#059669;">${formatMoney(meta.totalIncome, 'RUB')}</p>
      </div>
      <div style="flex:1; background:#F5F6F8; border-radius:14px; padding:14px 16px;">
        <p style="margin:0; font-size:11px; color:rgba(0,0,0,0.45);">Расходы</p>
        <p style="margin:4px 0 0; font-size:18px; font-weight:700;">${formatMoney(-meta.totalExpense, 'RUB')}</p>
      </div>
      <div style="flex:1; background:#EFEFFB; border-radius:14px; padding:14px 16px;">
        <p style="margin:0; font-size:11px; color:rgba(0,0,0,0.45);">Итого</p>
        <p style="margin:4px 0 0; font-size:18px; font-weight:700; color:${net >= 0 ? '#059669' : '#12131A'};">${formatMoney(net, 'RUB')}</p>
      </div>
    </div>

    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:var(--primary, #4F46E5);">
          <th style="padding:10px 12px; text-align:left; font-size:11px; color:#fff; font-weight:600;">Дата</th>
          <th style="padding:10px 12px; text-align:left; font-size:11px; color:#fff; font-weight:600;">Категория</th>
          <th style="padding:10px 12px; text-align:left; font-size:11px; color:#fff; font-weight:600;">Счёт</th>
          <th style="padding:10px 12px; text-align:left; font-size:11px; color:#fff; font-weight:600;">Тип</th>
          <th style="padding:10px 12px; text-align:right; font-size:11px; color:#fff; font-weight:600;">Сумма</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  return container;
}
