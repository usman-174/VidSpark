import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

/**
 * Sends an email using Nodemailer with HTML support.
 * @param to Recipient's email address
 * @param subject Subject of the email
 * @param html HTML body of the email
 * @param text Plain text fallback body of the email
 * @returns Promise that resolves when the email is sent
 */
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Gmail SMTP host
    port: 587, // TLS Port
    secure: false, // false for port 587
    auth: {
      user: process.env.GMAIL_USER, // Using the email from environment variables
      pass: process.env.GMAIL_PASS, // Using the password from environment variables
    },
  });

  const mailOptions = {
    from: `"VidSpark" <${process.env.GMAIL_USER}>`, // Sender address
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags as fallback
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Generates a professional HTML email template for invitations
 * @param inviteLink The registration link
 * @param inviterName Optional name of the person sending the invitation
 * @returns HTML string for the email
 */
const generateInvitationEmailHTML = (
  inviteLink: string,
  inviterName?: string
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VidSpark Invitation</title>
        <style>
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                padding: 16px 32px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                transition: transform 0.2s ease;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }
            .cta-container {
                text-align: center;
                margin: 30px 0;
            }
            .divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                margin: 30px 0;
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
                color: #667eea;
                text-decoration: none;
            }
            .link-fallback {
                margin-top: 20px;
                padding: 15px;
                background-color: #f7fafc;
                border-radius: 6px;
                font-size: 14px;
                color: #4a5568;
                word-break: break-all;
            }
            .features {
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                text-align: center;
            }
            .feature {
                flex: 1;
                padding: 0 10px;
            }
            .feature-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            .feature-text {
                font-size: 14px;
                color: #718096;
            }
            @media (max-width: 600px) {
                .container {
                    margin: 0;
                    box-shadow: none;
                }
                .header {
                    padding: 30px 20px;
                }
                .header h1 {
                    font-size: 24px;
                }
                .content {
                    padding: 30px 20px;
                }
                .features {
                    flex-direction: column;
                    gap: 20px;
                }
                .cta-button {
                    display: block;
                    width: 100%;
                    box-sizing: border-box;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎬 VidSpark</h1>
                <p>You're invited to join our community!</p>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Hello there! 👋
                </div>
                
                <div class="message">
                    ${inviterName ? `<strong>${inviterName}</strong> has invited you to join` : 'You have been invited to join'} <strong>VidSpark</strong>! 
                    We're excited to have you become part of our growing community.
                </div>

                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">🚀</div>
                        <div class="feature-text">Get Started Quickly</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🎯</div>
                        <div class="feature-text">Powerful Features</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">🤝</div>
                        <div class="feature-text">Amazing Community</div>
                    </div>
                </div>

                <div class="divider"></div>
                
                <div class="cta-container">
                    <a href="${inviteLink}" class="cta-button">
                        Accept Invitation & Register
                    </a>
                </div>
                
                <div class="link-fallback">
                    <strong>Having trouble with the button?</strong><br>
                    Copy and paste this link into your browser:<br>
                    <a href="${inviteLink}" style="color: #667eea;">${inviteLink}</a>
                </div>
            </div>
            
            <div class="footer">
                <p>
                    This invitation was sent by VidSpark.<br>
                    If you didn't expect this invitation, you can safely ignore this email.
                </p>
                <p style="margin-top: 15px;">
                    Questions? Contact us at <a href="mailto:${process.env.GMAIL_USER}">support@vidspark.com</a>
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Generates plain text version of the invitation email
 * @param inviteLink The registration link
 * @param inviterName Optional name of the person sending the invitation
 * @returns Plain text string for the email
 */
const generateInvitationEmailText = (
  inviteLink: string,
  inviterName?: string
): string => {
  return `
VidSpark Invitation

Hello there!

${inviterName ? `${inviterName} has invited you to join` : 'You have been invited to join'} VidSpark! We're excited to have you become part of our growing community.

To accept your invitation and register, please click the following link:
${inviteLink}

If you're having trouble with the link, copy and paste it into your browser's address bar.

This invitation was sent by VidSpark. If you didn't expect this invitation, you can safely ignore this email.

Questions? Contact us at ${process.env.GMAIL_USER}

Best regards,
The VidSpark Team
  `.trim();
};

/**
 * Create an invitation, save it to the database, and send an email.
 * @param inviterId ID of the user sending the invitation
 * @param inviteeEmail Email of the invitee
 * @param inviterName Optional name of the person sending the invitation
 * @returns The created invitation
 */
export const createInvitation = async (
  inviterId: string,
  inviteeEmail: string,
  inviterName?: string
) => {
  try {
    // Save the invitation to the database
    const invitation = await prisma.invitation.create({
      data: {
        inviterId,
        inviteeEmail,
      },
    });

    const inviteLink = `${process.env.ORIGIN}/register?invitationId=${invitation.id}`;
    console.log("Invite Link: ", inviteLink);

    // Generate email content
    const emailSubject = `🎬 You're invited to join VidSpark!`;
    const emailHTML = generateInvitationEmailHTML(inviteLink, inviterName);
    const emailText = generateInvitationEmailText(inviteLink, inviterName);

    // Send the invitation email
    await sendEmail(inviteeEmail, emailSubject, emailHTML, emailText);

    // Update the invitation with the email sent status
    await prisma.invitation.update({
      where: {
        id: invitation.id,
      },
      data: {
        inviteLink,
      },
    });

    return invitation;
  } catch (error) {
    console.error("Error creating invitation:", error);
    throw error;
  }
};

export const getInvitationUsingId = async (invitationId: string) => {
  return prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
  });
};