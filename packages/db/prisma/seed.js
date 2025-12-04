"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
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
            role: client_1.UserRole.ADMIN,
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
            role: client_1.UserRole.LAWYER,
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
            role: client_1.UserRole.ADMIN,
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
