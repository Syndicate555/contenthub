import { PrismaClient } from '../src/generated/prisma';
import { DEFAULT_BADGES } from '../src/lib/badges';

const prisma = new PrismaClient();

// Default domains for ContentHub gamification system
const DEFAULT_DOMAINS = [
  {
    name: 'finance',
    displayName: 'Finance',
    description: 'Investing, budgeting, wealth building, and financial literacy',
    icon: '💰',
    color: '#22c55e', // green-500
    order: 1,
  },
  {
    name: 'career',
    displayName: 'Career',
    description: 'Job skills, networking, professional development, and workplace success',
    icon: '💼',
    color: '#3b82f6', // blue-500
    order: 2,
  },
  {
    name: 'health',
    displayName: 'Health',
    description: 'Fitness, nutrition, mental health, and overall wellness',
    icon: '🏃',
    color: '#ef4444', // red-500
    order: 3,
  },
  {
    name: 'philosophy',
    displayName: 'Philosophy',
    description: 'Wisdom, ethics, mindset, and life principles',
    icon: '🧠',
    color: '#a855f7', // purple-500
    order: 4,
  },
  {
    name: 'relationships',
    displayName: 'Relationships',
    description: 'Social skills, communication, dating, and family dynamics',
    icon: '❤️',
    color: '#ec4899', // pink-500
    order: 5,
  },
  {
    name: 'productivity',
    displayName: 'Productivity',
    description: 'Systems, habits, time management, and efficiency',
    icon: '⚡',
    color: '#f59e0b', // amber-500
    order: 6,
  },
  {
    name: 'creativity',
    displayName: 'Creativity',
    description: 'Art, writing, design, and creative expression',
    icon: '🎨',
    color: '#06b6d4', // cyan-500
    order: 7,
  },
  {
    name: 'technology',
    displayName: 'Technology',
    description: 'Programming, AI, tools, and tech innovation',
    icon: '💻',
    color: '#6366f1', // indigo-500
    order: 8,
  },
];

async function main() {
  console.log('🌱 Seeding domains...');

  for (const domain of DEFAULT_DOMAINS) {
    const existing = await prisma.domain.findUnique({
      where: { name: domain.name },
    });

    if (existing) {
      console.log(`  ✓ Domain "${domain.displayName}" already exists, updating...`);
      await prisma.domain.update({
        where: { name: domain.name },
        data: domain,
      });
    } else {
      console.log(`  + Creating domain "${domain.displayName}"...`);
      await prisma.domain.create({
        data: domain,
      });
    }
  }

  // Display all domains
  const domains = await prisma.domain.findMany({
    orderBy: { order: 'asc' },
  });
  console.log('\n📊 Current domains:');
  domains.forEach((d) => {
    console.log(`  ${d.icon} ${d.displayName} (${d.name})`);
  });

  // Seed badges
  console.log('\n🏅 Seeding badges...');

  for (const badgeData of DEFAULT_BADGES) {
    const existing = await prisma.badge.findUnique({
      where: { key: badgeData.key },
    });

    if (existing) {
      console.log(`  ✓ Badge "${badgeData.name}" already exists, updating...`);
      await prisma.badge.update({
        where: { key: badgeData.key },
        data: badgeData,
      });
    } else {
      console.log(`  + Creating badge "${badgeData.name}"...`);
      await prisma.badge.create({
        data: badgeData,
      });
    }
  }

  // Display all badges
  const badges = await prisma.badge.findMany({
    orderBy: [{ rarity: 'asc' }, { criteriaValue: 'asc' }],
  });
  console.log('\n🏅 Current badges:');
  const badgesByType: Record<string, any[]> = {};
  badges.forEach((b) => {
    if (!badgesByType[b.criteriaType]) {
      badgesByType[b.criteriaType] = [];
    }
    badgesByType[b.criteriaType].push(b);
  });

  Object.entries(badgesByType).forEach(([type, badgeList]) => {
    console.log(`  ${type.toUpperCase()}:`);
    badgeList.forEach((b) => {
      console.log(`    ${b.icon} ${b.name} (${b.rarity}) - ${b.description}`);
    });
  });

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
