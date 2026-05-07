const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('Buscando usuario admin@tecnomovil.com...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tecnomovil.com' }
    });

    if (!user) {
      console.log('Usuario no encontrado, creando...');
      // Need company id
      const company = await prisma.company.findFirst();
      if (!company) {
        console.log('No hay compañia');
        return;
      }
      const passwordHash = await bcrypt.hash('123456', 10);
      await prisma.user.create({
        data: {
          email: 'admin@tecnomovil.com',
          password: passwordHash,
          name: 'Admin Principal',
          role: 'ADMIN',
          companyId: company.id
        }
      });
      console.log('Usuario creado con contraseña 123456');
    } else {
      console.log('Usuario encontrado, actualizando contraseña...');
      const passwordHash = await bcrypt.hash('123456', 10);
      await prisma.user.update({
        where: { email: 'admin@tecnomovil.com' },
        data: { password: passwordHash }
      });
      console.log('Contraseña actualizada a 123456 con éxito.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
