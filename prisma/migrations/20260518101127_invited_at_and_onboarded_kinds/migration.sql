-- AlterEnum
ALTER TYPE "AuditKind" ADD VALUE 'MEMBER_ONBOARDED';

-- AlterEnum
ALTER TYPE "NotificationKind" ADD VALUE 'MEMBER_ONBOARDED';

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "invitedAt" TIMESTAMP(3);
