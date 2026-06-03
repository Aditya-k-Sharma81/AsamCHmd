const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const quote = await prisma.quotation.findUnique({
    where: { id: 'ee36b45c-d6c5-4f80-ab3a-05a1bca713d3' },
    include: { items: true }
  });
  console.log("Quotation details:", JSON.stringify(quote, null, 2));
}

main().finally(() => prisma.$disconnect());
