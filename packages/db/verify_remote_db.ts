
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres:BACrEaUUVwsxsYHyJMhHqoUTkrQMmxoL@maglev.proxy.rlwy.net:31261/railway'
        }
    }
});

async function main() {
    console.log('Connecting to Remote DB...');
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'ricardo@alamosycia.com' }
        });

        if (!user) {
            console.log('❌ User NOT found in remote DB');
            return;
        }
        console.log('✅ User FOUND:', user.email, user.role);

        if (!user.password) {
            console.log('❌ User has NO password');
            return;
        }

        const isValid = await bcrypt.compare('password123', user.password);
        console.log(isValid ? '✅ Password MATCHES' : '❌ Password MISMATCH');

    } catch (e) {
        console.error('❌ Connection/Query Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
