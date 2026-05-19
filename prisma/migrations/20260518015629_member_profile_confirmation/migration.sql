-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditKind" ADD VALUE 'MEMBER_PROFILE_CONFIRMED';
ALTER TYPE "AuditKind" ADD VALUE 'MEMBER_PHONE_UPDATED';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "profileConfirmedAt" TIMESTAMP(3);
