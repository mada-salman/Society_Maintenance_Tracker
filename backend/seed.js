const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  // Seed Resident
  const resident = await prisma.user.upsert({
    where: { email: 'resident@society.com' },
    update: {},
    create: {
      name: 'John Resident',
      email: 'resident@society.com',
      password: passwordHash,
      role: 'RESIDENT',
    },
  });

  // Seed Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@society.com' },
    update: {},
    create: {
      name: 'Admin Manager',
      email: 'admin@society.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  console.log('Database seeded successfully!');
  console.log('Resident:', resident.email);
  console.log('Admin:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
