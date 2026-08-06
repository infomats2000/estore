import { db, prismaRaw } from './prismaClient';

export const prisma = db;
export { prismaRaw };
export default db;
