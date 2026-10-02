import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { TransactionType, Currency } from "@prisma/client";

// Безопасный парсинг различных форматов дат (Excel Serial Date, String, Date)
function parseCustomDate(rawDate: any): Date {
  if (!rawDate) return new Date();

  // Числовой формат Excel
  if (typeof rawDate === "number") {
    const parsed = XLSX.SSF.parse_date_code(rawDate);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
  }

  // Готовый объект Date
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return rawDate;
  }

  const strDate = String(rawDate).trim();

  // Формат ДД.ММ.ГГГГ или ДД/ММ/ГГГГ
  const ddmmyyyyMatch = strDate.match(/^(\d{2})[\.\/](\d{2})[\.\/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // ISO и другие стандартные форматы
  const parsedDate = new Date(strDate);
  return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fromAccountId = formData.get("fromAccountId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Файл не прикреплен" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const items: Array<{
      date: Date;
      type: TransactionType;
      amount: number;
      currency: Currency;
      description?: string;
    }> = [];

    // --- Обработка XLSX / XLS ---
    if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const firstSheetName = wb.SheetNames[0];

      if (!firstSheetName || !wb.Sheets[firstSheetName]) {
        return NextResponse.json(
          { error: "В загруженном файле Excel не найдено рабочих листов" },
          { status: 400 }
        );
      }

      const sheet = wb.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      for (const r of rows) {
        const rawType = String(r["Тип"] || "").toUpperCase();
        const type: TransactionType =
          rawType.includes("ДОХОД") || rawType.includes("INCOME")
            ? "INCOME"
            : "EXPENSE";

        const amount = Math.abs(parseFloat(r["Сумма"] || r["Amount"] || 0));
        const rawCurrency = String(r["Валюта"] || "RUB").toUpperCase();
        const currency = (
          Object.values(Currency).includes(rawCurrency as Currency)
            ? rawCurrency
            : "RUB"
        ) as Currency;

        const rawDate = r["Дата"] || r["Date"];
        const desc = r["Комментарий"] || r["Описание"] || r["Категория"];

        if (amount > 0) {
          items.push({
            date: parseCustomDate(rawDate),
            type,
            amount,
            currency,
            description: desc ? String(desc) : undefined,
          });
        }
      }
    } 
    // --- Обработка PDF (динамический импорт во время запроса) ---
    else if (file.name.endsWith(".pdf")) {
      // Ленивый импорт защищает сборку Next.js от отсутствия глобальных браузерных объектов
      const pdfParse = require("pdf-parse");
      const pdfData = await pdfParse(buffer);
      const lines = pdfData.text.split("\n");

      const dateRegex = /(\d{2}[\.\/]\d{2}[\.\/]\d{4}|\d{4}-\d{2}-\d{2})/;
      const amountRegex = /(-?\d+[\s\.]?\d*[\,\.]\d{2})/;

      for (const l of lines) {
        const dateMatch = l.match(dateRegex);
        const amountMatch = l.match(amountRegex);

        if (dateMatch && amountMatch) {
          const numAmount = parseFloat(
            amountMatch[0].replace(/\s/g, "").replace(",", ".")
          );
          if (!isNaN(numAmount) && Math.abs(numAmount) > 0) {
            items.push({
              date: parseCustomDate(dateMatch[0]),
              type: numAmount < 0 ? "EXPENSE" : "INCOME",
              amount: Math.abs(numAmount),
              currency: "RUB",
              description: "Импорт из PDF",
            });
          }
        }
      }
    } else {
      return NextResponse.json(
        { error: "Формат не поддерживается (.xlsx, .xls, .pdf)" },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Файл пуст или данные не удалось распознать." },
        { status: 400 }
      );
    }

    // Сохранение массовым запросом в базу через Prisma
    await prisma.transaction.createMany({
      data: items.map((t) => ({
        userId,
        type: t.type,
        amount: t.amount.toString(),
        currency: t.currency,
        fromAccountId: fromAccountId && fromAccountId.trim() !== "" ? fromAccountId : null,
        description: t.description,
        occurredAt: t.date,
      })),
    });

    return NextResponse.json({ success: true, count: items.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: "Ошибка при обработке файла" },
      { status: 500 }
    );
  }
}