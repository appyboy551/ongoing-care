// Append-only audit log writer.

import { db } from "./db";
import { AuditKind, Prisma } from "@prisma/client";

export async function writeAudit(args: {
  kind: AuditKind;
  actorId?: string;
  actorLabel?: string;
  ipAddress?: string;
  userAgent?: string;
  detail?: Prisma.InputJsonValue;
}) {
  await db.auditEntry.create({
    data: {
      kind: args.kind,
      actorId: args.actorId,
      actorLabel: args.actorLabel,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      detail: args.detail,
    },
  });
}
