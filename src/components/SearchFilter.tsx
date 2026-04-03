"use client";

import { ReadingStatus, STATUS_LABELS } from "@/lib/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export interface Filters {
  query: string;
  status: ReadingStatus | "all";
  tag: string;
  rating: number; // 0 = all
  favoriteOnly: boolean;
}

export const defaultFilters: Filters = {
  query: "",
  status: "all",
  tag: "",
  rating: 0,
  favoriteOnly: false,
};

interface SearchFilterProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  allTags: string[];
}

export default function SearchFilter({
  filters,
  onChange,
  allTags,
}: SearchFilterProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    onChange({ ...filters, [key]: val });

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.tag !== "" ||
    filters.rating !== 0 ||
    filters.favoriteOnly;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="タイトル・著者・メモで検索..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {filters.query && (
            <button
              onClick={() => set("query", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm ${
            hasActiveFilters
              ? "border-indigo-400 text-indigo-600 bg-indigo-50"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal size={16} />
          絞り込み
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 items-end bg-gray-50 rounded-lg p-3">
          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">ステータス</label>
            <select
              value={filters.status}
              onChange={(e) =>
                set("status", e.target.value as Filters["status"])
              }
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="all">すべて</option>
              {(
                Object.entries(STATUS_LABELS) as [ReadingStatus, string][]
              ).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Tag */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">タグ</label>
            <select
              value={filters.tag}
              onChange={(e) => set("tag", e.target.value)}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">すべて</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">評価</label>
            <select
              value={filters.rating}
              onChange={(e) => set("rating", parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value={0}>すべて</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {"★".repeat(n)} 以上
                </option>
              ))}
            </select>
          </div>

          {/* Favorite */}
          <label className="flex items-center gap-1.5 text-sm text-gray-700 pb-1">
            <input
              type="checkbox"
              checked={filters.favoriteOnly}
              onChange={(e) => set("favoriteOnly", e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
            />
            お気に入りのみ
          </label>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              onClick={() => onChange(defaultFilters)}
              className="text-xs text-indigo-600 hover:underline pb-1.5"
            >
              リセット
            </button>
          )}
        </div>
      )}
    </div>
  );
}
