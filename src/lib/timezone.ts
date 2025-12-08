// Timezone Utilities
// Provides timezone-aware date operations using native Intl API

/**
 * Get the user's browser timezone using Intl API
 * Returns IANA timezone identifier (e.g., "America/New_York", "Europe/London")
 */
export function getBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    // Fallback to UTC if timezone detection fails
    return "UTC";
  }
}

/**
 * Validate if a string is a valid IANA timezone
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    // Try to create a DateTimeFormat with the timezone
    // If it's invalid, this will throw
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the start of day (midnight) in a specific timezone
 *
 * @param date - The date to get start of day for
 * @param timezone - IANA timezone identifier
 * @returns Date object set to midnight in the specified timezone
 */
export function getStartOfDayInTimezone(date: Date, timezone: string): Date {
  // Format the date in the target timezone to get the local date string
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('Failed to parse date parts');
  }

  // Create a date string in the target timezone
  const dateString = `${year}-${month}-${day}T00:00:00`;

  // Parse it as if it were in the target timezone
  // We use a trick: create the date string and then adjust for timezone offset
  const localDate = new Date(dateString);

  // Get the offset between the local timezone and target timezone
  const localFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Format the local midnight time in the target timezone
  const targetTimeString = localFormatter.format(localDate);

  // Parse it back to get the actual UTC time that represents midnight in target timezone
  const [datePart, timePart] = targetTimeString.split(', ');
  const [m, d, y] = datePart.split('/');
  const [h, min, s] = timePart.split(':');

  // Create UTC date representing midnight in target timezone
  const utcDate = new Date(Date.UTC(
    parseInt(y),
    parseInt(m) - 1,
    parseInt(d),
    parseInt(h) - (localDate.getTimezoneOffset() / 60),
    parseInt(min),
    parseInt(s)
  ));

  // Simpler approach: use toLocaleString to get the date in target timezone
  // Then parse it back to create a Date object
  const simpleDateString = date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const [simplifiedMonth, simplifiedDay, simplifiedYear] = simpleDateString.split('/');

  // Create a Date object for midnight in the target timezone
  // We'll use the ISO string format and parse it in UTC, then adjust
  const midnightInTargetTZ = new Date(`${simplifiedYear}-${simplifiedMonth}-${simplifiedDay}T00:00:00.000Z`);

  // Get what time this actually is in the target timezone
  const checkFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Much simpler approach: just get the date components in target timezone
  // and create a new date object
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  tzDate.setHours(0, 0, 0, 0);

  return tzDate;
}

/**
 * Check if two dates are on the same day in a specific timezone
 */
export function isSameDayInTimezone(
  date1: Date,
  date2: Date,
  timezone: string
): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const date1String = formatter.format(date1);
  const date2String = formatter.format(date2);

  return date1String === date2String;
}

/**
 * Check if two dates are consecutive days in a specific timezone
 *
 * @param yesterday - The earlier date
 * @param today - The later date
 * @param timezone - IANA timezone identifier
 * @returns true if today is exactly one day after yesterday in the timezone
 */
export function isConsecutiveDayInTimezone(
  yesterday: Date,
  today: Date,
  timezone: string
): boolean {
  // Get date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Parse yesterday's date in target timezone
  const yesterdayStr = formatter.format(yesterday);
  const [yMonth, yDay, yYear] = yesterdayStr.split('/').map(Number);

  // Parse today's date in target timezone
  const todayStr = formatter.format(today);
  const [tMonth, tDay, tYear] = todayStr.split('/').map(Number);

  // Create Date objects for comparison (in UTC)
  const yesterdayDate = new Date(Date.UTC(yYear, yMonth - 1, yDay));
  const todayDate = new Date(Date.UTC(tYear, tMonth - 1, tDay));

  // Check if today is exactly 1 day after yesterday
  const oneDayMs = 24 * 60 * 60 * 1000;
  const diffMs = todayDate.getTime() - yesterdayDate.getTime();

  return diffMs === oneDayMs;
}

/**
 * Get the current date/time in a specific timezone
 * Useful for displaying local time to users
 */
export function getNowInTimezone(timezone: string): Date {
  const now = new Date();
  const tzString = now.toLocaleString('en-US', { timeZone: timezone });
  return new Date(tzString);
}

/**
 * Calculate hours remaining until midnight in a specific timezone
 */
export function getHoursUntilMidnight(timezone: string): number {
  const now = new Date();

  // Get current hour and minute in target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const timeString = formatter.format(now);
  const [hours, minutes] = timeString.split(':').map(Number);

  // Calculate hours until midnight
  const currentMinutes = hours * 60 + minutes;
  const midnightMinutes = 24 * 60;
  const minutesRemaining = midnightMinutes - currentMinutes;

  return minutesRemaining / 60;
}

/**
 * Get the end of day (23:59:59) in a specific timezone as a Date object
 *
 * @param timezone - IANA timezone identifier
 * @returns Date object representing end of current day in the specified timezone
 */
export function getEndOfDayInTimezone(timezone: string): Date {
  const now = new Date();

  // Get the current date components in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateString = formatter.format(now);
  const [month, day, year] = dateString.split('/').map(Number);

  // Create a date for end of day (23:59:59.999) in the target timezone
  // We do this by creating a date string and parsing it with the timezone
  const endOfDayString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T23:59:59`;

  // Convert to Date object
  // This represents the local time, so we need to adjust for timezone offset
  const localDate = new Date(endOfDayString);

  // Get the timezone offset for this date in the target timezone
  const tzFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Format a known UTC time to understand the offset
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const tzMidnight = tzFormatter.format(utcMidnight);

  // Parse the formatted string to get actual components
  const [tzDate, tzTime] = tzMidnight.split(', ');
  const [tzM, tzD, tzY] = tzDate.split('/').map(Number);
  const [tzH, tzMin, tzSec] = tzTime.split(':').map(Number);

  // Calculate the offset in hours
  const offset = tzH;

  // Create the actual Date object for end of day in the target timezone
  // by creating a UTC time that corresponds to 23:59:59 in the target timezone
  const endOfDay = new Date(Date.UTC(year, month - 1, day, 23 - offset, 59, 59, 999));

  return endOfDay;
}
