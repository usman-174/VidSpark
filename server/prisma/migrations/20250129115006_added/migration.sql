-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('PARENT_RELATIONSHIP', 'SIMPLE_RELATIONSHIP', 'FIRST_SIGNUP');

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "PolicyType" NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);
