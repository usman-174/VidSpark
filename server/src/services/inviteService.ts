import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const prisma = new PrismaClient();

/**
 * Sends an email using Nodemailer.
 * @param to Recipient's email address
 * @param subject Subject of the email
 * @param text Plain text body of the email
 * @returns Promise that resolves when the email is sent
 */
const sendEmail = async (to: string, subject: string, text: string) => {
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
    text,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Create an invitation, save it to the database, and send an email.
 * @param inviterId ID of the user sending the invitation
 * @param inviteeEmail Email of the invitee
 * @returns The created invitation
 */
export const createInvitation = async (
  inviterId: string,
  inviteeEmail: string
) => {
  // Save the invitation to the database
  const invitation = await prisma.invitation.create({
    data: {
      inviterId,
      inviteeEmail,
    },
  });

  const inviteLink = `${process.env.ORIGIN}/register?invitationId=${invitation.id}`;
  console.log("Invite Link: ", inviteLink);

  // Send the invitation email
  const emailSubject = "You're Invited!";
  const emailBody = `Hi there, \n\nYou have been invited! Use the following link to register: ${inviteLink} \n\nBest regards, \n VidSpark`;

  await sendEmail(inviteeEmail, emailSubject, emailBody);
  //   update the invitation with the email sent status
  await prisma.invitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      inviteLink,
    },
  });
  return invitation;
};

export const getInvitationUsingId = async (invitationId: string) => {
  return prisma.invitation.findUnique({
    where: {
      id: invitationId,
    },
  });
};
