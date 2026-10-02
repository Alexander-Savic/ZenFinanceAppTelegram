"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { exportToExcel, exportToPdf, type TransactionExportData } from "@/lib/exportUtils";

interface Props {
  transactions?: TransactionExportData[];
  onImportSuccess?: () => void;
}

export function FileImportExport({ transactions = [], onImportSuccess }: Props) {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Успешно импортировано операций: ${data.count}`);
        if (onImportSuccess) onImportSuccess();
      } else {
        setMessage(`Ошибка: ${data.error}`);
      }
    } catch {
      setMessage("Произошла ошибка при загрузке файла");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-base font-semibold text-primary">Импорт и Экспорт данных</h3>

      {/* Кнопка загрузки файла */}
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="hidden"
          id="file-import-input"
        />
        <label
          htmlFor="file-import-input"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-500/40 bg-indigo-50/50 p-4 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100/50 dark:bg-indigo-950/20 dark:text-indigo-400"
        >
          {isImporting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
          <span>{isImporting ? "Загрузка и обработка..." : "Загрузить Excel / CSV таблицу"}</span>
        </label>
        {message && <p className="text-xs font-medium text-center text-secondary mt-1">{message}</p>}
      </div>

      {/* Кнопки экспорта */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <button
          onClick={() => exportToExcel(transactions)}
          disabled={transactions.length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg py-2.5 text-xs font-medium text-primary hover:bg-surface disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Скачать Excel</span>
        </button>

        <button
          onClick={() => exportToPdf(transactions)}
          disabled={transactions.length === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg py-2.5 text-xs font-medium text-primary hover:bg-surface disabled:opacity-50"
        >
          <FileText className="h-4 w-4 text-rose-600" />
          <span>Скачать PDF</span>
        </button>
      </div>
    </div>
  );
}