/*
  Warnings:

  - You are about to drop the column `method` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "purpose" AS ENUM ('activation', 'passwordReset');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "method",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "registerMethod";

-- CreateTable
CREATE TABLE "codes" (
    "id" SERIAL NOT NULL,
    "code" INTEGER NOT NULL,
    "type" "purpose" NOT NULL DEFAULT 'activation',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codes_code_key" ON "codes"("code");

-- AddForeignKey
ALTER TABLE "codes" ADD CONSTRAINT "codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
