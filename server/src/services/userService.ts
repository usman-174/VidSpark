import { hashPassword } from "../utils/hashUtils";
import { PrismaClient, Role } from "@prisma/client";

export interface UserData {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  profileImage?: string;
  gender?: string; // used for registration only
}

// Define a separate type for updates that omits gender
export type UserUpdateData = Partial<Omit<UserData, "gender">>;

const prisma = new PrismaClient();

export const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      gender: true, // still returned when fetching users
      role: true,
      profileImage: true,
      createdAt: true,
      name: true,
      creditBalance: true,
      _count: {
        select: { credits: true },
      },
    },
  });

  const usersWithCredits = await Promise.all(
    users.map(async (user: any) => {
      const totalCredits = await prisma.credit.aggregate({
        where: { userId: user.id },
        _sum: { credits: true },
      });
      return { ...user, totalCredits: totalCredits._sum.credits || 0 };
    })
  );

  return usersWithCredits;
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      gender: true, // still returned when fetching a user by id
      role: true,
      profileImage: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  const totalCredits = await prisma.credit.aggregate({
    where: { userId: id },
    _sum: { credits: true },
  });

  return { ...user, totalCredits: totalCredits._sum.credits || 0 };
};

export const updateUser = async (id: string, data: UserUpdateData) => {
  const updateData: any = { ...data };

  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      gender: true, // returned for reference
      role: true,
      profileImage: true,
    },
  });
};

export const deleteUser = async (id: string) => {
  await prisma.credit.deleteMany({ where: { userId: id } });
  return prisma.user.delete({ where: { id } });
};

export const deductCredits = async (userId: string, credits: number) => {
  await prisma.credit.create({
    data: {
      userId,
      credits: -credits,
    },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      creditBalance: {
        decrement: credits,
      },
    },
  });

  return true;
};
