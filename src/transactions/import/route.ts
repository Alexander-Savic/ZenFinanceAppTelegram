import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { Currency, TransactionType } from "@prisma/client";

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

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ error: "В файле отсутствуют листы" }, { status: 400 });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    if (!worksheet) {
      return NextResponse.json({ error: "Не удалось прочитать лист таблицы" }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Файл пуст или имеет неверный формат" }, { status: 400 });
    }

    const userAccount = await prisma.account.findFirst({
      where: { userId, isArchived: false },
    });

    if (!userAccount) {
      return NextResponse.json({ error: "У вас нет активных счетов для импорта" }, { status: 400 });
    }

    let importedCount = 0;

    for (const row of rows) {
      const amountRaw = (row["Сумма"] ?? row["Amount"] ?? row["amount"]) as string | number | undefined;
      const typeRaw = String(row["Тип"] ?? row["Type"] ?? row["type"] ?? "").toUpperCase();
      const description = String(row["Описание"] ?? row["Description"] ?? row["note"] ?? "");
      const dateRaw = row["Дата"] ?? row["Date"] ?? row["date"];

      if (amountRaw === undefined || amountRaw === null) continue;

      const amount = Math.abs(parseFloat(String(amountRaw)));
      if (isNaN(amount) || amount === 0) continue;

      const isIncome = typeRaw.includes("ДОХОД") || typeRaw.includes("INCOME");
      const type: TransactionType = isIncome ? "INCOME" : "EXPENSE";

      let date = new Date();
      if (dateRaw) {
        const parsedDate = new Date(dateRaw as string | number | Date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      }

      await prisma.transaction.create({
        data: {
          userId,
          type,
          amount: amount.toString(),
          currency: userAccount.currency, 
          description: description ? description : null,
          fromAccountId: isIncome ? null : userAccount.id,
          toAccountId: isIncome ? userAccount.id : null,   
          occurredAt: date,
          createdAt: date,
        },
      });

      const balanceChange = isIncome ? amount : -amount;
      await prisma.account.update({
        where: { id: userAccount.id },
        data: {
          balance: (Number(userAccount.balance) + balanceChange).toString(),
        },
      });

      importedCount++;
    }

    return NextResponse.json({ success: true, count: importedCount });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Ошибка при обработке файла" }, { status: 500 });
  }
}