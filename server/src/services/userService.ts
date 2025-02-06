// src/services/userService.ts

import { hashPassword } from '../utils/hashUtils';
import { PrismaClient, Role, User } from '@prisma/client';

export interface UserData {
  email?: string;
  name?: string;
  password?: string;
  role?: Role;
  profileImage?: string;
}
const prisma = new PrismaClient();

export const getUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
    
      role: true,
      profileImage: true,
      createdAt: true,
      _count: {
        select: { credits: true }
      }
    }
  });

  const usersWithCredits = await Promise.all(
    users.map(async (user:any) => {
      const totalCredits = await prisma.credit.aggregate({
        where: { userId: user.id },
        _sum: { credits: true }
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
     
      role: true,
      profileImage: true,
      createdAt: true
    }
  });

  if (!user) return null;

  const totalCredits = await prisma.credit.aggregate({
    where: { userId: id },
    _sum: { credits: true }
  });

  return { ...user, totalCredits: totalCredits._sum.credits || 0 };
};

export const updateUser = async (id: string, data: UserData) => {
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
   
      role: true,
      profileImage: true
    }
  });
};

export const deleteUser = async (id: string) => {
  await prisma.credit.deleteMany({ where: { userId: id } });
  return prisma.user.delete({ where: { id } });
};
