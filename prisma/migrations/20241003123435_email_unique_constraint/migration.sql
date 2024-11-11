/*
  Warnings:

  - You are about to drop the column `ticketNumber` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `cancelledAt` on the `CancelledBooking` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `venue` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "ticketNumber";

-- AlterTable
ALTER TABLE "CancelledBooking" DROP COLUMN "cancelledAt";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "venue" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
