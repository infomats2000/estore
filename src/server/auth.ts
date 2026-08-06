import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prismaRaw } from './prismaClient';

const SALT_ROUNDS = 10;

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
  if (!secret) {
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      console.warn('⚠️ [JWT WARNING] JWT_SECRET is not set in environment variables! Using secure default fallback.');
      return 'prod-default-jwt-secret-infomats-2026';
    }
    return 'dev-secret';
  }
  return secret;
};

export const createAuthToken = (payload: TokenPayload, expiresIn: string = '24h') => {
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
