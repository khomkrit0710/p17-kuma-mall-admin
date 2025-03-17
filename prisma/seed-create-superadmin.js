// prisma/seed-create-superadmin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // ตรวจสอบว่ามี superadmin อยู่แล้วหรือไม่
    const existingAdmin = await prisma.accountAdmin.findUnique({
      where: { email: 'jumu@clara' }
    });

    if (existingAdmin) {
      console.log('Superadmin with email jumu@clara already exists');
      return;
    }

    // เข้ารหัสรหัสผ่าน
    const password = '27268@jumu';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // สร้าง superadmin
    const superAdmin = await prisma.accountAdmin.create({
      data: {
        email: 'jumu@clara',
        name: 'SuperAdmin',
        password: hashedPassword,
        role: 'superadmin'
      }
    });

    console.log('Superadmin created successfully:', superAdmin.email);
  } catch (error) {
    console.error('Error creating superadmin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

//node prisma/seed-create-superadmin.js