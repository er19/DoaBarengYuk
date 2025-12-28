import { db } from "../../../lib/index";
import * as schema from "../../../lib/db/index";
import { eq } from "drizzle-orm";
import { sendEmail } from "../../../lib/auth/email";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { token, adminId } = body;

  // Validate required fields
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Token is required",
    });
  }

  try {
    // Find the pending approval
    const [approval] = await db
      .select({
        approval: schema.pendingUserApproval,
        user: schema.user,
      })
      .from(schema.pendingUserApproval)
      .innerJoin(
        schema.user,
        eq(schema.user.id, schema.pendingUserApproval.userId)
      )
      .where(eq(schema.pendingUserApproval.token, token))
      .limit(1);

    if (!approval) {
      throw createError({
        statusCode: 404,
        statusMessage: "Invalid approval token",
      });
    }

    // Check if already approved
    if (approval.approval.approvedAt) {
      return {
        message: "User already approved",
        user: {
          id: approval.user.id,
          email: approval.user.email,
          name: approval.user.name,
          approvedAt: approval.approval.approvedAt,
        },
      };
    }

    // Check if expired
    if (new Date() > approval.approval.expiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: "Approval token has expired",
      });
    }

    // Approve the user
    await db
      .update(schema.pendingUserApproval)
      .set({
        approvedAt: new Date(),
        approvedBy: adminId || "admin",
      })
      .where(eq(schema.pendingUserApproval.token, token));

    // Send approval email
    const config = useRuntimeConfig();
    await sendEmail({
      to: approval.user.email,
      subject: "Account Approved - Welcome!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Your Account Has Been Approved! 🎉</h2>
          <p>Hi ${approval.user.name || "there"},</p>
          <p>Great news! Your account has been approved.</p>
          <div style="margin: 30px 0;">
            <a href="${config.public.appUrl}/login" 
               style="background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In Now
            </a>
          </div>
          <p>Welcome aboard!</p>
        </div>
      `,
    });

    return {
      success: true,
      message: "User approved successfully",
      user: {
        id: approval.user.id,
        email: approval.user.email,
        name: approval.user.name,
        approvedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error approving user:", error);

    // If it's already a H3Error, rethrow it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to approve user",
    });
  }
});
