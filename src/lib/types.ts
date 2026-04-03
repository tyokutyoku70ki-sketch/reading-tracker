export type ReadingStatus = "unread" | "reading" | "finished";

export interface KeyPoint {
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  status: ReadingStatus;
  finishedDate: string;
  tags: string[];
  rating: number;
  favorite: boolean;
  summary: string;
  keyPoints: KeyPoint[];
  actionNotes: string;
  isActionCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<ReadingStatus, string> = {
  unread: "未読",
  reading: "読書中",
  finished: "読了",
};

export const DEFAULT_TAGS = [
  "投資",
  "AI",
  "ブログ運営",
  "自己啓発",
  "ビジネス",
  "プログラミング",
  "小説",
  "健康",
  "心理学",
  "マーケティング",
];

export function createEmptyBook(): Omit<Book, "id" | "createdAt" | "updatedAt"> {
  return {
    title: "",
    author: "",
    coverUrl: "",
    status: "finished",
    finishedDate: new Date().toISOString().split("T")[0],
    tags: [],
    rating: 3,
    favorite: false,
    summary: "",
    keyPoints: [],
    actionNotes: "",
    isActionCompleted: false,
  };
}
