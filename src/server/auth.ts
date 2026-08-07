import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaRaw } from './prismaClient';

const SALT_ROUNDS = 10;
export const SESSION_DURATION = '7d';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId?: string;
  sub?: string;
  email?: string;
  isSuperAdmin?: boolean;
  isImpersonating?: boolean;
  tenantId?: string;
  role?: string;
}


export const hashPassword = async (password: string) => bcrypt.hash(password, SALT_ROUNDS);
export const verifyPassword = async (password: string, hashedPassword: string) => bcrypt.compare(password, hashedPassword);

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === 'replace-with-a-long-random-string') {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      throw new Error('JWT_SECRET is missing or placeholder in production environment.');
    }
    return 'dev-secret';
  }
  return secret;
};

export const createAuthToken = (payload: TokenPayload, expiresIn: string = SESSION_DURATION) => {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyAuthToken = (token: string): TokenPayload => {
  const secret = getJwtSecret();
  return jwt.verify(token, secret) as TokenPayload;
};


export const findUserByEmail = async (email: string) => {
  return prismaRaw.user.findUnique({
    where: { email },
    include: {
      tenantUsers: {
        include: {
          tenant: {
            include: { plan: true },
          },
        },
      },
    },
  });
};

export const findAdminUserByEmail = async (email: string) => {
  return prismaRaw.adminUser.findUnique({ where: { email } });
};
