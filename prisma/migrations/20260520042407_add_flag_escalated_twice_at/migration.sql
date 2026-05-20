-- AlterTable
ALTER TABLE "DistressingCallFlag" ADD COLUMN     "escalatedTwiceAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DistressingCallFlag_escalatedTwiceAt_idx" ON "DistressingCallFlag"("escalatedTwiceAt");
