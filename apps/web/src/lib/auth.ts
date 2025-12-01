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

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });
                if (!user) {
                    return null;
                }
                // TODO: Verify password hash
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    tenantId: user.tenantId
                };
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
