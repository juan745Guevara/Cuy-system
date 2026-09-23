/**
 * Bridges legacy pg-style `db.query` / `db.connect` to Prisma.
 * Complex SQL keeps working via $queryRawUnsafe; CRUD can use prisma.* directly.
 */

function isControlStatement(sql) {
  const cmd = sql.trim().toUpperCase();
  return cmd === 'BEGIN' || cmd === 'COMMIT' || cmd.startsWith('ROLLBACK');
}

function toRows(result) {
  return { rows: Array.isArray(result) ? result : [] };
}

function createQueryFn(client) {
  return async (sql, params = []) => {
    if (isControlStatement(sql)) return { rows: [] };
    return toRows(await client.$queryRawUnsafe(sql, ...params));
  };
}

/** pg-compatible adapter backed by Prisma. */
function createSqlBridge(prisma) {
  return {
    query: createQueryFn(prisma),

    /**
     * Interactive transaction compatible with existing repository code
     * (BEGIN / COMMIT / ROLLBACK / release).
     */
    connect() {
      return new Promise((resolve, reject) => {
        prisma
          .$transaction(async (tx) => {
            let finished = false;
            let rollbackRequested = false;

            const client = {
              query: async (sql, params = []) => {
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
          .catch((err) => {
            if (err.message !== 'ROLLBACK' && !err.pgRollback) {
              reject(err);
            }
          });
      });
    },
  };
}

/** Run callback inside a Prisma transaction with a pg-style client. */
async function withPgTransaction(prisma, fn) {
  return prisma.$transaction(async (tx) => {
    const client = { query: createQueryFn(tx) };
    return fn(client);
  });
}

module.exports = { createSqlBridge, withPgTransaction };
