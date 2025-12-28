import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./index"; // your drizzle instance

import { createAuthMiddleware, APIError } from "better-auth/api";
import * as schema from "./db/index";
import { sendEmail } from "./auth/email";

import { eq, and, isNull } from "drizzle-orm";
type userType = typeof schema.user.$inferSelect;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // Don't auto sign-in after signup
    requireEmailVerification: false, // Custom approval flow
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const returned = ctx.context.returned;

      if (returned && typeof returned === "object" && "user" in returned) {
        const user = returned.user as userType;

        // Generate approval token
        const approvalToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        // Insert approval record using Drizzle
        await db.insert(schema.pendingUserApproval).values({
          id: user.id,
          userId: user.id,
          token: approvalToken,
          expiresAt,
        });

        const adminEmail = process.env.ADMIN_EMAIL!;
        const approvalUrl = `${process.env.BETTER_AUTH_URL}/admin/approve?token=${approvalToken}`;

        void sendEmail({
          to: adminEmail,
          subject: "New User Signup - Approval Required",
          html: `
              <h2>New User Registration</h2>
              <p>A new user has signed up and requires approval:</p>
              <ul>
                <li><strong>Name:</strong> ${user.name || "N/A"}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Signed up:</strong> ${new Date().toLocaleString()}</li>
              </ul>
              <p>
                <a href="${approvalUrl}" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; 
                          text-decoration: none; border-radius: 6px; display: inline-block;">
                  Approve User
                </a>
              </p>
              <p style="color: #666; font-size: 14px;">
                Or copy this link: ${approvalUrl}
              </p>
            `,
        });

        // Send user confirmation
        void sendEmail({
          to: user.email,
          subject: "Account Pending Approval",
          html: `
              <h2>Welcome ${user.name || "there"}!</h2>
              <p>Thank you for signing up. Your account is currently pending administrator approval.</p>
              <p>You will receive an email notification once your account has been approved.</p>
              <p>This usually takes 24-48 hours.</p>
            `,
        });
      }
    }),
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email") {
        return;
      }

      const email = ctx.body?.email;

      if (email) {
        // Find user with Drizzle
        const [userRecord] = await db
          .select()
          .from(schema.user)
          .where(eq(schema.user.email, email))
          .limit(1);

        if (userRecord) {
          // Check for pending approval
          const [approval] = await db
            .select()
            .from(schema.pendingUserApproval)
            .where(
              and(
                eq(schema.pendingUserApproval.userId, userRecord.id),
                isNull(schema.pendingUserApproval.approvedAt)
              )
            )
            .limit(1);

          if (approval) {
            throw new APIError("FORBIDDEN", {
              message:
                "Your account is pending administrator approval. Please check your email for updates.",
            });
          }
        }
      }
    }),
  },
});
