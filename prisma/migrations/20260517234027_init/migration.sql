-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('ADMIN', 'FULL_MEDICAL', 'SHARED');

-- CreateEnum
CREATE TYPE "CaseOrigin" AS ENUM ('SEROQUEL_LOG', 'DISTRESSING_CALL_FLAG');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'ACTIVE', 'DONE', 'SKIPPED', 'NA');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('SEROQUEL_LOG', 'CHECK_IN_REMINDER', 'CHECK_IN_MISSED', 'DISTRESSING_CALL_FLAGGED', 'CONTENT_PUBLISHED', 'PLAN_CLOSED', 'CLINICIAN_GRANT_ISSUED', 'MONTHLY_UPDATE');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditKind" AS ENUM ('LOGIN_OTP_REQUESTED', 'LOGIN_OTP_VERIFIED', 'LOGIN_OTP_FAILED', 'LOGOUT', 'CONTENT_DRAFT_SAVED', 'CONTENT_PUBLISHED', 'SEROQUEL_LOGGED', 'SEROQUEL_CHECKIN', 'CHECK_IN_MISSED', 'DISTRESSING_CALL_FLAGGED', 'PLAN_CLOSED', 'SETTING_CHANGED', 'CLINICIAN_GRANT_ISSUED', 'CLINICIAN_GRANT_USED', 'CLINICIAN_GRANT_REVOKED', 'MEMBER_ACCESS_REVOKED', 'PII_VIEW');

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "shortName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "relationship" TEXT,
    "tier" "Tier" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpRequest" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSection" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "tier" "Tier" NOT NULL DEFAULT 'SHARED',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentPublish" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "bodySnapshot" TEXT NOT NULL,
    "notifyResult" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentPublish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "schedule" TEXT,
    "notes" TEXT,
    "tier" "Tier" NOT NULL DEFAULT 'FULL_MEDICAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacistReview" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT,
    "reviewerName" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PharmacistReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTeamMember" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organisation" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "CareTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "runBy" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "hospital" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "reason" TEXT,
    "voluntary" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeroquelLog" (
    "id" TEXT NOT NULL,
    "doseMg" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "locationAccuracyM" DOUBLE PRECISION,
    "locationTakenAt" TIMESTAMP(3),
    "stressors" JSONB NOT NULL,
    "emotions" JSONB NOT NULL,
    "inFacility" BOOLEAN NOT NULL,
    "facilityName" TEXT,
    "severity" INTEGER NOT NULL,
    "drivingThis" TEXT,
    "whatWouldHelp" TEXT,
    "reflectionNote" TEXT,
    "timerHours" INTEGER NOT NULL,
    "expectedCheckInBy" TIMESTAMP(3) NOT NULL,
    "checkedInAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "closedNote" TEXT,
    "notifyResult" JSONB,
    "escalatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeroquelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistressingCallFlag" (
    "id" TEXT NOT NULL,
    "flaggedById" TEXT NOT NULL,
    "flaggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "context" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,

    CONSTRAINT "DistressingCallFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicianAccessGrant" (
    "id" TEXT NOT NULL,
    "clinicianName" TEXT NOT NULL,
    "clinicianRole" TEXT,
    "organisation" TEXT,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "scope" TEXT NOT NULL DEFAULT 'MEDICAL_REPORT_READ',
    "reason" TEXT,
    "issuedByEmail" TEXT NOT NULL,

    CONSTRAINT "ClinicianAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "origin" "CaseOrigin" NOT NULL,
    "originSeroquelLogId" TEXT,
    "originDistressingCallFlagId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "closedReason" TEXT,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseStep" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stepKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "completedByLabel" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "message" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "toEmail" TEXT NOT NULL,
    "toName" TEXT,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "errorText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditEntry" (
    "id" TEXT NOT NULL,
    "kind" "AuditKind" NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE INDEX "OtpRequest_memberId_expiresAt_idx" ON "OtpRequest"("memberId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_memberId_expiresAt_idx" ON "Session"("memberId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSection_slug_key" ON "ContentSection"("slug");

-- CreateIndex
CREATE INDEX "SeroquelLog_takenAt_idx" ON "SeroquelLog"("takenAt");

-- CreateIndex
CREATE INDEX "SeroquelLog_expectedCheckInBy_idx" ON "SeroquelLog"("expectedCheckInBy");

-- CreateIndex
CREATE INDEX "SeroquelLog_escalatedAt_idx" ON "SeroquelLog"("escalatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicianAccessGrant_tokenHash_key" ON "ClinicianAccessGrant"("tokenHash");

-- CreateIndex
CREATE INDEX "Case_status_openedAt_idx" ON "Case"("status", "openedAt");

-- CreateIndex
CREATE INDEX "CaseStep_caseId_order_idx" ON "CaseStep"("caseId", "order");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_createdAt_idx" ON "CaseEvent"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_createdAt_idx" ON "AuditEntry"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEntry_kind_createdAt_idx" ON "AuditEntry"("kind", "createdAt");

-- AddForeignKey
ALTER TABLE "OtpRequest" ADD CONSTRAINT "OtpRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPublish" ADD CONSTRAINT "ContentPublish_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ContentSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPublish" ADD CONSTRAINT "ContentPublish_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacistReview" ADD CONSTRAINT "PharmacistReview_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DistressingCallFlag" ADD CONSTRAINT "DistressingCallFlag_flaggedById_fkey" FOREIGN KEY ("flaggedById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseStep" ADD CONSTRAINT "CaseStep_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEntry" ADD CONSTRAINT "AuditEntry_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
