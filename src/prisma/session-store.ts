import { PrismaClient } from '@prisma/client';
import { Store } from 'express-session';

export class PrismaSessionStore extends Store {
  private prisma: PrismaClient;
  private ttl: number;

  constructor(prisma: PrismaClient, ttl: number = 7 * 24 * 60 * 60) {
    super();
    this.prisma = prisma;
    this.ttl = ttl;
  }

  async get(sid: string, callback: (err?: any, session?: any) => void) {
    try {
      const record = await this.prisma.session.findUnique({
        where: { sid },
      });

      if (!record) {
        return callback(null, null);
      }

      if (record.expiresAt < new Date()) {
        await this.prisma.session.delete({ where: { sid } });
        return callback(null, null);
      }

      const session = JSON.parse(record.data);
      callback(null, session);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const expiresAt = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + this.ttl * 1000);

      await this.prisma.session.upsert({
        where: { sid },
        create: {
          id: sid,
          sid,
          data: JSON.stringify(session),
          expiresAt,
        },
        update: {
          data: JSON.stringify(session),
          expiresAt,
        },
      });

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.prisma.session.deleteMany({ where: { sid } });
      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }

  async touch(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const expiresAt = session.cookie?.expires
        ? new Date(session.cookie.expires)
        : new Date(Date.now() + this.ttl * 1000);

      await this.prisma.session.update({
        where: { sid },
        data: { expiresAt },
      });

      callback?.();
    } catch (err) {
      callback?.(err);
    }
  }
}
