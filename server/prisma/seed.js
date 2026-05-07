const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding TecnoStock database...');

  // 0. Crear la primera Compañía (Tenant)
  const company = await prisma.company.upsert({
    where: { slug: 'tecnomovil' },
    update: {},
    create: {
      name: 'TecnoMovil Distribuciones',
      slug: 'tecnomovil',
    },
  });

  console.log(`✅ Compañía creada: ${company.name}`);

  // 1. Usuarios (Admin, Manager, Seller)
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || '123456';
  console.log(`\n⚠️ ATENCIÓN: Contraseña para usuarios iniciales: ${seedPassword}`);
  console.log('CAMBIAR INMEDIATAMENTE en producción.\n');
  const passwordHash = await bcrypt.hash(seedPassword, 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tecnomovil.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Admin Principal',
      email: 'admin@tecnomovil.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'gerente@tecnomovil.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Gerente Tienda 1',
      email: 'gerente@tecnomovil.com',
      password: passwordHash,
      role: 'MANAGER',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@tecnomovil.com' },
    update: {},
    create: {
      companyId: company.id,
      name: 'Vendedor Tienda 1',
      email: 'vendedor@tecnomovil.com',
      password: passwordHash,
      role: 'SELLER',
    },
  });

  console.log('✅ Usuarios creados');

  // 2. Ubicaciones
  const warehouse = await prisma.location.upsert({
    where: { name_companyId: { name: 'Almacén Central', companyId: company.id } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Almacén Central',
      type: 'WAREHOUSE',
      address: 'Zona Industrial Lote 42',
    },
  });

  const store1 = await prisma.location.upsert({
    where: { name_companyId: { name: 'Tienda Centro', companyId: company.id } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Tienda Centro',
      type: 'STORE',
      address: 'Av. Principal 123',
    },
  });

  console.log('✅ Ubicaciones creadas');

  // 3. Categorías y Subcategorías
  const catAudio = await prisma.category.upsert({
    where: { name_companyId: { name: 'Audio', companyId: company.id } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Audio',
      description: 'Auriculares, parlantes y accesorios de sonido',
      subCategories: {
        create: [
          { name: 'Auriculares Bluetooth' },
          { name: 'Parlantes Portátiles' },
        ],
      },
    },
  });

  const catAcc = await prisma.category.upsert({
    where: { name_companyId: { name: 'Accesorios', companyId: company.id } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Accesorios',
      description: 'Cables, cargadores, fundas',
      subCategories: {
        create: [
          { name: 'Cables Tipo C' },
          { name: 'Cargadores Rápidos' },
        ],
      },
    },
  });

  console.log('✅ Categorías creadas');

  // 4. Proveedores
  const provider1 = await prisma.supplier.create({
    data: {
      companyId: company.id,
      name: 'Shenzhen Tech Ltd',
      taxId: 'CN-12345678',
      whatsapp: '+86123456789',
      leadTimeDays: 15,
    },
  });

  console.log('✅ Proveedores creados');

  // 5. Clientes
  const customer1 = await prisma.customer.create({
    data: {
      companyId: company.id,
      name: 'Cliente VIP Juan',
      phone: '+5491112345678',
      email: 'juan.vip@email.com',
    },
  });

  console.log('✅ Clientes creados');

  console.log('🎉 Seeding finalizado!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
