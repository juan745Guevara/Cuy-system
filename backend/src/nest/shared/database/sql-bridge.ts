import { PrismaClient } from '@prisma/client';

type QueryClient = Pick<PrismaClient, '$queryRawUnsafe'>;

function isControlStatement(sql: string): boolean {
  const cmd = sql.trim().toUpperCase();
  return cmd === 'BEGIN' || cmd === 'COMMIT' || cmd.startsWith('ROLLBACK');
}

/** Raw SQL row shape from $queryRawUnsafe (legacy repositories use dynamic columns). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SqlRow = any;

function toRows(result: unknown): { rows: SqlRow[] } {
  return { rows: Array.isArray(result) ? result : [] };
}

function createQueryFn(client: QueryClient) {
  return async (sql: string, params: unknown[] = []) => {
    if (isControlStatement(sql)) return { rows: [] };
    return toRows(await client.$queryRawUnsafe(sql, ...params));
  };
}

export type SqlBridge = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: SqlRow[] }>;
  connect: () => Promise<{
    query: (sql: string, params?: unknown[]) => Promise<{ rows: SqlRow[] }>;
    release: () => void;
  }>;
};

/** pg-compatible adapter backed by Prisma. */
export function createSqlBridge(prisma: PrismaClient): SqlBridge {
  return {
    query: createQueryFn(prisma),

    connect() {
      return new Promise((resolve, reject) => {
        prisma
          .$transaction(async (tx) => {
            let finished = false;
            let rollbackRequested = false;

            const client = {
              query: async (sql: string, params: unknown[] = []) => {
                const cmd = sql.trim().toUpperCase();
                if (cmd === 'BEGIN') return { rows: [] };
                if (cmd === 'COMMIT') {
                  finished = true;
                  return { rows: [] };
                }
                if (cmd.startsWith('ROLLBACK')) {
                  rollbackRequested = true;
                  finished = true;
                  throw Object.assign(new Error('ROLLBACK'), { pgRollback: true });
                }
                return toRows(await tx.$queryRawUnsafe(sql, ...params));
              },
              release() {
                if (!finished) finished = true;
              },
            };

            resolve(client);

            while (!finished) {
              await new Promise((r) => setTimeout(r, 0));
            }

            if (rollbackRequested) {
              throw new Error('ROLLBACK');
            }
          })
          .catch((err: Error & { pgRollback?: boolean }) => {
            if (err.message !== 'ROLLBACK' && !err.pgRollback) {
              reject(err);
            }
          });
      });
    },
  };
}
