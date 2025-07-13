import { Gender, PolicyType, PrismaClient, User } from "@prisma/client";
import { comparePassword, hashPassword } from "../utils/hashUtils";
import { generateToken } from "../utils/jwtUtils";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Types
interface RegisterData {
  email: string;
  password: string;
  name: string;
  gender: Gender;
  invitationId?: string;
}

interface AuthResponse {
  user: User & { totalCredits: number };
  token: string;
}

interface ServiceResponse {
  success: boolean;
  message: string;
}

// Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Email Templates
class EmailTemplates {
  private static readonly BASE_STYLES = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #2d3748;
    }
    .message {
      font-size: 16px;
      margin-bottom: 30px;
      color: #4a5568;
      line-height: 1.7;
    }
    .verification-code-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border: 2px dashed #cbd5e0;
      border-radius: 12px;
      padding: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .verification-code {
      font-size: 36px;
      font-weight: 700;
      color: #4f46e5;
      font-family: 'Courier New', monospace;
      letter-spacing: 8px;
      text-shadow: 0 2px 4px rgba(79, 70, 229, 0.1);
      margin: 10px 0;
      user-select: all;
    }
    .code-label {
      font-size: 14px;
      color: #718096;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 1px;
    }
    .code-instructions {
      font-size: 14px;
      color: #718096;
      margin-top: 15px;
      font-style: italic;
    }
    .cta-button {
      display: inline-block;
      background: #65d8c1;
      color: black;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .security-notice {
      background-color: #fef7e6;
      border-left: 4px solid #f59e0b;
      padding: 20px;
      margin: 25px 0;
      border-radius: 0 8px 8px 0;
      text-align: left;
    }
    .security-notice h3 {
      margin: 0 0 10px 0;
      color: #92400e;
      font-size: 16px;
      font-weight: 600;
    }
    .security-notice p {
      margin: 0;
      font-size: 14px;
      color: #a16207;
      line-height: 1.5;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      margin: 0;
      font-size: 14px;
      color: #718096;
    }
    .footer a {
      color: #4f46e5;
      text-decoration: none;
    }
    .expiry-notice {
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .expiry-notice p {
      margin: 0;
      font-size: 14px;
      color: #991b1b;
      font-weight: 500;
    }
    @media (max-width: 600px) {
      .container { margin: 0; box-shadow: none; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 30px 20px; }
      .verification-code { font-size: 28px; letter-spacing: 4px; }
      .verification-code-container { padding: 20px; }
      .cta-button { display: block; width: 100%; box-sizing: border-box; }
    }
  `;

  static generateVerificationEmail(code: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>${this.BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Email Verification</h1>
            <p>Secure your account with verification</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hello! 👋</div>
            
            <div class="message">
              To complete your account setup and ensure the security of your account, 
              please use the verification code below:
            </div>

            <div class="verification-code-container">
              <div class="code-label">Your Verification Code</div>
              <div class="verification-code">${code}</div>
              <div class="code-instructions">Select and copy the code above</div>
            </div>

            <div class="expiry-notice">
              <p>⏰ This code will expire in 10 minutes for security reasons</p>
            </div>

            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p>
                Never share this code with anyone. Our team will never ask for your verification code 
                via phone, email, or any other method. If you didn't request this code, please ignore this email.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>This verification email was sent automatically by your app.</p>
            <p style="margin-top: 15px;">
              Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}">support@yourapp.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generatePasswordResetEmail(
    resetLink: string,
    userEmail: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
        <style>${this.BASE_STYLES}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔑 Password Reset</h1>
            <p>Reset your account password securely</p>
          </div>
          
          <div class="content">
            <div class="greeting">Hello! 👋</div>
            
            <div class="message">
              We received a request to reset the password for your account (${userEmail}). 
              If you made this request, click the button below to reset your password:
            </div>

            <a href="${resetLink}" class="cta-button">Reset My Password</a>

            <div class="expiry-notice">
              <p>⏰ This link will expire in 1 hour for security reasons</p>
            </div>

            <div class="security-notice">
              <h3>🛡️ Security Notice</h3>
              <p>
                If you didn't request this password reset, please ignore this email. 
                Your password will remain unchanged. For security, this link will only work once.
              </p>
            </div>

            <div style="margin-top: 30px; padding: 15px; background-color: #f7fafc; border-radius: 6px; font-size: 14px; color: #4a5568;">
              <strong>Having trouble with the button?</strong><br>
              Copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
            </div>
          </div>
          
          <div class="footer">
            <p>This password reset email was sent automatically by your app.</p>
            <p style="margin-top: 15px;">
              Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}">support@yourapp.com</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static generatePlainTextVerification(code: string): string {
    return `
Email Verification

Hello!

To complete your account setup, please use this verification code: ${code}

This code will expire in 10 minutes for security reasons.

SECURITY NOTICE: Never share this code with anyone. If you didn't request this code, please ignore this email.

Questions? Contact us at ${process.env.GMAIL_USER}
    `.trim();
  }

  static generatePlainTextPasswordReset(
    resetLink: string,
    userEmail: string
  ): string {
    return `
Password Reset Request

Hello!

We received a request to reset the password for your account (${userEmail}).

Reset your password by clicking this link: ${resetLink}

This link will expire in 1 hour for security reasons.

SECURITY NOTICE: If you didn't request this password reset, please ignore this email.

Questions? Contact us at ${process.env.GMAIL_USER}
    `.trim();
  }
}

// Email Service
class EmailService {
  private static async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string
  ): Promise<void> {
    try {
      await transporter.sendMail({
        from: `"VidSpark" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
        text,
      });
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw new Error("Failed to send email");
    }
  }

  static async sendVerificationEmail(
    email: string,
    code: string
  ): Promise<void> {
    const subject = "🔐 Your Email Verification Code";
    const html = EmailTemplates.generateVerificationEmail(code);
    const text = EmailTemplates.generatePlainTextVerification(code);

    await this.sendEmail(email, subject, html, text);
  }

  static async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    const subject = "🔑 Password Reset Request";
    const html = EmailTemplates.generatePasswordResetEmail(resetLink, email);
    const text = EmailTemplates.generatePlainTextPasswordReset(
      resetLink,
      email
    );

    await this.sendEmail(email, subject, html, text);
  }
}

