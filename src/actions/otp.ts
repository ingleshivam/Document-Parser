import prisma from "@/lib/prisma";

// Get project identifier from environment
const PROJECT_ID = process.env.PROJECT_ID || "document-parser";

export async function generateOTP(userId: number): Promise<string> {
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration time (10 minutes from now)
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 10);

  // Delete any existing unused OTPs for this user
  await prisma.userOtp.deleteMany({
    where: {
      userId,
      isUsed: 0,
    },
  });

  // Create new OTP record
  await prisma.userOtp.create({
    data: {
      otp,
      userId,
      isUsed: 0,
      generatedTimestamp: new Date(),
      expirationTimestamp: expirationTime,
    },
  });

  return otp;
}

export async function verifyOTP(userId: number, otp: string): Promise<boolean> {
  const otpRecord = await prisma.userOtp.findFirst({
    where: {
      userId,
      otp,
      isUsed: 0,
      expirationTimestamp: {
        gt: new Date(), // OTP must not be expired
      },
    },
  });

  if (!otpRecord) {
    return false;
  }

  // Mark OTP as used
  await prisma.userOtp.update({
    where: {
      id: otpRecord.id,
    },
    data: {
      isUsed: 1,
    },
  });

  // Mark user as verified
  await prisma.user.update({
    where: {
      userId,
    },
    data: {
      isVerified: 1,
      updatedAt: new Date(),
    },
  });

  return true;
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findFirst({
    where: {
      email,
      project: PROJECT_ID,
    },
  });
}
