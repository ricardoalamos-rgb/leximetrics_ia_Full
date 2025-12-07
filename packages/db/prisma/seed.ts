import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

console.log('🚀 Seed script started!');
async function main() {
    console.log('🌱 Seeding database function entered...');

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
    try {
        const adminEmail = 'admin@leximetrics.app';
        const adminUser = await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                name: 'Admin User',
                role: UserRole.ADMIN,
                tenantId: tenant.id,
                password: 'admin',
            },
        });
        console.log(`✅ Admin user created: ${adminEmail} (Password: admin)`);
    } catch (e) {
        console.error('❌ Failed to create Admin User:', e);
    }

    // 3. Create Lawyer User
    try {
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
    } catch (e) {
        console.error('❌ Failed to create Lawyer User:', e);
    }

    // 4. Create AlamosyCia Tenant & User (Requested)
    let alamosTenant;
    try {
        const alamosSlug = 'alamosycia';
        alamosTenant = await prisma.tenant.upsert({
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
    } catch (e) {
        console.error('❌ Failed to create Alamos Tenant/User:', e);
    }

    // 5. Seed Templates from JSON (SKIPPED FOR SPEED during Causas Import)
    /*
    try {
        const fs = require('fs');
        const path = require('path');
        // ... (lines 96-173) ...
    } catch (e) {
        console.warn('⚠️ Error seeding templates:', e);
    }
    */

    // 6. Seed Causas from JSON
    try {
        const fs = require('fs');
        const path = require('path');

        const possiblePaths = [
            'packages/db/prisma/causas_seed.json',
            'prisma/causas_seed.json',
            './causas_seed.json',
            path.join(__dirname, '../../prisma/causas_seed.json'),
            path.join(__dirname, '../prisma/causas_seed.json')
        ];

        let absolutePath = '';
        for (const p of possiblePaths) {
            if (fs.existsSync(path.resolve(p))) {
                absolutePath = path.resolve(p);
                break;
            }
        }

        if (absolutePath) {
            const fileContent = fs.readFileSync(absolutePath, 'utf-8');
            const causas = JSON.parse(fileContent);
            console.log(`⚖️ Seeding ${causas.length} causas from Excel...`);

            for (const c of causas) {
                // Determine tenant (Demo or Alamos)
                // Use Alamos first if available, else Demo
                const targetTenantId = alamosTenant ? alamosTenant.id : tenant.id;

                const exists = await prisma.causa.findFirst({
                    where: { rol: c.rol, tenantId: targetTenantId }
                });

                if (!exists) {
                    await prisma.causa.create({
                        data: {
                            tenantId: targetTenantId,
                            rol: c.rol,
                            caratula: c.caratula || 'S/C',
                            tribunal: c.tribunal || 'Tribunal Civil',
                            rutDeudor: c.rutDeudor,
                            nombreDeudor: c.nombreDeudor,
                            montoDemanda: c.montoDemanda ? parseFloat(c.montoDemanda) : null,
                            fechaIngreso: c.fechaIngreso && c.fechaIngreso.length > 5 ? new Date(c.fechaIngreso) : new Date(),
                            estado: 'TRAMITACION', // Default
                            pendientes: c.resumen ? { resumen: c.resumen } : {},
                        }
                    });
                }
            }
            console.log(`✅ Causas seeded successfully.`);
        } else {
            console.log(`ℹ️ No causas_seed.json found.`);
        }
    } catch (e) {
        console.warn('⚠️ Error seeding causas:', e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
