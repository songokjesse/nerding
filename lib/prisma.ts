import { PrismaClient } from "@/generated/prisma/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
    prismaV2: PrismaClient;
};

const prisma =
    globalForPrisma.prismaV2 || new PrismaClient({
        adapter,
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prismaV2 = prisma;

export default prisma