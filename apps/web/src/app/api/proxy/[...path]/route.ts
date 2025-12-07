import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

console.log("[Proxy] Loading route.ts...");

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001/api/v1";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "super-secret-dev-key";

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
    let session;
    try {
        session = await getServerSession(authOptions);
        console.log(`[Proxy] Session retrieved: ${session ? session.user.email : 'null'}`);
    } catch (e: any) {
        console.error(`[Proxy] getServerSession Error:`, e);
        return new NextResponse(`Auth Error: ${e.message}`, { status: 500 });
    }

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const path = params.path.join("/");
    const url = `${BACKEND_API_URL}/${path}${req.nextUrl.search}`;

    console.log(`[Proxy] Requesting: ${url}`);
    console.log(`[Proxy] BACKEND_API_URL env: ${process.env.BACKEND_API_URL}`);


    const headers = new Headers(req.headers);

    // Sign a JWT for the backend
    const token = jwt.sign(
        {
            id: session.user.id,
            email: session.user.email,
            role: session.user.role,
            tenantId: session.user.tenantId,
        },
        NEXTAUTH_SECRET,
        { expiresIn: "1h" }
    );

    headers.set("Authorization", `Bearer ${token}`);

    // Remove host header to avoid conflicts
    headers.delete("host");

    try {
        const body = req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : null;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        const response = await fetch(url, {
            method: req.method,
            headers,
            body,
            cache: "no-store",
            signal: controller.signal,
        });
        clearTimeout(timeoutId);

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    } catch (error: any) {
        console.error("Proxy error:", error);
        return new NextResponse(JSON.stringify({
            message: `Proxy Error: ${error.message || 'Unknown error'}`,
            code: error.code,
            cause: error.cause
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
