import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkLatestItem() {
  const item = await prisma.item.findFirst({
    where: {
      title: { contains: 'PowerPoints', mode: 'insensitive' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      url: true,
      source: true,
      embedHtml: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  if (!item) {
    console.log('❌ Item not found');
    return;
  }

  console.log('=== POWERPOINTS ITEM ===');
  console.log('ID:', item.id);
  console.log('Title:', item.title);
  console.log('URL:', item.url);
  console.log('Source:', item.source);
  console.log('Created:', item.createdAt);
  console.log('Has embedHtml:', !!item.embedHtml);
  console.log('Has imageUrl:', !!item.imageUrl);

  if (item.embedHtml) {
    console.log('\nembedHtml length:', item.embedHtml.length);
    const videoIdMatch = item.embedHtml.match(/data-video-id="(\d+)"/);
    if (videoIdMatch) {
      console.log('\n✅ VIDEO ID:', videoIdMatch[1]);
      console.log('✅ SHOULD SHOW IFRAME');
    } else {
      console.log('\n❌ NO VIDEO ID IN EMBEDHTML');
    }
  } else {
    console.log('\n❌ NO EMBEDHTML - This item was NOT processed with embed capture');
    console.log('This is the problem - the item needs embedHtml to show the iframe');
  }
}

checkLatestItem()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
