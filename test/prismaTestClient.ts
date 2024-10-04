import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL, // SQLite in-memory DB
    },
  },
});
export default prisma;
