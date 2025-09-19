"use server";
import nodemailer from "nodemailer";
import crypto from "crypto";

const newOTP = crypto.randomInt(100000, 999999);
const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
const SITE_MAIL_RECIEVER = process.env.SITE_MAIL_RECIEVER;

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: SMTP_SERVER_HOST || "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_SERVER_USERNAME,
    pass: SMTP_SERVER_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For development, just log the email
    if (process.env.NODE_ENV === "development") {
      console.log("=== EMAIL WOULD BE SENT ===");
      console.log("To:", options.to);
      console.log("Subject:", options.subject);
      console.log("HTML:", options.html);
      console.log("==========================");
      return true;
    }

    // Verify transporter connection
    const isVerified = await transporter.verify();
    if (!isVerified) {
      console.error("SMTP connection verification failed");
      return false;
    }

    // Send email using nodemailer
    const info = await transporter.sendMail({
      from: SMTP_SERVER_USERNAME || "shivam.personalprojects@gmail.com",
      to: options.to,
      subject: options.subject,
      text: options.text || "Email content",
      html: options.html,
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
