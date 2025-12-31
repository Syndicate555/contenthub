"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  Flame,
  Calendar as CalendarIcon,
  Sparkles,
  Clock3,
} from "lucide-react";

interface CalendarData {
  activityDates: string[]; // ISO date strings (YYYY-MM-DD)
  daysRequested: number;
  totalActiveDays: number;
}

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((data) => data.data);

interface DayCell {
  date: Date;
  dateString: string; // YYYY-MM-DD
  hasActivity: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Generate calendar grid for the last N days
 * Organized in weeks (Sunday to Saturday)
 */
function generateCalendarGrid(
  days: number,
  activityDates: Set<string>,
): DayCell[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: DayCell[] = [];

  // Generate cells for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dateString = date.toISOString().split("T")[0];

    cells.push({
      date,
      dateString,
      hasActivity: activityDates.has(dateString),
      isToday: i === 0,
      isFuture: false,
    });
  }

  // Organize into weeks (rows of 7)
  const weeks: DayCell[][] = [];
  let currentWeek: DayCell[] = [];

  // Pad the first week if it doesn't start on Sunday
  const firstDay = cells[0].date.getDay();
  for (let i = 0; i < firstDay; i++) {
    const paddingDate = new Date(cells[0].date);
    paddingDate.setDate(paddingDate.getDate() - (firstDay - i));

    currentWeek.push({
      date: paddingDate,
      dateString: paddingDate.toISOString().split("T")[0],
      hasActivity: false,
      isToday: false,
      isFuture: false,
    });
  }

