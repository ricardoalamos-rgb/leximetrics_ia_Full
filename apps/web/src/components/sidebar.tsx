"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scale, Gavel, FileText, Bot, LineChart, Home } from 'lucide-react';

import { useSession } from "next-auth/react";
import { hasRole, SessionUser, UserRole } from "../lib/auth";

interface NavItem {
    href: string;
    label: string;
    icon: any;
    roles?: UserRole[];
}

const navItems: NavItem[] = [
    { href: '/dashboard/home', label: 'Mi Día', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/causas', label: 'Causas (Buscador)', icon: Scale },
    { href: '/dashboard/causas-rojas', label: 'Causas en Rojo', icon: Scale },
    { href: '/dashboard/remates', label: 'Remates', icon: Gavel, roles: ['ADMIN', 'LAWYER', 'PROCURATOR'] },
    { href: '/dashboard/docworks', label: 'DocWorks (Redacción IA)', icon: FileText, roles: ['ADMIN', 'LAWYER'] },
    { href: '/dashboard/jarvis', label: 'J.A.R.V.I.S. (AI)', icon: Bot, roles: ['ADMIN', 'LAWYER'] },
    { href: '/dashboard/ai-analytics', label: 'Analíticas IA', icon: LineChart, roles: ['ADMIN'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const user = session?.user as SessionUser | undefined;

    return (
        <div className="flex h-full w-64 flex-col bg-slate-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-white/10">
                <h1 className="text-xl font-bold text-lex-primary">Leximetrics IA</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navItems.map((item) => {
                    if (item.roles && !hasRole(user, item.roles)) {
                        return null;
                    }

                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${isActive
                                ? "bg-lex-accent text-white"
                                : "text-gray-300 hover:bg-white/10 hover:text-white"
                                } `}
                        >
                            <item.icon className="mr-3 h-6 w-6 flex-shrink-0" aria-hidden="true" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
