/**
 * Recalculate streaks for all users based on their XP event history
 * This fixes streaks that were incorrectly tracked due to the race condition bug
 */
import { db } from '../src/lib/db';
import { isSameDayInTimezone, isConsecutiveDayInTimezone } from '../src/lib/timezone';

async function recalculateStreaks() {
  console.log('=== RECALCULATING STREAKS FROM HISTORY ===\n');

  // Get all users with stats
  const users = await db.user.findMany({
    include: { stats: true },
  });

  for (const user of users) {
    if (!user.stats) {
      console.log(`Skipping ${user.email} - no stats record`);
      continue;
    }

    console.log(`\nProcessing: ${user.email || user.clerkId}`);

    const timezone = user.stats.timezone || 'UTC';

    // Get all XP events ordered by date
    const events = await db.xPEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true, action: true },
    });

    if (events.length === 0) {
      console.log('  No events found');
      continue;
    }

    // Group events by day (in user's timezone)
    const activeDays = new Set<string>();

    events.forEach(event => {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const dayString = formatter.format(event.createdAt);
      activeDays.add(dayString);
    });

    const sortedDays = Array.from(activeDays).sort();
    console.log(`  Total active days: ${sortedDays.length}`);

    // Calculate current streak (working backwards from today)
    const today = new Date();
    let currentStreak = 0;
    let checkDate = new Date(today);
    checkDate.setHours(0, 0, 0, 0);

    while (true) {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const dateString = formatter.format(checkDate);

      if (activeDays.has(dateString)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentRun = 1;
    let prevDate: Date | null = null;

    for (const dayString of sortedDays) {
      const [month, day, year] = dayString.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      if (prevDate) {
        const daysDiff = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          currentRun++;
        } else {
          longestStreak = Math.max(longestStreak, currentRun);
          currentRun = 1;
        }
      }

      prevDate = date;
    }
    longestStreak = Math.max(longestStreak, currentRun);

    console.log(`  Calculated current streak: ${currentStreak}`);
    console.log(`  Calculated longest streak: ${longestStreak}`);
    console.log(`  Old current streak: ${user.stats.currentStreak}`);
    console.log(`  Old longest streak: ${user.stats.longestStreak}`);

    // Update the stats
    if (currentStreak !== user.stats.currentStreak || longestStreak !== user.stats.longestStreak) {
      await db.userStats.update({
        where: { userId: user.id },
        data: {
          currentStreak,
          longestStreak,
          lastActivityAt: events[events.length - 1].createdAt,
        },
      });
      console.log(`  ✅ Updated streaks`);
    } else {
      console.log(`  ✨ Streaks already correct`);
    }
  }

  console.log('\n=== DONE ===');
  await db.$disconnect();
}

recalculateStreaks().catch(console.error);
