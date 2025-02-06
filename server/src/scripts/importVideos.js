const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function importVideos() {
  try {
    console.log('Reading exported videos data...');
    const rawData = fs.readFileSync('exportedVideos.json', 'utf-8');
    const { videos } = JSON.parse(rawData);

    // Loop through each video and import it
    for (const video of videos) {
      // If there is an associated category, upsert it first
      let categoryId = null;
      if (video.category) {
        const cat = video.category;

        // Upsert the category using its unique field (categoryId)
        const category = await prisma.category.upsert({
          where: { categoryId: cat.categoryId },
          update: {
            title: cat.title,
          },
          create: {
            categoryId: cat.categoryId,
            title: cat.title,
          },
        });
        categoryId = category.categoryId;
      }

      // Prepare the video data for insertion:
      // - Remove the original `id` field (and nested category object) so that Prisma can auto-generate a new id.
      // - Convert date fields (if necessary) from strings to Date objects.
      const {
        id,         // remove the old id
        category,   // remove the category object
        publishedAt,
        trendingDate,
        ...restVideo
      } = video;

      // Build the data object for the new video record
      const videoData = {
        ...restVideo,
        publishedAt: new Date(publishedAt),
        trendingDate: new Date(trendingDate),
        // Set the categoryId field (which is required by the relation) if available
        categoryId: categoryId || restVideo.categoryId, // use the upserted categoryId or the one from export
      };

      // Create the video in the new database
      await prisma.video.create({
        data: videoData,
      });

      console.log(`Imported video: ${video.videoId}`);
    }

    console.log('All videos have been imported successfully.');
  } catch (error) {
    console.error('Error importing videos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importVideos();
