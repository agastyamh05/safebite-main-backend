/*
  Warnings:

  - You are about to drop the `usersProfile` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "usersProfile" DROP CONSTRAINT "usersProfile_userId_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profileId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "usersProfile";

-- CreateTable
CREATE TABLE "userProfiles" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "userProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_profileId_key" ON "users"("profileId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "userProfiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
