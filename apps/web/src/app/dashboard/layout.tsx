import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { LogoutButton } from "@/components/logout-button";
import { DashboardHeader } from "@/components/dashboard-header";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/auth/login");
    }

    return (
        <ThemeProvider>
            <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/20 dark:from-gray-950 dark:via-slate-900 dark:to-gray-950 text-lex-text dark:text-gray-100">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <DashboardHeader
                        userName={session.user.name ?? null}
                        userRole={session.user.role ?? null}
                    />
                    <main className="flex-1 overflow-y-auto p-6 relative">
                        <div className="flex items-center justify-end mb-4 animate-fade-in">
                            <ThemeToggle />
                        </div>
                        <div className="animate-fade-in-delay">
                            <ErrorBoundary>
                                {children}
                            </ErrorBoundary>
                        </div>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}
