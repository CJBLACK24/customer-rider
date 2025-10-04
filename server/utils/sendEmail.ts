// server/utils/sendEmail.ts

import nodemailer from "nodemailer";

import dotenv from "dotenv";

dotenv.config({ quiet: true }); 

const host = process.env.EMAIL_HOST?.trim() || "sandbox.smtp.mailtrap.io";
const port = Number(process.env.EMAIL_PORT) || 2525;
const user = process.env.EMAIL_USER?.trim() || "";
const pass = process.env.EMAIL_PASS?.trim() || "";

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  //logger: true,
  // debug: true,
});

transporter.verify((err, success) => {
  if (err) console.error("Mail transporter error:", err);
  else console.log("Mail transporter ready");
});

/**
 * sendResetEmail(to, pin)
 * Sends a plain‑text email containing just the 6‑digit PIN.
 */
export async function sendResetEmail(to: string, pin: string) {
  try {
    const info = await transporter.sendMail({
      from: `"Patch Up Support" <${user}>`,
      to,
      subject: "🔒 Your Patch Up Reset PIN",
      html: `
        <p>Hello,</p>
        <p>Your password reset PIN is:</p>
        <h2>${pin}</h2>
        <p>It expires in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore.</p>
      `,
    });
    console.log("Reset PIN email sent; messageId=", info.messageId);
  } catch (e) {
    console.error("Error sending PIN email:", e);
    throw new Error("Failed to send reset PIN email");
  }
}

