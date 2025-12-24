import { db } from '../src/lib/db';

async function checkUserStreak() {
  console.log('=== CHECKING USER STREAK DATA ===\n');

  // Get all users with their stats
  const users = await db.user.findMany({
    include: {
      stats: true,
    },
    take: 5,
  });

  for (const user of users) {
    console.log(`User: ${user.email || user.clerkId}`);
    if (user.stats) {
      console.log(`  Current Streak: ${user.stats.currentStreak}`);
      console.log(`  Longest Streak: ${user.stats.longestStreak}`);
      console.log(`  Last Activity: ${user.stats.lastActivityAt}`);
      console.log(`  Timezone: ${user.stats.timezone}`);
      console.log(`  Items Processed: ${user.stats.itemsProcessed}`);
      console.log(`  Total XP: ${user.stats.totalXp}`);
    } else {
      console.log('  No stats record found');
    }
    console.log('');
  }

  // Get recent XP events to see if activity is being tracked
  console.log('\n=== RECENT XP EVENTS (Last 15) ===\n');
  const recentEvents = await db.xPEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      user: {
        select: { email: true, clerkId: true },
      },
    },
  });

  for (const event of recentEvents) {
    const userEmail = event.user.email || event.user.clerkId.substring(0, 20);
    console.log(`${event.createdAt.toISOString()} - ${userEmail}`);
    console.log(`  Action: ${event.action}, Amount: ${event.xpAmount}`);
  }

  await db.$disconnect();
}

checkUserStreak().catch(console.error);
