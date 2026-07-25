import { PrismaClient } from '@prisma/client';
import { DEMO_USER_EMAIL, DEMO_ORG_NAME } from './demo-constants';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error(
      'Refusing to run reset-demo.ts against a production environment without ALLOW_DEMO_SEED=true'
    );
  }

  console.log('Resetting demo seed dataset…');

  console.log(`Deleting demo seed organization(s) with name "${DEMO_ORG_NAME}"…`);
  const orgDeleteResult = await prisma.organization.deleteMany({
    where: { name: DEMO_ORG_NAME },
  });
  console.log(`Deleted ${orgDeleteResult.count} organization(s).`);

  console.log(`Deleting demo seed user(s) with email "${DEMO_USER_EMAIL}"…`);
  const userDeleteResult = await prisma.user.deleteMany({
    where: { email: DEMO_USER_EMAIL },
  });
  console.log(`Deleted ${userDeleteResult.count} user(s).`);

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
