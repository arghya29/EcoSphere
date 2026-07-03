import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting demo seed dataset…');

  const org = await prisma.organization.findFirst({
    where: { name: 'Seed Demo Organization' },
  });

  if (org) {
    console.log(`Deleting organization "${org.name}" (${org.id})…`);
    await prisma.organization.delete({
      where: { id: org.id },
    });
  } else {
    console.log('Seed Demo Organization not found.');
  }

  const user = await prisma.user.findUnique({
    where: { email: 'demo-seed-user@ecosphere.dev' },
  });

  if (user) {
    console.log(`Deleting user "${user.email}" (${user.id})…`);
    await prisma.user.delete({
      where: { id: user.id },
    });
  } else {
    console.log('Demo seed user not found.');
  }

  console.log('Reset complete!');
}

main()
  .catch((e) => {
    console.error('Error during reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
