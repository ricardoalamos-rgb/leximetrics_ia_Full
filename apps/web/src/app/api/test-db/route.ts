import { NextResponse } from "next/server";
import { prisma } from "@leximetrics/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    console.log("Test DB route called");
    try {
        const userCount = await prisma.user.count();
        console.log("User count:", userCount);
        const users = await prisma.user.findMany({
            select: { email: true, role: true }
        });
        return NextResponse.json({
            status: "ok",
            userCount,
            users,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL
            }
        });
    } catch (error) {
        console.error("Test DB error:", error);
        return NextResponse.json({ status: "error", error: String(error) }, { status: 500 });
    }
}
