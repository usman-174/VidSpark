import { Gender, PolicyType, PrismaClient } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/hashUtils";
import { generateToken } from "../utils/jwtUtils";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Send verification email
async function sendVerificationEmail(email: string, code: string) {
  await transporter.sendMail({
    from: `"Your App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Email Verification Code",
    html: `<p>Your verification code is:</p>
           <h2>${code}</h2>`,
  });
}

export const register = async (
  email: string,
  password: string,
  name: string,
  gender: Gender,
  invitationId?: string
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await hashPassword(password);

  const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code

  const newUser = await prisma.$transaction(async (tx) => {
    let parentId: string | undefined;

    if (invitationId) {
      const invitation = await tx.invitation.findUnique({ where: { id: invitationId } });
      if (!invitation || invitation.inviteeEmail !== email) {
        throw new Error("Invalid invitation or email mismatch");
      }
      if (invitation.expiresAt < new Date()) {
        throw new Error("Invitation is expired");
      }

      await tx.invitation.update({
        where: { id: invitationId },
        data: { isUsed: true },
      });

      parentId = invitation.inviterId;
    }

    const [parentPolicy, firstSignupPolicy, simplePolicy] = await Promise.all([
      tx.policy.findFirst({ where: { type: PolicyType.PARENT_RELATIONSHIP } }),
      tx.policy.findFirst({ where: { type: PolicyType.FIRST_SIGNUP } }),
      tx.policy.findFirst({ where: { type: PolicyType.SIMPLE_RELATIONSHIP } }),
    ]);

    const createdUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        gender,
        parentId,
        isVerified: false,
        emailVerificationCode,
        creditBalance: firstSignupPolicy?.credits ?? 0,
        credits: {
          create: {
            credits: firstSignupPolicy?.credits ?? 0,
          },
        },
      },
    });

    const creditOperations: Promise<any>[] = [];

    if (parentId && parentPolicy) {
      creditOperations.push(
        tx.credit.create({ data: { userId: parentId, credits: parentPolicy.credits } }),
        tx.user.update({
          where: { id: parentId },
          data: { creditBalance: { increment: parentPolicy.credits } },
        })
      );

      let currentParent = await tx.user.findUnique({
        where: { id: parentId },
        select: { parentId: true },
      });

      const ancestors: string[] = [];
      while (currentParent?.parentId) {
        ancestors.push(currentParent.parentId);
        currentParent = await tx.user.findUnique({
          where: { id: currentParent.parentId },
          select: { parentId: true },
        });
      }

      if (simplePolicy && ancestors.length > 0) {
        creditOperations.push(
          tx.credit.createMany({
            data: ancestors.map((ancestorId) => ({
              userId: ancestorId,
              credits: simplePolicy.credits,
            })),
          }),
          tx.user.updateMany({
            where: { id: { in: ancestors } },
            data: { creditBalance: { increment: simplePolicy.credits } },
          })
        );
      }
    }

    if (creditOperations.length > 0) await Promise.all(creditOperations);

    return createdUser;
  });

  await sendVerificationEmail(email, emailVerificationCode);

  return newUser;
};

export const verifyEmailService = async (
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false, message: "User not found" };
  if (user.isVerified) return { success: true, message: "Email already verified" };
  if (user.emailVerificationCode !== code) return { success: false, message: "Invalid verification code" };

  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      emailVerificationCode: null,
    },
  });

  return { success: true, message: "Email verified successfully" };
};

export const resendVerificationService = async (
  email: string
): Promise<{ success: boolean; message: string }> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: false, message: "User not found" };
  if (user.isVerified) return { success: false, message: "Email already verified" };

  const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  
  await prisma.user.update({
    where: { email },
    data: { emailVerificationCode: newVerificationCode },
  });

  await sendVerificationEmail(email, newVerificationCode);
  
  return { success: true, message: "Verification email resent successfully" };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await comparePassword(password, user.password))) {
    throw new Error("Invalid email or password");
  }
  if (!user.isVerified && user.role !== "ADMIN") {
    throw new Error("Email not verified. Please check your inbox.");
  }

  user.password = undefined as any;

  const totalCredits = await prisma.credit.aggregate({
    where: { userId: user.id },
    _sum: { credits: true },
  });

  return {
    user: { ...user, totalCredits: totalCredits._sum.credits ?? 0 },
    token: generateToken(user.id, user.role),
  };
};

export const resetPasswordService = async (
  email: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
};

export const forgetPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const resetToken = Math.random().toString(36).substr(2, 12);
  await prisma.user.update({
    where: { email },
    data: { resetToken },
  });

  const resetLink = `${process.env.ORIGIN}/reset-password?token=${resetToken}&email=${email}`;
  await transporter.sendMail({
    from: `"Your App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `<p>Click the link below to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
  });
};

export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      parent: true,
      profileImage: true,
      name: true,
      gender: true,
      creditBalance: true,
    },
  });

  if (!user) return null;

  const totalCredits = await prisma.credit.aggregate({
    where: { userId },
    _sum: { credits: true },
  });

  return {
    ...user,
    totalCredits: totalCredits._sum.credits ?? 0,
  };
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const getInvitationsByUserId = async (userId: string) => {
  return prisma.invitation.findMany({ where: { inviterId: userId } });
};