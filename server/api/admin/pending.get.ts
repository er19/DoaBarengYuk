import { db } from "../../../lib/index";
import * as schema from "../../../lib/db/index";
import { isNull, gt, desc, eq, and } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  try {
    const pendingApprovals = await db
      .select({
        approval: schema.pendingUserApproval,
        user: schema.user,
      })
      .from(schema.pendingUserApproval)
      .innerJoin(
        schema.user,
        eq(schema.user.id, schema.pendingUserApproval.userId)
      )
      .where(
        and(
          isNull(schema.pendingUserApproval.approvedAt),
          gt(schema.pendingUserApproval.expiresAt, new Date())
        )
      )
      .orderBy(desc(schema.pendingUserApproval.createdAt));

    return pendingApprovals;
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch pending approvals",
    });
  }
});