  // Add all cells to weeks
  cells.forEach((cell, index) => {
    currentWeek.push(cell);

    if (currentWeek.length === 7 || index === cells.length - 1) {
      // Week is complete or last cell
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Pad the last week if needed
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      const lastDate = currentWeek[currentWeek.length - 1].date;
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + 1);

      currentWeek.push({
        date: nextDate,
        dateString: nextDate.toISOString().split("T")[0],
        hasActivity: false,
        isToday: false,
        isFuture: nextDate > today,
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

/**
 * Calculate current streak from activity dates
 */
function calculateCurrentStreak(activityDates: Set<string>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const checkDate = new Date(today);

  while (true) {
    const dateString = checkDate.toISOString().split("T")[0];

    if (activityDates.has(dateString)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateLongestStreak(activityDates: Set<string>): number {
  const sorted = Array.from(activityDates).sort();
  let longest = 0;
  let current = 0;
  let prev: Date | null = null;

  for (const dateStr of sorted) {
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    if (prev) {
      const diff = (date.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        current += 1;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    prev = date;
  }

  return longest;
}

export function StreakCalendar({ days = 180 }: { days?: number }) {
  const { data, error, isLoading } = useSWR<CalendarData>(
    `/api/streak/calendar?days=${days}`,
    fetcher,
  );

  const calendarGrid = useMemo(() => {
    if (!data) return [];
    const activitySet = new Set(data.activityDates);
    return generateCalendarGrid(days, activitySet);
  }, [data, days]);

  const currentStreak = useMemo(() => {
    if (!data) return 0;
    return calculateCurrentStreak(new Set(data.activityDates));
  }, [data]);

  const longestStreak = useMemo(() => {
    if (!data) return 0;
    return calculateLongestStreak(new Set(data.activityDates));
  }, [data]);

  const lastActiveDate = useMemo(() => {
    if (!data || !data.activityDates.length) return null;
    const latest = data.activityDates.slice().sort().at(-1);
    return latest ? new Date(latest) : null;
  }, [data]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Get month labels for the calendar
  const getMonthLabel = (weekIndex: number) => {
    if (weekIndex >= calendarGrid.length) return null;
    const firstDayOfWeek = calendarGrid[weekIndex][0];
    if (!firstDayOfWeek) return null;

    // Only show label if it's the first week of the month
    const date = firstDayOfWeek.date;
    if (date.getDate() <= 7) {
      return monthNames[date.getMonth()];
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-inner">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-semibold">
              Usage pulse
            </p>
            <h3 className="text-lg font-semibold text-slate-900">
              Last {days} days
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="inline-flex items-center gap-1 rounded-full bg-orange-50 text-orange-700 px-3 py-1 border border-orange-100">
            <Flame className="w-4 h-4" />
            <span className="font-semibold">{currentStreak} day streak</span>
          </div>
          <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 px-3 py-1 border border-indigo-100">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold">
              {Math.round((data.totalActiveDays / days) * 100)}% consistency
            </span>
          </div>
        </div>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <p className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wide">
            Active days
          </p>
          <p className="text-lg font-bold text-emerald-800">
            {data.totalActiveDays}
          </p>
          <p className="text-[10px] text-emerald-700/80">
            {Math.round((data.totalActiveDays / days) * 100)}% hit rate
          </p>
        </div>
        <div className="rounded-lg border border-orange-100 bg-orange-50/70 px-3 py-2">
          <p className="text-[11px] text-orange-700 font-semibold uppercase tracking-wide">
            Current streak
          </p>
          <p className="text-lg font-bold text-orange-800">{currentStreak}d</p>
          <p className="text-[10px] text-orange-700/80">Keep the flame alive</p>
        </div>
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2">
          <p className="text-[11px] text-blue-700 font-semibold uppercase tracking-wide">
            Best run
          </p>
          <p className="text-lg font-bold text-blue-800">{longestStreak}d</p>
          <p className="text-[10px] text-blue-700/80">Longest streak yet</p>
        </div>
        <div className="rounded-lg border border-purple-100 bg-purple-50/70 px-3 py-2">
          <p className="text-[11px] text-purple-700 font-semibold uppercase tracking-wide">
            Last active
          </p>
          <p className="text-lg font-bold text-purple-800">
            {lastActiveDate
              ? lastActiveDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </p>
          <p className="text-[10px] text-purple-700/80 flex items-center gap-1">
            <Clock3 className="w-3 h-3" />
            {lastActiveDate ? "Recent visit logged" : "No activity yet"}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative mt-1">
        {/* Horizontal scroll container for mobile */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
          {/* Month labels above calendar */}
          <div className="flex gap-0.5 mb-1 ml-6">
            {calendarGrid.map((week, index) => {
              const label = getMonthLabel(index);
              return (
                <div
                  key={index}
                  className="flex-1 text-[10px] text-gray-500 min-w-[12px]"
                >
                  {label || ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            {/* Day labels on the left */}
            <div className="flex flex-col gap-1 justify-between py-0.5 flex-shrink-0">
              {weekDays.map((day, index) => (
                <div
                  key={day + index}
                  className="w-5 h-3 text-[10px] text-gray-500 flex items-center"
                >
                  {index % 2 === 1 ? day : ""}
                </div>
              ))}
            </div>

            {/* Calendar grid (weeks as columns) */}
            <div className="flex gap-1 flex-1">
              {calendarGrid.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-1 flex-1 min-w-[12px]"
                >
                  {week.map((cell, dayIndex) => {
                    const key = `${weekIndex}-${dayIndex}`;
                    const ageDays = Math.max(
                      0,
                      Math.round(
                        (new Date().getTime() - cell.date.getTime()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    );
                    const intensity = cell.hasActivity
                      ? ageDays <= 7
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : ageDays <= 30
                          ? "bg-emerald-400 hover:bg-emerald-500 text-white/90"
                          : ageDays <= 90
                            ? "bg-emerald-300 hover:bg-emerald-400 text-emerald-900"
                            : "bg-emerald-200 hover:bg-emerald-300 text-emerald-900"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-500";

                    const todayHighlight = cell.isToday
                      ? "ring-2 ring-indigo-300 shadow-sm"
                      : "";

                    return (
                      <div
                        key={key}
                        className={`h-3 w-3 rounded-md transition-all duration-150 cursor-pointer ${intensity} ${todayHighlight}`}
                        title={`${cell.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}${
                          cell.hasActivity ? " • Active day" : " • No activity"
                        }${cell.isToday ? " (Today)" : ""}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between mt-4 pt-3 border-t border-slate-100 gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-md bg-slate-200"></div>
              <div className="w-3 h-3 rounded-md bg-emerald-200"></div>
              <div className="w-3 h-3 rounded-md bg-emerald-300"></div>
              <div className="w-3 h-3 rounded-md bg-emerald-400"></div>
              <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
            </div>
            <span>More recent</span>
          </div>

          <div className="text-[11px] text-slate-600 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 border border-slate-200">
              <Flame className="w-3 h-3 text-orange-500" />
              {currentStreak}d streak
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 border border-emerald-100">
              {data.totalActiveDays} active days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
