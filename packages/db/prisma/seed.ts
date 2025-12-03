import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Tenant
    const tenantSlug = 'leximetrics-demo';
    const tenant = await prisma.tenant.upsert({
        where: { slug: tenantSlug },
        update: {},
        create: {
            name: 'Leximetrics Demo Studio',
            slug: tenantSlug,
        },
    });
    console.log(`✅ Tenant created: ${tenant.name}`);

    // 2. Create Admin User
    const adminEmail = 'admin@leximetrics.app';
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Admin User',
            role: UserRole.ADMIN,
            tenantId: tenant.id,
            // Password handling depends on your auth setup. 
            // If using NextAuth Credentials with hashing, you'd hash it here.
            // For now, we assume the auth logic might verify this or just check existence.
            password: 'admin',
        },
    });
    console.log(`✅ Admin user created: ${adminEmail} (Password: admin)`);

    // 3. Create Lawyer User
    const lawyerEmail = 'abogado@leximetrics.app';
    const lawyerUser = await prisma.user.upsert({
        where: { email: lawyerEmail },
        update: {},
        create: {
            email: lawyerEmail,
            name: 'Abogado Demo',
            role: UserRole.LAWYER,
            tenantId: tenant.id,
            password: await bcrypt.hash('demo', 10),
        },
    });
    console.log(`✅ Lawyer user created: ${lawyerEmail} (Password: demo)`);

    // 4. Create AlamosyCia Tenant & User (Requested)
    const alamosSlug = 'alamosycia';
    const alamosTenant = await prisma.tenant.upsert({
        where: { slug: alamosSlug },
        update: {},
        create: {
            name: 'Alamos y Cia',
            slug: alamosSlug,
        },
    });
    console.log(`✅ Tenant created: ${alamosTenant.name}`);

    const alamosEmail = 'ricardo@alamosycia.com';
    const alamosUser = await prisma.user.upsert({
        where: { email: alamosEmail },
        update: {},
        create: {
            email: alamosEmail,
            name: 'Ricardo Alamos',
            role: UserRole.ADMIN,
            tenantId: alamosTenant.id,
            password: await bcrypt.hash('password123', 10),
        },
    });
    console.log(`✅ Alamos User created: ${alamosEmail} (Password: password123)`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
