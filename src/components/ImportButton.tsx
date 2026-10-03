"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactionStore } from "@/store/useTransactionStore";

export function ImportButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const fetchRecent = useTransactionStore((s) => s.fetchRecent);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка при импорте");
        return;
      }

      alert(`Успешно импортировано операций: ${data.count}`);
      fetchAccounts();
      fetchRecent();
    } catch (err) {
      console.error(err);
      alert("Не удалось загрузить файл");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full rounded-2xl bg-surface border border-border p-3.5 text-sm font-medium text-primary hover:bg-bg transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-accent" />
        )}
        <span>Импортировать выписку (Excel)</span>
      </button>
    </>
  );
}