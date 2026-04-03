"use client";

import { useState, useEffect } from "react";
import { Book, ReadingStatus, STATUS_LABELS, createEmptyBook } from "@/lib/types";
import { bookToMarkdown } from "@/lib/storage";
import { X, Trash2, ClipboardCopy, Check, Search, Loader2 } from "lucide-react";
import StarRating from "./StarRating";
import TagInput from "./TagInput";

interface BookFormModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Book, "id" | "createdAt" | "updatedAt">) => void;
  onDelete?: (id: string) => void;
}

export default function BookFormModal({
  book,
  open,
  onClose,
  onSave,
  onDelete,
}: BookFormModalProps) {
  const [form, setForm] = useState(createEmptyBook());
  const [copied, setCopied] = useState(false);
  const [fetching, setFetching] = useState(false);

  const handleFetchBookInfo = async () => {
    const query = form.title.trim();
    if (!query) return;

    // ハイフンを除去して13桁の数字かどうか判定
    const normalized = query.replace(/-/g, "");
    const isIsbn = /^\d{13}$/.test(normalized);

    setFetching(true);
    try {
      if (isIsbn) {
        // ① openBD で検索
        const openBdRes = await fetch(
          `https://api.openbd.jp/v1/get?isbn=${normalized}`
        );
        const openBdData = await openBdRes.json();
        if (Array.isArray(openBdData) && openBdData[0] !== null) {
          const summary = openBdData[0]?.summary;
          const author: string = summary?.author ?? "";
          const cover: string = summary?.cover ?? "";
          setForm((prev) => ({
            ...prev,
            ...(author ? { author } : {}),
            ...(cover ? { coverUrl: cover } : {}),
          }));
          return;
        }

        // ② openBD で見つからなければ Google Books にフォールバック
        const gbRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${normalized}&maxResults=1`
        );
        const gbData = await gbRes.json();
        const info = gbData?.items?.[0]?.volumeInfo;
        if (!info) {
          alert("書籍情報が見つかりませんでした");
          return;
        }
        if (info.authors?.length) {
          setForm((prev) => ({ ...prev, author: info.authors.join(", ") }));
        }
        const rawThumb: string =
          info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "";
        if (rawThumb) {
          const thumb = rawThumb.replace(/^http:\/\//, "https://");
          setForm((prev) => ({ ...prev, coverUrl: thumb }));
        }
      } else {
        // テキスト検索: Google Books (intitle:)
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(query)}&maxResults=1`
        );
        const data = await res.json();
        const info = data?.items?.[0]?.volumeInfo;
        if (!info) {
          alert("書籍情報が見つかりませんでした");
          return;
        }
        if (info.authors?.length) {
          setForm((prev) => ({ ...prev, author: info.authors.join(", ") }));
        }
        const rawThumb: string =
          info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? "";
        if (rawThumb) {
          const thumb = rawThumb.replace(/^http:\/\//, "https://");
          setForm((prev) => ({ ...prev, coverUrl: thumb }));
        }
      }
    } catch {
      alert("書籍情報が見つかりませんでした");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (book) {
      const { id, createdAt, updatedAt, ...rest } = book;
      setForm(rest);
    } else {
      setForm(createEmptyBook());
    }
    setCopied(false);
  }, [book, open]);

  if (!open) return null;

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  const handleCopyMarkdown = async () => {
    if (!book) return;
    const md = bookToMarkdown({ ...book, ...form });
    await navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-lg font-bold">
            {book ? "本を編集" : "新しい本を登録"}
          </h2>
          <div className="flex items-center gap-2">
            {book && (
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 px-2 py-1 rounded border border-gray-200 hover:border-indigo-300"
              >
                {copied ? <Check size={14} /> : <ClipboardCopy size={14} />}
                {copied ? "コピー済み" : "Markdown"}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本の名前 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={handleFetchBookInfo}
                disabled={fetching || !form.title.trim()}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg flex-shrink-0 transition-colors"
              >
                {fetching ? (
                  <><Loader2 size={13} className="animate-spin" /> 取得中...</>
                ) : (
                  <><Search size={13} /> 情報を自動取得</>
                )}
              </button>
            </div>
          </div>

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              著者名
            </label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => set("author", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Cover URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              表紙画像URL
            </label>
            <input
              type="url"
              value={form.coverUrl}
              onChange={(e) => set("coverUrl", e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Status + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ステータス
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as ReadingStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {(Object.entries(STATUS_LABELS) as [ReadingStatus, string][]).map(
                  ([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                読了日
              </label>
              <input
                type="date"
                value={form.finishedDate}
                onChange={(e) => set("finishedDate", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ジャンル・タグ
            </label>
            <TagInput value={form.tags} onChange={(tags) => set("tags", tags)} />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              評価
            </label>
            <StarRating
              value={form.rating}
              onChange={(v) => set("rating", v)}
              size={24}
            />
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="favorite"
              checked={form.favorite}
              onChange={(e) => set("favorite", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
            />
            <label htmlFor="favorite" className="text-sm text-gray-700">
              お気に入り / 再読したい
            </label>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              一言要約
            </label>
            <input
              type="text"
              value={form.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="この本を一文で表すと..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Key Points */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              大事なポイント
            </label>
            <div className="space-y-3">
              {form.keyPoints.map((point, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={point.title}
                      onChange={(e) => {
                        const updated = [...form.keyPoints];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        set("keyPoints", updated);
                      }}
                      placeholder="見出し"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => set("keyPoints", form.keyPoints.filter((_, i) => i !== idx))}
                      className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      title="削除"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <textarea
                    value={point.content}
                    onChange={(e) => {
                      const updated = [...form.keyPoints];
                      updated[idx] = { ...updated[idx], content: e.target.value };
                      set("keyPoints", updated);
                    }}
                    rows={2}
                    placeholder="内容"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y bg-white"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => set("keyPoints", [...form.keyPoints, { title: "", content: "" }])}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ＋ポイントを追加
            </button>
          </div>

          {/* Action Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              感想・学び・Next Action
            </label>
            <textarea
              value={form.actionNotes}
              onChange={(e) => set("actionNotes", e.target.value)}
              rows={3}
              placeholder="ブログ記事の構成案やアクション..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t bg-gray-50 rounded-b-xl">
          <div>
            {book && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(book.id);
                  onClose();
                }}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 size={15} /> 削除
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
            >
              キャンセル
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
            >
              {book ? "更新する" : "登録する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
