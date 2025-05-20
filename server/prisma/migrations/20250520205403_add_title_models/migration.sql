-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "expiresAt" SET DEFAULT (NOW() + INTERVAL '1 hour');

-- CreateTable
CREATE TABLE "TitleGeneration" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "provider" TEXT,

    CONSTRAINT "TitleGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedTitle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "keywords" TEXT[],
    "titleGenerationId" TEXT NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GeneratedTitle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TitleGeneration" ADD CONSTRAINT "TitleGeneration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedTitle" ADD CONSTRAINT "GeneratedTitle_titleGenerationId_fkey" FOREIGN KEY ("titleGenerationId") REFERENCES "TitleGeneration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
