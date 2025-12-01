import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from "jsonwebtoken";

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:3001/api/v1";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "super-secret-dev-key";

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const path = params.path.join("/");
    const url = `${BACKEND_API_URL}/${path}${req.nextUrl.search}`;

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

        const response = await fetch(url, {
            method: req.method,
            headers,
            body,
            cache: "no-store",
        });

        return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    } catch (error) {
        console.error("Proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
