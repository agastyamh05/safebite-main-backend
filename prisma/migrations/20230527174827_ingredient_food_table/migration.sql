/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "registerMethod" AS ENUM ('local', 'google');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "method" "registerMethod" NOT NULL DEFAULT 'local',
ADD COLUMN     "role" "role" NOT NULL DEFAULT 'user';

-- CreateTable
CREATE TABLE "usersProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "usersProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "isMainAlergen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "picture" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userFoodBookmarkAssoc" (
    "userId" TEXT NOT NULL,
    "foodId" INTEGER NOT NULL,
    "bookmarkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "userFoodBookmarkAssoc_pkey" PRIMARY KEY ("userId","foodId")
);

-- CreateTable
CREATE TABLE "_ingredientsTousers" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_foodsToingredients" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "foods_name_key" ON "foods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ingredientsTousers_AB_unique" ON "_ingredientsTousers"("A", "B");

-- CreateIndex
CREATE INDEX "_ingredientsTousers_B_index" ON "_ingredientsTousers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_foodsToingredients_AB_unique" ON "_foodsToingredients"("A", "B");

-- CreateIndex
CREATE INDEX "_foodsToingredients_B_index" ON "_foodsToingredients"("B");

-- AddForeignKey
ALTER TABLE "usersProfile" ADD CONSTRAINT "usersProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userFoodBookmarkAssoc" ADD CONSTRAINT "userFoodBookmarkAssoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userFoodBookmarkAssoc" ADD CONSTRAINT "userFoodBookmarkAssoc_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ingredientsTousers" ADD CONSTRAINT "_ingredientsTousers_A_fkey" FOREIGN KEY ("A") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ingredientsTousers" ADD CONSTRAINT "_ingredientsTousers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_foodsToingredients" ADD CONSTRAINT "_foodsToingredients_A_fkey" FOREIGN KEY ("A") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_foodsToingredients" ADD CONSTRAINT "_foodsToingredients_B_fkey" FOREIGN KEY ("B") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
