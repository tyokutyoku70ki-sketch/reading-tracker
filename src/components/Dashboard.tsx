"use client";

import { useMemo } from "react";
import { Book } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart2, Star } from "lucide-react";

const PIE_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
];

interface Props {
  books: Book[];
}

export default function Dashboard({ books }: Props) {
  const monthlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    books
      .filter((b) => b.status === "finished" && b.finishedDate)
      .forEach((b) => {
        const ym = b.finishedDate.slice(0, 7); // "YYYY-MM"
        counts[ym] = (counts[ym] ?? 0) + 1;
      });
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [books]);

  const tagData = useMemo(() => {
    const counts: Record<string, number> = {};
    books.forEach((b) =>
      b.tags.forEach((t) => {
        counts[t] = (counts[t] ?? 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));
  }, [books]);

  const topBooks = useMemo(
    () => books.filter((b) => b.rating === 5),
    [books]
  );

  const isEmpty = books.length === 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">月別 読了数</h2>
          {isEmpty || monthlyData.length === 0 ? (
            <EmptyPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}冊`, "読了数"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Tag pie chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">ジャンル・タグの割合</h2>
          {isEmpty || tagData.length === 0 ? (
            <EmptyPlaceholder message="タグが設定された本がありません" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={tagData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={32}
                >
                  {tagData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v}冊`, ""]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Rating 5 list */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          評価★5の本
        </h2>
        {topBooks.length === 0 ? (
          <EmptyPlaceholder message="評価★5の本がまだありません" />
        ) : (
          <ul className="divide-y divide-gray-100">
            {topBooks.map((book) => (
              <li key={book.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-11 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <BarChart2 size={14} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{book.title}</p>
                  <p className="text-xs text-gray-400 truncate">{book.author || "著者不明"}</p>
                </div>
                <span className="text-xs text-yellow-500 flex-shrink-0">★★★★★</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyPlaceholder({ message = "データがありません" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
      {message}
    </div>
  );
}