// Utility Functions
class UserUtils {
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static generateResetToken(): string {
    return Math.random().toString(36).substr(2, 12);
  }

  static async validateInvitation(invitationId: string, email: string) {
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new Error("Invalid invitation");
    }

    if (invitation.inviteeEmail !== email) {
      throw new Error("Email does not match invitation");
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error("Invitation has expired");
    }

    if (invitation.isUsed) {
      throw new Error("Invitation has already been used");
    }

    return invitation;
  }

  static async calculateTotalCredits(userId: string): Promise<number> {
    const result = await prisma.credit.aggregate({
      where: { userId },
      _sum: { credits: true },
    });
    return result._sum.credits ?? 0;
  }
}

// Credit Management
class CreditManager {
  static async distributeCreditsByPolicy(
    userId: string,
    parentId: string | null,
    transaction: any
  ): Promise<void> {
    if (!parentId) return;

    const [parentPolicy, simplePolicy] = await Promise.all([
      transaction.policy.findFirst({
        where: { type: PolicyType.PARENT_RELATIONSHIP },
      }),
      transaction.policy.findFirst({
        where: { type: PolicyType.SIMPLE_RELATIONSHIP },
      }),
    ]);

    const creditOperations: Promise<any>[] = [];

    // Give credits to direct parent
    if (parentPolicy?.credits) {
      creditOperations.push(
        transaction.credit.create({
          data: { userId: parentId, credits: parentPolicy.credits },
        }),
        transaction.user.update({
          where: { id: parentId },
          data: { creditBalance: { increment: parentPolicy.credits } },
        })
      );
    }

    // Give credits to ancestors
    if (simplePolicy?.credits) {
      const ancestors = await this.getAncestors(parentId, transaction);
      if (ancestors.length > 0) {
        creditOperations.push(
          transaction.credit.createMany({
            data: ancestors.map((ancestorId) => ({
              userId: ancestorId,
              credits: simplePolicy.credits,
            })),
          }),
          transaction.user.updateMany({
            where: { id: { in: ancestors } },
            data: { creditBalance: { increment: simplePolicy.credits } },
          })
        );
      }
    }

    if (creditOperations.length > 0) {
      await Promise.all(creditOperations);
    }
  }

