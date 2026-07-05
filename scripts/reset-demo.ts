import { PrismaClient } from '@prisma/client';
import { DEMO_USER_EMAIL, DEMO_ORG_NAME } from './demo-constants';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing to run reset-demo.ts against a production environment without ALLOW_DEMO_SEED=true');
  }

  console.log('Resetting demo seed dataset…');
  const org = await prisma.organization.findFirst({
    where: { name: DEMO_ORG_NAME },
  });

  if (org) {
    console.log(`Deleting demo seed organization (${org.id})…`);
    await prisma.organization.delete({
      where: { id: org.id },
    });
  } else {
    console.log('Seed demo organization not found.');
  }

  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });

  if (user) {
    console.log(`Deleting demo seed user (${user.id})…`);
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
