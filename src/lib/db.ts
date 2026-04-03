import { supabase } from "./supabase";
import { Book, KeyPoint, ReadingStatus } from "./types";

// Supabase テーブルの行型（実際のDBカラム名：camelCase）
type BookRow = {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: string;
  readDate: string;
  tags: string[];
  rating: number;
  isFavorite: boolean;
  summary: string;
  importantPoints: KeyPoint[];
  actionPlan: string;
  isActionCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

function rowToBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    coverUrl: row.coverUrl,
    status: row.status as ReadingStatus,
    finishedDate: row.readDate,
    tags: row.tags ?? [],
    rating: row.rating,
    favorite: row.isFavorite,
    summary: row.summary,
    keyPoints: row.importantPoints ?? [],
    actionNotes: row.actionPlan,
    isActionCompleted: row.isActionCompleted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from("books")
    .select("*")
    .order("createdAt", { ascending: false });
  if (error) throw error;
  return (data as BookRow[]).map(rowToBook);
}

export async function addBook(
  data: Omit<Book, "id" | "createdAt" | "updatedAt">
): Promise<Book> {
  const { data: row, error } = await supabase
    .from("books")
    .insert({
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl,
      status: data.status,
      readDate: data.finishedDate,
      tags: data.tags,
      rating: data.rating,
      isFavorite: data.favorite,
      summary: data.summary,
      importantPoints: data.keyPoints,
      actionPlan: data.actionNotes,
      isActionCompleted: data.isActionCompleted,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToBook(row as BookRow);
}

export async function updateBook(
  id: string,
  data: Partial<Omit<Book, "id" | "createdAt" | "updatedAt">>
): Promise<Book> {
  const partial: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.title !== undefined) partial.title = data.title;
  if (data.author !== undefined) partial.author = data.author;
  if (data.coverUrl !== undefined) partial.coverUrl = data.coverUrl;
  if (data.status !== undefined) partial.status = data.status;
  if (data.finishedDate !== undefined) partial.readDate = data.finishedDate;
  if (data.tags !== undefined) partial.tags = data.tags;
  if (data.rating !== undefined) partial.rating = data.rating;
  if (data.favorite !== undefined) partial.isFavorite = data.favorite;
  if (data.summary !== undefined) partial.summary = data.summary;
  if (data.keyPoints !== undefined) partial.importantPoints = data.keyPoints;
  if (data.actionNotes !== undefined) partial.actionPlan = data.actionNotes;
  if (data.isActionCompleted !== undefined)
    partial.isActionCompleted = data.isActionCompleted;

  const { data: row, error } = await supabase
    .from("books")
    .update(partial)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToBook(row as BookRow);
}

export async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) throw error;
}

// LocalStorage からの移行・CSVインポート用の一括挿入
export async function bulkInsertBooks(books: Book[]): Promise<void> {
  const rows = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    coverUrl: b.coverUrl,
    status: b.status,
    readDate: b.finishedDate,
    tags: b.tags,
    rating: b.rating,
    isFavorite: b.favorite,
    summary: b.summary,
    importantPoints: b.keyPoints,
    actionPlan: b.actionNotes,
    isActionCompleted: b.isActionCompleted,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  }));
  const { error } = await supabase.from("books").insert(rows);
  if (error) throw error;
}
