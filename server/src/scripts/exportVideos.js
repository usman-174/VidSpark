const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportVideos() {
  try {
    console.log('Fetching videos from the database...');

    // Fetch all videos and include the associated category details
    const videos = await prisma.video.findMany({
      include: {
        category: true,
      },
    });

    const data = { videos };

    // Save the exported data to a JSON file
    fs.writeFileSync('exportedVideos.json', JSON.stringify(data, null, 2));
    console.log('Videos successfully exported to exportedVideos.json');
  } catch (error) {
    console.error('Error exporting videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportVideos();
