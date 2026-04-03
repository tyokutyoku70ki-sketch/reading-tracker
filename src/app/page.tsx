"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Book } from "@/lib/types";
import { loadBooks, exportBooksToCSV, importBooksFromCSV } from "@/lib/storage";
import {
  fetchBooks,
  addBook,
  updateBook,
  deleteBook,
  bulkInsertBooks,
} from "@/lib/db";
import BookCard from "@/components/BookCard";
import BookFormModal from "@/components/BookFormModal";
import Dashboard from "@/components/Dashboard";
import SearchFilter, {
  Filters,
  defaultFilters,
} from "@/components/SearchFilter";
import {
  Plus,
  BookOpen,
  Download,
  Upload,
  LayoutGrid,
  List,
  CheckSquare,
  BarChart2,
  Loader2,
} from "lucide-react";

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"books" | "actions" | "dashboard">("books");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const dbBooks = await fetchBooks();

        // LocalStorage にデータがあり Supabase が空の場合はマイグレーション
        if (dbBooks.length === 0) {
          const localBooks = loadBooks();
          if (localBooks.length > 0) {
            await bulkInsertBooks(localBooks);
            const migrated = await fetchBooks();
            setBooks(migrated);
            return;
          }
        }

        setBooks(dbBooks);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "";
        alert("エラー詳細: " + (msg || JSON.stringify(error, null, 2)));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach((b) => b.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        const searchable = [
          b.title,
          b.author,
          b.summary,
          b.keyPoints.map((p) => `${p.title} ${p.content}`).join(" "),
          b.actionNotes,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }
      if (filters.status !== "all" && b.status !== filters.status) return false;
      if (filters.tag && !b.tags.includes(filters.tag)) return false;
      if (filters.rating > 0 && b.rating < filters.rating) return false;
      if (filters.favoriteOnly && !b.favorite) return false;
      return true;
    });
  }, [books, filters]);

  const handleSave = useCallback(
    async (data: Omit<Book, "id" | "createdAt" | "updatedAt">) => {
      try {
        if (editingBook) {
          await updateBook(editingBook.id, data);
        } else {
          await addBook(data);
        }
        setBooks(await fetchBooks());
      } catch {
        alert("保存に失敗しました");
      }
    },
    [editingBook]
  );

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteBook(id);
      setBooks(await fetchBooks());
    } catch {
      alert("削除に失敗しました");
    }
  }, []);

  const handleToggleFavorite = useCallback(async (book: Book) => {
    try {
      await updateBook(book.id, { favorite: !book.favorite });
      setBooks(await fetchBooks());
    } catch {
      alert("更新に失敗しました");
    }
  }, []);

  const handleToggleActionCompleted = useCallback(async (book: Book) => {
    try {
      await updateBook(book.id, { isActionCompleted: !book.isActionCompleted });
      setBooks(await fetchBooks());
    } catch {
      alert("更新に失敗しました");
    }
  }, []);

  const openNew = () => {
    setEditingBook(null);
    setModalOpen(true);
  };

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setModalOpen(true);
  };

  const handleExportCSV = () => {
    const csv = exportBooksToCSV(books);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reading-tracker-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const imported = importBooksFromCSV(text);
      if (imported.length === 0) return;
      try {
        await bulkInsertBooks(imported);
        setBooks(await fetchBooks());
      } catch {
        alert("CSVの取込に失敗しました");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={24} className="text-indigo-600" />
            <h1 className="text-lg font-bold text-gray-800">読書記録</h1>
            <span className="text-xs text-gray-400 ml-1">
              {books.length}冊
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              title="CSVエクスポート"
            >
              <Download size={14} /> CSV出力
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              title="CSVインポート"
            >
              <Upload size={14} /> CSV取込
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
            <button
              onClick={openNew}
              className="flex items-center gap-1 px-4 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium"
            >
              <Plus size={16} /> 登録
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Tab switcher */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab("books")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "books"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <BookOpen size={15} /> 本のリスト
          </button>
          <button
            onClick={() => setActiveTab("actions")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "actions"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <CheckSquare size={15} /> アクションボード
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "dashboard"
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <BarChart2 size={15} /> ダッシュボード
          </button>
        </div>

        {activeTab === "dashboard" ? (
          <Dashboard books={books} />
        ) : activeTab === "actions" ? (
          /* Action Board */
          (() => {
            const actionBooks = books.filter((b) => b.actionNotes.trim());
            const pending = actionBooks.filter((b) => !b.isActionCompleted);
            const done = actionBooks.filter((b) => b.isActionCompleted);
            return (
              <div className="space-y-3">
                {actionBooks.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <CheckSquare size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm">「感想・学び・Next Action」が入力された本がありません</p>
                  </div>
                ) : (
                  <>
                    {pending.map((book) => (
                      <div
                        key={book.id}
                        className="flex items-start gap-3 bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleToggleActionCompleted(book)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 flex-shrink-0 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{book.actionNotes}</p>
                          <p className="text-xs text-gray-400 mt-1 truncate">📚 {book.title}</p>
                        </div>
                      </div>
                    ))}
                    {done.length > 0 && (
                      <>
                        <p className="text-xs text-gray-400 pt-2 font-medium">完了済み</p>
                        {done.map((book) => (
                          <div
                            key={book.id}
                            className="flex items-start gap-3 bg-gray-50 rounded-lg border border-gray-200 p-4"
                          >
                            <input
                              type="checkbox"
                              checked={true}
                              onChange={() => handleToggleActionCompleted(book)}
                              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400 flex-shrink-0 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-400 line-through whitespace-pre-wrap">{book.actionNotes}</p>
                              <p className="text-xs text-gray-400 mt-1 truncate">📚 {book.title}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })()
        ) : (
          <>
        {/* Search & Filter */}
        <div className="mb-6">
          <SearchFilter
            filters={filters}
            onChange={setFilters}
            allTags={allTags}
          />
        </div>

        {/* View toggle & count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {filteredBooks.length}件 表示中
          </p>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-50"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Book list */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <BookOpen size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {books.length === 0
                ? "まだ本が登録されていません"
                : "条件に一致する本がありません"}
            </p>
            {books.length === 0 && (
              <button
                onClick={openNew}
                className="mt-3 text-indigo-600 text-sm hover:underline"
              >
                最初の1冊を登録する
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={openEdit}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => openEdit(book)}
                className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm cursor-pointer"
              >
                <div className="w-10 h-14 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {book.coverUrl ? (
                    <img
                      src={book.coverUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen size={16} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate">{book.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {book.author || "著者不明"}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-shrink-0">
                  <span>{book.finishedDate}</span>
                  <span>{"★".repeat(book.rating)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </main>

      {/* Modal */}
      <BookFormModal
        book={editingBook}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
