import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
}
main().catch(console.error).finally(() => prisma.$disconnect());
