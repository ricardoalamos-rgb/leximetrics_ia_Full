"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    SquareKanban,
    Bot,
    Gavel,
    FileText,
    BrainCircuit,
    Settings,
    LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Image from "next/image";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Mis Causas",
        href: "/dashboard/causas",
        icon: Gavel,
    },
    {
        title: "Remates",
        href: "/dashboard/remates",
        icon: Gavel,
    },
    {
        title: "DocWorks",
        href: "/dashboard/docworks",
        icon: FileText,
    },
    {
        title: 'Kanban',
        href: '/dashboard/kanban',
        icon: SquareKanban,
    },
    {
        title: 'J.A.R.V.I.S.',
        href: '/dashboard/jarvis',
        icon: Bot,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-64 flex-col bg-gradient-to-b from-lex-brand-dark via-lex-brand to-lex-brand-light text-white shadow-2xl relative overflow-hidden">
            {/* Animated Background Glow */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-lex-vibrant-cyan/10 to-transparent opacity-50 animate-pulse-slow"></div>

            {/* Logo Header */}
            <div className="flex h-40 items-center justify-center px-6 border-b border-white/10 bg-lex-brand relative z-10">
                <img
                    src="/logo-landing.png"
                    alt="Leximetrics"
                    className="h-32 w-auto object-contain mt-4"
                />
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 relative z-10">
                {sidebarItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300 group relative overflow-hidden",
                                isActive
                                    ? "bg-gradient-to-r from-lex-vibrant-cyan/30 to-lex-vibrant-green/20 text-white shadow-lg shadow-lex-vibrant-cyan/20 scale-105"
                                    : "text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 hover:shadow-md"
                            )}
                            style={{
                                animationDelay: `${index * 100}ms`
                            }}
                        >
                            {/* Active Indicator Bar */}
                            {isActive && (
                                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-lex-vibrant-cyan to-lex-vibrant-green rounded-r-full"></div>
                            )}

                            <Icon
                                className={cn(
                                    "h-5 w-5 transition-all duration-300",
                                    isActive
                                        ? "text-lex-vibrant-cyan drop-shadow-lg animate-pulse-slow"
                                        : "text-gray-400 group-hover:text-lex-vibrant-cyan group-hover:scale-110"
                                )}
                            />
                            <span className="relative z-10">{item.title}</span>

                            {/* Hover Glow Effect */}
                            <div className={cn(
                                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                "bg-gradient-to-r from-transparent via-white/5 to-transparent"
                            )}></div>
                        </Link>
                    );
                })}
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-white/10 p-4 space-y-2 bg-black/20 backdrop-blur-sm relative z-10">
                <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white hover:scale-105 transition-all duration-300 group">
                    <Settings className="h-5 w-5 text-gray-400 group-hover:rotate-90 group-hover:text-lex-gold transition-all duration-500" />
                    Configuración
                </button>
                <button
                    onClick={() => signOut()}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 hover:scale-105 transition-all duration-300 group"
                >
                    <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    Cerrar Sesión
                </button>
            </div>

            {/* Bottom Decoration Glow */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-lex-vibrant-green/10 to-transparent opacity-50 animate-pulse-slow"></div>
        </div>
    );
}
