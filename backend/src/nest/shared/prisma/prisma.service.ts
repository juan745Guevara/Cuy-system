import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { resolveDatabaseUrl } = require('../../../shared/database/prisma');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = resolveDatabaseUrl();
    }
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
