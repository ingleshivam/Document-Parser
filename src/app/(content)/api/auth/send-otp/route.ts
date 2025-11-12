import { NextRequest, NextResponse } from "next/server";
import { generateOTP, getUserByEmail } from "@/actions/otp";
import { sendEmail } from "@/lib/email";
import {
  generateOTPEmailHTML,
  generateOTPEmailText,
} from "@/lib/email-templates";
import { z } from "zod";

const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendOtpSchema.parse(body);

    // Find user by email
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "User is already verified" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = await generateOTP(user.userId);

    // Send email with OTP
    const emailSent = await sendEmail({
      to: email,
      subject: "Email Verification - Document Parser",
      html: generateOTPEmailHTML(otp, user.firstName || undefined),
      text: generateOTPEmailText(otp, user.firstName || undefined),
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "OTP sent successfully",
        // Remove this in production - only for development
        otp: process.env.NODE_ENV === "development" ? otp : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
