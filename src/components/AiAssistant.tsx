"use client";

import { useState } from "react";
import { Bot, X, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "ai",
      text: "Привет! Я твой ИИ-помощник ZenFinance. Задавай любые вопросы по балансу, целям или расходам!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });

      const data = await res.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: data.reply || data.error || "Произошла ошибка при ответе.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "ai", text: "Ошибка подключения к серверу." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-4 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl hover:bg-indigo-700 transition-transform active:scale-95"
        aria-label="ИИ Ассистент"
      >
        <Sparkles className="h-6 w-6 animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 left-4 right-4 sm:right-auto sm:w-96 z-50 flex h-[460px] flex-col rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-indigo-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-semibold text-sm">Zen AI Ассистент</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-indigo-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                  m.sender === "user"
                    ? "self-end bg-accent text-accent-foreground"
                    : "self-start bg-bg text-primary border border-border"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="self-start rounded-2xl bg-bg border border-border px-3.5 py-2.5 text-xs text-secondary animate-pulse">
                Думаю...
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 flex gap-2 bg-surface">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Спроси о финансах..."
              className="flex-1 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-primary focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="flex items-center justify-center rounded-xl bg-indigo-600 px-3 text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}