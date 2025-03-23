import { PrismaClient } from "@prisma/client"

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Check if we need to create a new PrismaClient or use the existing one
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query", "error", "warn"],
  })

// In development, attach the PrismaClient to the global object
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Handle Prisma connection errors
prisma
  .$connect()
  .then(() => {
    console.log("Successfully connected to the database")
  })
  .catch((e) => {
    console.error("Failed to connect to the database:", e)
  })

export default prisma

