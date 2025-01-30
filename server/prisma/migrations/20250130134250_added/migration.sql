-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "channelId" TEXT NOT NULL,
    "channelTitle" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "trendingDate" TIMESTAMP(3) NOT NULL,
    "tags" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL,
    "likes" INTEGER NOT NULL,
    "dislikes" INTEGER NOT NULL,
    "commentCount" INTEGER NOT NULL,
    "thumbnailLink" TEXT NOT NULL,
    "commentsDisabled" BOOLEAN NOT NULL,
    "ratingsDisabled" BOOLEAN NOT NULL,
    "description" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "pageToken" TEXT,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_categoryId_key" ON "Category"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoId_key" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_videoId_idx" ON "Video"("videoId");

-- CreateIndex
CREATE INDEX "Video_countryCode_trendingDate_idx" ON "Video"("countryCode", "trendingDate");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("categoryId") ON DELETE RESTRICT ON UPDATE CASCADE;
