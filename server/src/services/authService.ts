//src/services/authService.ts
import { PolicyType, PrismaClient } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/hashUtils";
import { generateToken } from "../utils/jwtUtils";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

export const register = async (
  email: string,
  password: string,
  invitationId?: string
) => {
  // 1. Check if user with this email already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // 2. Hash the password
  const hashedPassword = await hashPassword(password);

  // 3. Load policies
  const parentPolicy = await prisma.policy.findFirst({
    where: { type: PolicyType.PARENT_RELATIONSHIP },
  });
  const firstSignupPolicy = await prisma.policy.findFirst({
    where: { type: PolicyType.FIRST_SIGNUP },
  });
  const simplePolicy = await prisma.policy.findFirst({
    where: { type: PolicyType.SIMPLE_RELATIONSHIP },
  });

  // 4. Handle invitation if provided
  let parentId: string | undefined;
  if (invitationId) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error("Invalid invitation ID");
    }
    if (invitation.inviteeEmail !== email) {
      throw new Error("Invalid invitation or email mismatch");
    }

    // Mark the invitation as used
    await prisma.invitation.update({
      where: { id: invitationId },
      data: { isUsed: true },
    });

    // The user who sent the invitation (inviter) is the parent
    parentId = invitation.inviterId;
  }
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      parentId,
      credits: {
        create: {
          credits: firstSignupPolicy?.credits ?? 0,
        },
      },
    },
  });
  // 5. Create the new user and award credits in one transaction
  return await prisma.$transaction(async (tx) => {
    // Create the new user with FIRST_SIGNUP credits

    // If there's a parent, first give them the PARENT_RELATIONSHIP credits
    if (parentId && parentPolicy) {
      await tx.credit.create({
        data: {
          userId: parentId,
          credits: parentPolicy.credits,
        },
      });

      // Now walk up the chain from the parent's parent onward,
      // giving each ancestor the SIMPLE_RELATIONSHIP credits.
      let currentParentId = (
        await tx.user.findUnique({
          where: { id: parentId },
          select: { parentId: true },
        })
      )?.parentId;

      while (currentParentId) {
        if (simplePolicy) {
          await tx.credit.create({
            data: {
              userId: currentParentId,
              credits: simplePolicy.credits,
            },
          });
        }

        // Move one level up in the parent chain
        currentParentId = (
          await tx.user.findUnique({
            where: { id: currentParentId },
            select: { parentId: true },
          })
        )?.parentId;
      }
    }

    return newUser;
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await comparePassword(password, user.password))) {
    throw new Error("Invalid email or password");
  }
  user.password = undefined as any;
  const totalCredits = await prisma.credit.aggregate({
    where: { userId: user.id },
    _sum: {
      credits: true,
    },
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
  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(newPassword);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });
};

export const forgetPasswordService = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User not found");
  }

  // Configure nodemailer with Gmail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  // Generate a reset token (you can use a library like uuid or crypto)
  const resetToken = Math.random().toString(36).substr(2, 12); // Simple token
  await prisma.user.update({
    where: { email },
    data: { resetToken }, // Save token in DB
  });

  // Send the reset email
  const resetLink = `${process.env.ORIGIN}/reset-password?token=${resetToken}&email=${email}`;
  await transporter.sendMail({
    from: `"Your App" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `<p>Click the link below to reset your password:</p>
           <a href="${resetLink}">${resetLink}</a>`,
  });
};

export const getUser = async (userId: string) => {
  // 1. Find the user (include relationships/details as needed)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      parent: true,
      profileImage: true,
      // if you also want to see each Credit record, uncomment below
      // credits: {
      //   select: {
      //     id: true,
      //     credits: true,
      //     createdAt: true
      //   }
      // }
    },
  });

  // If user doesn't exist, you might want to return null or throw an error
  if (!user) return null;

  // 2. Aggregate the total credits for the user
  const totalCredits = await prisma.credit.aggregate({
    where: { userId },
    _sum: {
      credits: true,
    },
  });

  // 3. Merge user info and total credits in a single response
  return {
    ...user,
    totalCredits: totalCredits._sum.credits ?? 0,
  };
};
export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};
