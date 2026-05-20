-- AlterTable
ALTER TABLE "DistressingCallFlag" ADD COLUMN     "escalatedAt" TIMESTAMP(3),
ADD COLUMN     "expectedResponseBy" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SeroquelLog" ADD COLUMN     "escalatedTwiceAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DistressingCallFlag_expectedResponseBy_idx" ON "DistressingCallFlag"("expectedResponseBy");

-- CreateIndex
CREATE INDEX "DistressingCallFlag_escalatedAt_idx" ON "DistressingCallFlag"("escalatedAt");

-- CreateIndex
CREATE INDEX "SeroquelLog_escalatedTwiceAt_idx" ON "SeroquelLog"("escalatedTwiceAt");
