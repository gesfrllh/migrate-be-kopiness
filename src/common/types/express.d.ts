import type { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    interface User extends Pick<PrismaUser, 'id' | 'email' | 'role'> { }
  }
}

export { };
