"use client";

import { Book, STATUS_LABELS } from "@/lib/types";
import { Heart, BookOpen } from "lucide-react";
import StarRating from "./StarRating";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onToggleFavorite: (book: Book) => void;
}

const statusColors: Record<Book["status"], string> = {
  unread: "bg-gray-200 text-gray-700",
  reading: "bg-blue-100 text-blue-700",
  finished: "bg-green-100 text-green-700",
};

export default function BookCard({
  book,
  onEdit,
  onToggleFavorite,
}: BookCardProps) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col"
      onClick={() => onEdit(book)}
    >
      {/* Cover */}
      <div className="relative h-44 bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-contain"
          />
        ) : (
          <BookOpen size={48} className="text-gray-300" />
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(book);
          }}
          className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white"
        >
          <Heart
            size={18}
            className={
              book.favorite
                ? "fill-red-500 text-red-500"
                : "text-gray-400"
            }
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {book.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">
          {book.author || "著者不明"}
        </p>
        <div className="flex items-center gap-2 mt-auto pt-1">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColors[book.status]}`}
          >
            {STATUS_LABELS[book.status]}
          </span>
          {book.finishedDate && (
            <span className="text-[10px] text-gray-400">
              {book.finishedDate}
            </span>
          )}
        </div>
        <StarRating value={book.rating} size={14} />
      </div>
    </div>
  );
}
