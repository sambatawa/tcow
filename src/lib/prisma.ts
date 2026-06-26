import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  const adapter = new PrismaMariaDb(url);
  return new PrismaClient({ adapter });
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
