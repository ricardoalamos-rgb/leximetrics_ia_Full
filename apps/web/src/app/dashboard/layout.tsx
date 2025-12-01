import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { LogoutButton } from "@/components/logout-button";
import { DashboardHeader } from "@/components/dashboard-header";
import { VoiceAssistantButton } from "@/components/VoiceAssistantButton";
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
            <div className="flex h-screen bg-lex-bg dark:bg-gray-950 text-lex-text dark:text-gray-100">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <DashboardHeader
                        userName={session.user.name ?? null}
                        userRole={session.user.role ?? null}
                    />
                    <main className="flex-1 overflow-y-auto p-6">
                        <div className="flex items-center justify-end mb-4">
                            <ThemeToggle />
                        </div>
                        <ErrorBoundary>
                            {children}
                        </ErrorBoundary>
                    </main>
                    <VoiceAssistantButton />
                </div>
            </div>
        </ThemeProvider>
    );
}
