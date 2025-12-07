import { NextResponse } from "next/server";

export async function GET() {
    console.log("Ping hit (Raw Response)");
    return new Response(JSON.stringify({ pong: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
