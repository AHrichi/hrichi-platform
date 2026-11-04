import { addDays, getWeekdayName, isDateOnOrBefore } from './dates';
import type {
  Chapter,
  DayReviewForecast,
  DayType,
  DueReviewItem,
} from './models';

/**
 * Determines the standard day type for a given day of the week.
 * - Tue, Wed, Sat, Sun -> 'Standard'
 * - Mon, Thu -> 'Fasting'
 * - Fri -> 'Recovery'
 */
export function getStandardDayTypeFromWeekday(
  dayOfWeek:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday',
): DayType {
  switch (dayOfWeek) {
    case 'Monday':
    case 'Thursday':
      return 'Fasting';
    case 'Friday':
      return 'Recovery';
    case 'Tuesday':
    case 'Wednesday':
    case 'Saturday':
    case 'Sunday':
    default:
      return 'Standard';
  }
}

/**
 * Computes a 7-day outlook of upcoming spaced repetition reviews and schedule constraints.
 * Analyzes D-3, D-7, and D-14 due dates and highlights high-load review collision days (>= 3 reviews).
 */
export function computeSevenDayOutlook(
  chapters: readonly Chapter[],
  startDateYmd: string,
  lastConsolidationAtChapter = 0,
): DayReviewForecast[] {
  const outlook: DayReviewForecast[] = [];

  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(startDateYmd, offset);
    const dayOfWeek = getWeekdayName(date);
    const standardDayType = getStandardDayTypeFromWeekday(dayOfWeek);

    const reviews: DueReviewItem[] = [];

    for (const ch of chapters) {
      if (!ch.originalStudyDate) continue;

      // Check D-3
      if (!ch.d3Completed) {
        if (
          ch.d3Date === date ||
          (offset === 0 && isDateOnOrBefore(ch.d3Date, date))
        ) {
          reviews.push({
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.title,
            topicName: ch.topicName,
            type: 'D-3',
            dueDate: ch.d3Date,
            isOverdue: ch.d3Date.localeCompare(date) < 0,
          });
        }
      }

      // Check D-7
      if (!ch.d7Completed) {
        if (
          ch.d7Date === date ||
          (offset === 0 && isDateOnOrBefore(ch.d7Date, date))
        ) {
          reviews.push({
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.title,
            topicName: ch.topicName,
            type: 'D-7',
            dueDate: ch.d7Date,
            isOverdue: ch.d7Date.localeCompare(date) < 0,
          });
        }
      }

      // Check D-14
      if (!ch.d14Completed) {
        if (
          ch.d14Date === date ||
          (offset === 0 && isDateOnOrBefore(ch.d14Date, date))
        ) {
          reviews.push({
            chapterNumber: ch.chapterNumber,
            chapterTitle: ch.title,
            topicName: ch.topicName,
            type: 'D-14',
            dueDate: ch.d14Date,
            isOverdue: ch.d14Date.localeCompare(date) < 0,
          });
        }
      }
    }

    // Check if 6-chapter consolidation milestone lands here
    const completedChaptersCount = chapters.filter(
      (c) => !!c.originalStudyDate,
    ).length;
    const chaptersSinceLast =
      completedChaptersCount - lastConsolidationAtChapter;
    const isMilestoneDay =
      chaptersSinceLast > 0 && chaptersSinceLast % 6 === 0 && offset === 1;

    const dayType: DayType = isMilestoneDay ? 'Consolidation' : standardDayType;

    outlook.push({
      date,
      dayOfWeek,
      isToday: offset === 0,
      isTomorrow: offset === 1,
      dayType,
      reviews,
      hasHighLoad: reviews.length >= 3,
      isMilestoneDay,
    });
  }

  return outlook;
}
