import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "SendGrid",
  auth: {
    user: "apikey", // literally "apikey"
    pass: process.env.SENDGRID_API_KEY,
  },
});

export async function sendVerificationEmail(to, token) {
  const verifyUrl = `http://localhost:3000/api/auth/verify-email?token=${token}`;


  console.log("verifyUrl", verifyUrl);
  console.log("API key:", process.env.SENDGRID_API_KEY);

  const mailOptions = {
    from: "Devansh Singh <devansh731831@gmail.com>", // must be your verified sender
    to,
    subject: "Verify your email",
    html: `
      <p>Thanks for signing up! Please verify your email:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  };

  console.log("From address:", mailOptions.from);

  await transporter.sendMail(mailOptions);
}

export async function sendResetEmail(to, resetUrl) {
  const mailOptions = {
    from: "Devansh Singh <devansh731831@gmail.com>", // your verified sender
    to,
    subject: "Reset your password",
    html: `
      <p>You requested to reset your password.</p>
      <p>Click the link below to set a new password (valid for 1 hour):</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  };

  await transporter.sendMail(mailOptions);
}
