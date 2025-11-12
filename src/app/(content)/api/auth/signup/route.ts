import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { generateOTP } from "@/actions/otp";
import { sendEmail } from "@/lib/email";
import {
  generateOTPEmailHTML,
  generateOTPEmailText,
} from "@/lib/email-templates";

// Get project identifier from environment
const PROJECT_ID = process.env.PROJECT_ID || "document-parser";

const signupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Bpdy : ", body);
    const { firstName, lastName, email, password } = signupSchema.parse(body);

    // Check if user already exists in this project
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        project: PROJECT_ID,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists in this project" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash: hashedPassword,
        project: PROJECT_ID,
        role: "U",
        isVerified: 0, // User needs to verify email
        updatedAt: new Date(),
      },
    });

    // Generate and send OTP immediately after user creation
    try {
      const otp = await generateOTP(user.userId);

      // Send email with OTP
      const emailSent = await sendEmail({
        to: email,
        subject: "Email Verification - Document Parser",
        html: generateOTPEmailHTML(otp, firstName),
        text: generateOTPEmailText(otp, firstName),
      });

      if (!emailSent) {
        console.error(
          "Failed to send verification email for user:",
          user.userId
        );
        // Don't fail the signup, but log the error
      }
    } catch (error) {
      console.error("Error generating/sending OTP during signup:", error);
      // Don't fail the signup, but log the error
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: user.userId,
        // Include OTP in development for testing
        otp:
          process.env.NODE_ENV === "development"
            ? await generateOTP(user.userId)
            : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error : ", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
