import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import fs from 'fs';

const prisma = new PrismaClient();

async function exportVideosToExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Videos');

  // Fetch videos
  const videos = await prisma.video.findMany();

  if (videos.length === 0) {
    console.log('No video data to export.');
    return;
  }

  // Define columns based on your schema
 worksheet.columns = [
  { header: 'ID', key: 'id', width: 36 },
  { header: 'Video ID', key: 'videoId', width: 25 },
  { header: 'Title', key: 'title', width: 30 },
  { header: 'Published At', key: 'publishedAt', width: 20 },
  { header: 'Channel ID', key: 'channelId', width: 30 },
  { header: 'Channel Title', key: 'channelTitle', width: 25 },
  { header: 'Trending Date', key: 'trendingDate', width: 20 },
  { header: 'Tags', key: 'tags', width: 30 },
  { header: 'View Count', key: 'viewCount', width: 15 },
  { header: 'Likes', key: 'likes', width: 10 },
  { header: 'Dislikes', key: 'dislikes', width: 10 },
  { header: 'Comment Count', key: 'commentCount', width: 15 },
  { header: 'Thumbnail Link', key: 'thumbnailLink', width: 40 },
  { header: 'Comments Disabled', key: 'commentsDisabled', width: 20 },
  { header: 'Ratings Disabled', key: 'ratingsDisabled', width: 20 },
  { header: 'Description', key: 'description', width: 50 },
  { header: 'Country Code', key: 'countryCode', width: 10 },
  { header: 'Page Token', key: 'pageToken', width: 20 },
  { header: 'Category ID', key: 'categoryId', width: 15 },
  { header: 'Category Name', key: 'categoryName', width: 25 }, // extracted manually
];


  // Add rows
  videos.forEach((video) => {
    worksheet.addRow(video);
  });

  // Ensure directory exists
  fs.mkdirSync('./exports', { recursive: true });

  // Save to file
  const filePath = './exports/videos.xlsx';
  await workbook.xlsx.writeFile(filePath);
  console.log(`Excel file created at ${filePath}`);
}

exportVideosToExcel()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
