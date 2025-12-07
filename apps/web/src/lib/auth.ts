export type UserRole = 'ADMIN' | 'LAWYER' | 'PARALEGAL' | 'CLIENT' | 'ASSISTANT' | 'PROCURATOR';

export type SessionUser = {
    id: string;
    tenantId: string;
    email: string;
    name?: string | null;
    role: UserRole;
};

export const hasRole = (user: SessionUser | null | undefined, roles: UserRole[]) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
};

import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@leximetrics/db";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import AppleProvider from "next-auth/providers/apple";
import * as bcrypt from "bcryptjs";

console.log("[Auth] Loading auth.ts...");

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        AzureADProvider({
            clientId: process.env.AZURE_AD_CLIENT_ID!,
            clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
            tenantId: process.env.AZURE_AD_TENANT_ID,
        }),
        AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Authorize called with:", credentials?.email);
                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials");
                    return null;
                }
                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email }
                    });
                    console.log("User found:", user ? user.email : "null");

                    if (!user || !user.password) {
                        console.log("User not found or no password");
                        return null;
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.password);
                    console.log("Password valid:", isValid);

                    if (!isValid) {
                        console.log("Password invalid");
                        return null;
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        tenantId: user.tenantId
                    };
                } catch (error) {
                    console.error("Authorize error:", error);
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.tenantId = token.tenantId as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.tenantId = (user as any).tenantId;
            }
            return token;
        }
    }
};
