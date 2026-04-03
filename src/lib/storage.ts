import { Book, KeyPoint } from "./types";

const STORAGE_KEY = "reading-tracker-books";

function migrateKeyPoints(raw: unknown): KeyPoint[] {
  if (Array.isArray(raw)) return raw as KeyPoint[];
  if (typeof raw === "string") {
    return raw ? [{ title: "メモ", content: raw }] : [];
  }
  return [];
}

function migrateBook(book: Record<string, unknown>): Book {
  return {
    ...book,
    keyPoints: migrateKeyPoints(book.keyPoints),
    isActionCompleted: book.isActionCompleted ?? false,
  } as Book;
}

export function loadBooks(): Book[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>[];
    return parsed.map(migrateBook);
  } catch {
    return [];
  }
}

export function saveBooks(books: Book[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

export function addBook(
  data: Omit<Book, "id" | "createdAt" | "updatedAt">
): Book {
  const now = new Date().toISOString();
  const book: Book = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  const books = loadBooks();
  books.unshift(book);
  saveBooks(books);
  return book;
}

export function updateBook(
  id: string,
  data: Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>
): Book | null {
  const books = loadBooks();
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  books[idx] = { ...books[idx], ...data, updatedAt: new Date().toISOString() };
  saveBooks(books);
  return books[idx];
}

export function deleteBook(id: string): void {
  const books = loadBooks().filter((b) => b.id !== id);
  saveBooks(books);
}

export function exportBooksToCSV(books: Book[]): string {
  const headers = [
    "タイトル",
    "著者",
    "表紙URL",
    "ステータス",
    "読了日",
    "タグ",
    "評価",
    "お気に入り",
    "一言要約",
    "大事なポイント",
    "感想・学び・Next Action",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = books.map((b) =>
    [
      escape(b.title),
      escape(b.author),
      escape(b.coverUrl),
      escape(b.status),
      escape(b.finishedDate),
      escape(b.tags.join(";")),
      b.rating,
      b.favorite ? "1" : "0",
      escape(b.summary),
      escape(JSON.stringify(b.keyPoints)),
      escape(b.actionNotes),
    ].join(",")
  );
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

export function importBooksFromCSV(csv: string): Book[] {
  const lines = csv.replace(/^\uFEFF/, "").split("\n");
  if (lines.length < 2) return [];

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          result.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    result.push(current);
    return result;
  };

  const imported: Book[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 11) continue;
    const now = new Date().toISOString();
    imported.push({
      id: crypto.randomUUID(),
      title: cols[0],
      author: cols[1],
      coverUrl: cols[2],
      status: (["unread", "reading", "finished"].includes(cols[3])
        ? cols[3]
        : "finished") as Book["status"],
      finishedDate: cols[4],
      tags: cols[5] ? cols[5].split(";").filter(Boolean) : [],
      rating: Math.min(5, Math.max(1, parseInt(cols[6]) || 3)),
      favorite: cols[7] === "1",
      summary: cols[8],
      keyPoints: migrateKeyPoints((() => { try { return JSON.parse(cols[9]); } catch { return cols[9]; } })()),
      actionNotes: cols[10],
      isActionCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }
  return imported;
}

export function bookToMarkdown(book: Book): string {
  const statusLabel = { unread: "未読", reading: "読書中", finished: "読了" };
  const stars = "★".repeat(book.rating) + "☆".repeat(5 - book.rating);
  return `# ${book.title}

**著者:** ${book.author || "不明"}
**ステータス:** ${statusLabel[book.status]}
**読了日:** ${book.finishedDate || "未設定"}
**評価:** ${stars}
**タグ:** ${book.tags.length > 0 ? book.tags.join(", ") : "なし"}

## 一言要約
${book.summary || "なし"}

## 大事なポイント
${book.keyPoints.length > 0
    ? book.keyPoints.map((p) => `### ${p.title}\n${p.content}`).join("\n\n")
    : "なし"}

## 感想・学び・Next Action
${book.actionNotes || "なし"}
`;
}
