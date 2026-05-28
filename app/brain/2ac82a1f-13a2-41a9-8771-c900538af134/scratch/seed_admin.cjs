const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password', 10);
  const adminUser = await prisma.user.upsert({
    where: { nom: 'admin' },
    update: {},
    create: {
      nom: 'admin',
      password: hashedPassword,
      admin: true,
    },
  });
  console.log('Utilisateur admin créé avec succès:', adminUser.nom);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
