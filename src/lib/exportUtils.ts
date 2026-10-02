import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface TransactionExportData {
  id: string;
  date: string;
  type: string;
  amount: string;
  currency: string;
  description: string;
}

export function exportToExcel(transactions: TransactionExportData[], fileName = "ZenFinance_Report.xlsx") {
  const data = transactions.map((t) => ({
    "Дата": t.date,
    "Тип": t.type === "INCOME" ? "Доход" : "Расход",
    "Сумма": `${t.amount} ${t.currency}`,
    "Описание": t.description || "—",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Транзакции");

  XLSX.writeFile(workbook, fileName);
}

export function exportToPdf(transactions: TransactionExportData[], fileName = "ZenFinance_Report.pdf") {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Финансовый отчет ZenFinance", 14, 20);

  doc.setFontSize(10);
  doc.text(`Сформировано: ${new Date().toLocaleDateString("ru-RU")}`, 14, 28);

  const tableData = transactions.map((t) => [
    t.date,
    t.type === "INCOME" ? "Доход" : "Расход",
    `${t.amount} ${t.currency}`,
    t.description || "—",
  ]);

  autoTable(doc, {
    startY: 35,
    head: [["Дата", "Тип", "Сумма", "Описание"]],
    body: tableData,
    styles: { font: "helvetica", fontSize: 9 },
    headStyles: { fillColor: [79, 70, 229] }, 
  });

  doc.save(fileName);
}