import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
} {
  const match = url.match(/^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
  if (!match) {
    throw new Error("Invalid DATABASE_URL format");
  }
  return {
    user: decodeURIComponent(match[1]),
    password: decodeURIComponent(match[2]),
    host: match[3],
    port: parseInt(match[4], 10),
    database: match[5],
  };
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const { host, port, user, password, database } = parseDatabaseUrl(url);

  const adapter = new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    ssl: {},
    connectionLimit: 5,
    connectTimeout: 15000,
    acquireTimeout: 15000,
  } as any);

  return new PrismaClient({ adapter } as any);
}

function hasRequiredDelegates(client: PrismaClient): boolean {
  return (
    typeof client.pengguna?.findMany === "function" &&
    typeof client.verifikasi_email?.findMany === "function"
  );
}

export function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && hasRequiredDelegates(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
  }

  const client = createPrismaClient();
  if (!hasRequiredDelegates(client)) {
    throw new Error(
      "Prisma Client belum sinkron dengan schema. Jalankan: npx prisma generate"
    );
  }

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client) as unknown;
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});

export { prisma };
export default prisma;
