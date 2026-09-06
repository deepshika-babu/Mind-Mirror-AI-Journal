import type { JournalEntry } from '../types.ts';

/**
 * Returns ISO week key for a given date, e.g. "2026-W36"
 */
export function getWeekKey(d: Date = new Date()): string {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  const week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export interface WeekRange {
  weekKey: string;
  startDate: number; // epoch ms start of Monday 00:00:00.000
  endDate: number;   // epoch ms end of Sunday 23:59:59.999
  displayRange: string;
  label: string;
  isCurrentWeek: boolean;
}

/**
 * Calculates start and end of week (Monday 00:00 to Sunday 23:59:59.999) for a given Date or weekKey
 */
export function getWeekRangeFromDate(targetDate: Date = new Date()): WeekRange {
  const d = new Date(targetDate);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const weekKey = getWeekKey(monday);
  const now = new Date();
  const isCurrentWeek = monday.getTime() <= now.getTime() && now.getTime() <= sunday.getTime();

  const startMonth = monday.toLocaleDateString('en-US', { month: 'short' });
  const startDay = monday.getDate();
  const endMonth = sunday.toLocaleDateString('en-US', { month: 'short' });
  const endDay = sunday.getDate();
  const year = sunday.getFullYear();

  const displayRange = startMonth === endMonth
    ? `${startMonth} ${startDay} – ${endDay}, ${year}`
    : `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;

  const weekNumStr = weekKey.split('-W')[1] || '';

  return {
    weekKey,
    startDate: monday.getTime(),
    endDate: sunday.getTime(),
    displayRange,
    label: isCurrentWeek ? `This Week (${displayRange})` : `Week ${weekNumStr} (${displayRange})`,
    isCurrentWeek,
  };
}

/**
 * Converts a weekKey string (e.g. "2026-W36") to its WeekRange
 */
export function getWeekRangeFromKey(weekKey: string): WeekRange {
  const parts = weekKey.split('-W');
  if (parts.length !== 2) {
    return getWeekRangeFromDate(new Date());
  }
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // Approximate date for that week:
  // Jan 4th is always in week 1
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // Monday = 0
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek);
  mondayOfWeek1.setHours(0, 0, 0, 0);

  const targetMonday = new Date(mondayOfWeek1);
  targetMonday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  return getWeekRangeFromDate(targetMonday);
}

/**
 * Shift weekKey by +1 or -1 week
 */
export function shiftWeek(weekKey: string, deltaWeeks: number): WeekRange {
  const currentRange = getWeekRangeFromKey(weekKey);
  const midDate = new Date(currentRange.startDate + 3 * 86400000);
  midDate.setDate(midDate.getDate() + deltaWeeks * 7);
  return getWeekRangeFromDate(midDate);
}

/**
 * Extracts all unique weeks that contain user entries or recent 8 weeks
 */
export function getSelectableWeeks(entries: JournalEntry[]): Array<WeekRange & { entryCount: number }> {
  const currentWeek = getWeekRangeFromDate(new Date());
  const weekMap = new Map<string, WeekRange & { entryCount: number }>();

  // Always include current week
  weekMap.set(currentWeek.weekKey, {
    ...currentWeek,
    entryCount: 0,
  });

  // Always include previous 3 weeks for easy retrospective browsing
  for (let i = 1; i <= 4; i++) {
    const pastWeek = shiftWeek(currentWeek.weekKey, -i);
    weekMap.set(pastWeek.weekKey, {
      ...pastWeek,
      entryCount: 0,
    });
  }

  // Count and map based on actual entries
  for (const entry of entries) {
    const timestamp = entry.createdAt || entry.updatedAt || Date.now();
    const entryDate = new Date(timestamp);
    const range = getWeekRangeFromDate(entryDate);
    const existing = weekMap.get(range.weekKey);
    if (existing) {
      existing.entryCount += 1;
    } else {
      weekMap.set(range.weekKey, {
        ...range,
        entryCount: 1,
      });
    }
  }

  // Sort descending by startDate
  return Array.from(weekMap.values()).sort((a, b) => b.startDate - a.startDate);
}

/**
 * Filter entries that fall inside a specific week range
 */
export function getEntriesForWeek(entries: JournalEntry[], range: WeekRange): JournalEntry[] {
  return entries.filter((e) => {
    const ts = e.createdAt || e.updatedAt;
    return ts >= range.startDate && ts <= range.endDate;
  });
}
