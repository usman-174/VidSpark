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
  // Pre-check for an existing user outside of the transaction
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash the password before starting the transaction
  const hashedPassword = await hashPassword(password);

  // Wrap the entire registration and credit awarding process in one transaction
  const newUser = await prisma.$transaction(async (tx) => {
    // --- Invitation Handling ---
    let parentId: string | undefined;
    if (invitationId) {
      const invitation = await tx.invitation.findUnique({
        where: { id: invitationId },
      });
      if (!invitation) {
        throw new Error("Invalid invitation ID");
      }
      if (invitation.inviteeEmail !== email) {
        throw new Error("Invalid invitation or email mismatch");
      }
      // Mark the invitation as used
      await tx.invitation.update({
        where: { id: invitationId },
        data: { isUsed: true },
      });
      // Use the inviter as the direct parent
      parentId = invitation.inviterId;
    }

    // --- Load Policies Concurrently ---
    const [parentPolicy, firstSignupPolicy, simplePolicy] = await Promise.all([
      tx.policy.findFirst({ where: { type: PolicyType.PARENT_RELATIONSHIP } }),
      tx.policy.findFirst({ where: { type: PolicyType.FIRST_SIGNUP } }),
      tx.policy.findFirst({ where: { type: PolicyType.SIMPLE_RELATIONSHIP } }),
    ]);

    // --- Create the New User with Signup Bonus ---
    // The user's initial creditBalance is set to the signup bonus (or 0)
    const createdUser = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        parentId,
        creditBalance: firstSignupPolicy?.credits ?? 0,
        credits: {
          create: {
            credits: firstSignupPolicy?.credits ?? 0,
          },
        },
      },
    });

    // Array to hold credit operations (both credit record creation and balance updates)
    const creditOperations: Promise<any>[] = [];

    // --- Award Credits to Direct Parent (if exists) ---
    if (parentId && parentPolicy) {
      // 1. Create a credit record for the parent
      creditOperations.push(
        tx.credit.create({
          data: {
            userId: parentId,
            credits: parentPolicy.credits,
          },
        })
      );
      // 2. Increment the parent's creditBalance
      creditOperations.push(
        tx.user.update({
          where: { id: parentId },
          data: {
            creditBalance: {
              increment: parentPolicy.credits,
            },
          },
        })
      );

      // --- Award SIMPLE_RELATIONSHIP Credits to Ancestors ---
      // Walk up the ancestry chain from the direct parent
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
        // 1. Create credit records for all ancestors in batch
        creditOperations.push(
          tx.credit.createMany({
            data: ancestors.map((ancestorId) => ({
              userId: ancestorId,
              credits: simplePolicy.credits,
            })),
          })
        );
        // 2. Increment the creditBalance for all these ancestors
        creditOperations.push(
          tx.user.updateMany({
            where: { id: { in: ancestors } },
            data: {
              creditBalance: {
                increment: simplePolicy.credits,
              },
            },
          })
        );
      }
    }

    // Execute all credit operations concurrently
    if (creditOperations.length > 0) {
      await Promise.all(creditOperations);
    }

    return createdUser;
  });

  return newUser;
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


export const getInvitationsByUserId = async (userId: string) => {

  return prisma.invitation.findMany({
    where: { inviterId: userId },
  });
}