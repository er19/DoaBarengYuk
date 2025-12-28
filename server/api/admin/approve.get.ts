import { db } from "../../../lib/index";
import * as schema from "../../../lib/db/index";
import { eq } from "drizzle-orm";
import { sendEmail } from "../../../lib/auth/email";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const token = query.token as string;

  // Validate token parameter
  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing approval token",
    });
  }

  try {
    // Find the pending approval with user data
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

    // Check if approval record exists
    if (!approval) {
      throw createError({
        statusCode: 404,
        statusMessage: "Invalid or expired approval token",
      });
    }

    // Check if already approved
    if (approval.approval.approvedAt) {
      return sendRedirect(
        event,
        "/admin/approval-success?status=already-approved"
      );
    }

    // Check if token has expired
    if (new Date() > approval.approval.expiresAt) {
      throw createError({
        statusCode: 400,
        statusMessage: "Approval token has expired. Please contact support.",
      });
    }

    // Approve the user by updating the approval record
    await db
      .update(schema.pendingUserApproval)
      .set({
        approvedAt: new Date(),
        approvedBy: "admin", // You can add admin user ID here if you have admin auth
      })
      .where(eq(schema.pendingUserApproval.token, token));

    // Send approval notification email to the user
    const config = useRuntimeConfig();
    await sendEmail({
      to: approval.user.email,
      subject: "Account Approved - Welcome!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Your Account Has Been Approved! 🎉</h2>
          <p>Hi ${approval.user.name || "there"},</p>
          <p>Great news! Your account has been approved by our administrator.</p>
          <p>You can now sign in and start using our platform.</p>
          <div style="margin: 30px 0;">
            <a href="${config.public.appUrl}/sign-in" 
               style="background-color: #10b981; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Sign In Now
            </a>
          </div>
          <p>Welcome aboard!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions, feel free to contact our support team.
          </p>
        </div>
      `,
    });

    // Redirect to success page
    return sendRedirect(event, "/admin/approval-success");
  } catch (error) {
    console.error("Error approving user:", error);

    // If it's already a H3Error, rethrow it
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage:
        "Failed to approve user. Please try again or contact support.",
    });
  }
});
