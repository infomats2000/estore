import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

const SALT_ROUNDS = 10; // bcryptjs is slightly slower, 10 rounds is standard and fast

export const hashPassword = async (password: string) => bcrypt.hash(password, SALT_ROUNDS);
export const verifyPassword = async (password: string, hashedPassword: string) => bcrypt.compare(password, hashedPassword);

export const createAuthToken = (payload: object) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.sign(payload, secret, { expiresIn: '8h' });
};

export const verifyAuthToken = (token: string) => {
  const secret = process.env.JWT_SECRET || 'dev-secret';
  return jwt.verify(token, secret) as { sub: string; role: string };
};

export const findAdminUserByEmail = async (email: string) => prisma.adminUser.findUnique({ where: { email } });
