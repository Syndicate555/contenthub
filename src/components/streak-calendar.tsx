"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Flame, Calendar as CalendarIcon } from "lucide-react";

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
  activityDates: Set<string>
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
  let checkDate = new Date(today);

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

export function StreakCalendar({ days = 60 }: { days?: number }) {
  const { data, error, isLoading } = useSWR<CalendarData>(
    `/api/streak/calendar?days=${days}`,
    fetcher
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

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
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
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-600" />
          Last {days} Days
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="font-medium">{currentStreak} day streak</span>
        </div>
      </div>

      {/* Compact Calendar Grid */}
      <div className="relative">
        {/* Month labels above calendar */}
        <div className="flex gap-0.5 mb-1 ml-5">
          {calendarGrid.map((week, index) => {
            const label = getMonthLabel(index);
            return (
              <div key={index} className="flex-1 text-[10px] text-gray-500">
                {label || ""}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          {/* Day labels on the left */}
          <div className="flex flex-col gap-0.5 justify-between py-0.5">
            {weekDays.map((day, index) => (
              <div
                key={day + index}
                className="w-4 h-2.5 text-[9px] text-gray-500 flex items-center"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid (rotated - weeks as columns) */}
          <div className="flex-1 flex gap-0.5">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5 flex-1">
                {week.map((cell, dayIndex) => {
                  const key = `${weekIndex}-${dayIndex}`;

                  return (
                    <div
                      key={key}
                      className={`h-2.5 rounded-sm transition-all cursor-pointer ${
                        cell.isFuture
                          ? "bg-gray-50"
                          : cell.hasActivity
                          ? cell.isToday
                            ? "bg-orange-500 ring-1 ring-orange-400"
                            : "bg-green-500 hover:bg-green-600 hover:scale-110"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                      title={`${cell.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${
                        cell.hasActivity ? " ✓" : ""
                      }${cell.isToday ? " (Today)" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Compact Legend */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-2 h-2 bg-gray-200 rounded-sm"></div>
              <div className="w-2 h-2 bg-green-300 rounded-sm"></div>
              <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>

          <div className="text-[11px] text-gray-600">
            <span className="font-medium">{data.totalActiveDays}</span> active • {" "}
            <span className="font-medium">{Math.round((data.totalActiveDays / days) * 100)}%</span> consistency
          </div>
        </div>
      </div>
    </div>
  );
}
