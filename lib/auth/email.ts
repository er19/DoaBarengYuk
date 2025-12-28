import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
      to: [to, "delivered@resend.dev"],
      subject,
      html,
    });
    console.log(`✓ Email sent to ${to}`);
  } catch (error) {
    console.error("✗ Failed to send email:", error);
  }
}