  private static async getAncestors(
    userId: string,
    transaction: any
  ): Promise<string[]> {
    const ancestors: string[] = [];
    let currentUserId = userId;

    while (currentUserId) {
      const user = await transaction.user.findUnique({
        where: { id: currentUserId },
        select: { parentId: true },
      });

      if (user?.parentId) {
        ancestors.push(user.parentId);
        currentUserId = user.parentId;
      } else {
        break;
      }
    }

    return ancestors;
  }
}

// Main Service Functions
export const register = async (data: RegisterData): Promise<User> => {
  const { email, password, name, gender, invitationId } = data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);
  const emailVerificationCode = UserUtils.generateVerificationCode();

  const newUser = await prisma.$transaction(async (tx) => {
    let parentId: string | undefined;

    // Handle invitation if provided
    if (invitationId) {
      const invitation = await UserUtils.validateInvitation(
        invitationId,
        email
      );

      await tx.invitation.update({
        where: { id: invitationId },
        data: { isUsed: true },
      });

      parentId = invitation.inviterId;
    }

    // Get first signup policy
    const firstSignupPolicy = await tx.policy.findFirst({
      where: { type: PolicyType.FIRST_SIGNUP },
    });

    // Create user
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

    // Distribute credits based on referral policies
    await CreditManager.distributeCreditsByPolicy(createdUser.id, parentId, tx);

    return createdUser;
  });

  // Send verification email
  await EmailService.sendVerificationEmail(email, emailVerificationCode);

  return newUser;
};

export const verifyEmailService = async (
  email: string,
  code: string
): Promise<ServiceResponse> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.isVerified) {
      return { success: true, message: "Email already verified" };
    }

    if (user.emailVerificationCode !== code) {
      return { success: false, message: "Invalid verification code" };
    }

    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        emailVerificationCode: null,
      },
    });

    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    console.error("Email verification error:", error);
    return { success: false, message: "Verification failed" };
  }
};

export const resendVerificationService = async (
  email: string
): Promise<ServiceResponse> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.isVerified) {
      return { success: false, message: "Email already verified" };
    }

    const newVerificationCode = UserUtils.generateVerificationCode();

    await prisma.user.update({
      where: { email },
      data: { emailVerificationCode: newVerificationCode },
    });

    await EmailService.sendVerificationEmail(email, newVerificationCode);

    return { success: true, message: "Verification email resent successfully" };
  } catch (error) {
    console.error("Resend verification error:", error);
    return { success: false, message: "Failed to resend verification email" };
  }
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified && user.role !== "ADMIN") {
    throw new Error("Email not verified. Please check your inbox.");
  }

  const totalCredits = await UserUtils.calculateTotalCredits(user.id);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: { ...userWithoutPassword, totalCredits } as User & {
      totalCredits: number;
    },
    token: generateToken(user.id, user.role),
  };
};

export const forgetPasswordService = async (
  email: string
): Promise<ServiceResponse> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: "If the email exists, a reset link has been sent",
      };
    }

    const resetToken = UserUtils.generateResetToken();

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
      },
    });

    const resetLink = `${
      process.env.ORIGIN
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    await EmailService.sendPasswordResetEmail(email, resetLink);

    return { success: true, message: "Password reset link sent successfully" };
  } catch (error) {
    console.error("Forget password error:", error);
    return { success: false, message: "Failed to send reset link" };
  }
};

export const resetPasswordService = async (
  email: string,
  token: string,
  newPassword: string
): Promise<ServiceResponse> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.resetToken !== token) {
      return { success: false, message: "Invalid or expired reset token" };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Reset password error:", error);
    return { success: false, message: "Failed to reset password" };
  }
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
      isVerified: true,
    },
  });

  if (!user) return null;

  const totalCredits = await UserUtils.calculateTotalCredits(userId);

  return {
    ...user,
    totalCredits,
  };
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const getInvitationsByUserId = async (userId: string) => {
  return prisma.invitation.findMany({
    where: { inviterId: userId },
    include: {
      inviter: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
