import { PrismaClient } from "@prisma/client";
import { uploadToCloudinary } from "../utils/cloudinary";

const prisma = new PrismaClient();

export const uploadImageAndSave = async (userId: string, fileBuffer: Buffer): Promise<string> => {
  try {
    // Upload image to Cloudinary
    const imageUrl = await uploadToCloudinary(fileBuffer);
    if (!imageUrl) throw new Error("Failed to upload image");

    // Update user profile in the database
    await prisma.user.update({
      where: { id: userId },
      data: { profileImage: imageUrl },
    });

    return imageUrl;
  } catch (error) {
    console.error("Error in uploadImageAndSave:", error);
    throw error;
  }
};
