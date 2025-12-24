import { db } from '../src/lib/db';
import { updateStreak } from '../src/lib/streak';
import { trackActivity, STREAK_ACTIVITIES } from '../src/lib/activity';

async function testStreakUpdate() {
  console.log('=== TESTING STREAK UPDATE LOGIC ===\n');

  // Get the first user
  const user = await db.user.findFirst({
    where: {
      email: 'saffataziz55@gmail.com',
    },
  });

  if (!user) {
    console.log('User not found');
    return;
  }

  console.log(`Testing with user: ${user.email}`);
  console.log(`User ID: ${user.id}\n`);

  // Get current stats before update
  const statsBefore = await db.userStats.findUnique({
    where: { userId: user.id },
  });

  console.log('Stats BEFORE update:');
  console.log(`  Current Streak: ${statsBefore?.currentStreak}`);
  console.log(`  Last Activity: ${statsBefore?.lastActivityAt}`);
  console.log(`  Timezone: ${statsBefore?.timezone}\n`);

  try {
    // Test updateStreak directly
    console.log('Calling updateStreak()...');
    const result = await updateStreak(user.id);

    console.log('\nStreak Update Result:');
    console.log(`  Current Streak: ${result.currentStreak}`);
    console.log(`  Longest Streak: ${result.longestStreak}`);
    console.log(`  Streak Maintained: ${result.streakMaintained}`);
    console.log(`  Streak Broken: ${result.streakBroken}`);
    console.log(`  First Activity Today: ${result.firstActivityToday}\n`);

    // Get stats after update
    const statsAfter = await db.userStats.findUnique({
      where: { userId: user.id },
    });

    console.log('Stats AFTER update:');
    console.log(`  Current Streak: ${statsAfter?.currentStreak}`);
    console.log(`  Last Activity: ${statsAfter?.lastActivityAt}`);
    console.log(`  Timezone: ${statsAfter?.timezone}\n`);

  } catch (error) {
    console.error('ERROR during streak update:');
    console.error(error);
  }

  // Now test trackActivity
  try {
    console.log('\n--- Testing trackActivity() ---\n');
    const trackResult = await trackActivity(
      user.id,
      STREAK_ACTIVITIES.PROCESS_ITEM,
      { test: true }
    );

    console.log('Track Activity Result:');
    console.log(`  Success: ${trackResult.success}`);
    console.log(`  Activity Logged: ${trackResult.activityLogged}`);
    if (trackResult.streakResult) {
      console.log(`  Streak Result:`);
      console.log(`    Current Streak: ${trackResult.streakResult.currentStreak}`);
      console.log(`    Maintained: ${trackResult.streakResult.streakMaintained}`);
    }
  } catch (error) {
    console.error('ERROR during trackActivity:');
    console.error(error);
  }

  await db.$disconnect();
}

testStreakUpdate().catch(console.error);
