"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        tenantIdentifier: "",
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                tenantIdentifier: formData.tenantIdentifier,
                email: formData.email,
                password: formData.password,
            });

            if (result?.error) {
                setError("Credenciales inválidas o error en el servidor");
            } else if (result?.ok) {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-lex-background p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg border border-lex-secondary/20 bg-white p-8 shadow-lg dark:bg-slate-900">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-lex-primary">
                        Leximetrics IA
                    </h2>
                    <p className="mt-2 text-sm text-lex-secondary">
                        Ingresa a tu cuenta
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label
                                htmlFor="tenantIdentifier"
                                className="block text-sm font-medium text-lex-text"
                            >
                                Organización
                            </label>
                            <input
                                id="tenantIdentifier"
                                name="tenantIdentifier"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border border-lex-secondary/30 bg-transparent px-3 py-2 text-lex-text placeholder-lex-secondary/50 focus:border-lex-primary focus:outline-none focus:ring-1 focus:ring-lex-primary sm:text-sm"
                                placeholder="ej. mi-estudio"
                                value={formData.tenantIdentifier}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-lex-text"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 block w-full rounded-md border border-lex-secondary/30 bg-transparent px-3 py-2 text-lex-text placeholder-lex-secondary/50 focus:border-lex-primary focus:outline-none focus:ring-1 focus:ring-lex-primary sm:text-sm"
                                placeholder="tu@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-lex-text"
                            >
                                Contraseña
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="mt-1 block w-full rounded-md border border-lex-secondary/30 bg-transparent px-3 py-2 text-lex-text placeholder-lex-secondary/50 focus:border-lex-primary focus:outline-none focus:ring-1 focus:ring-lex-primary sm:text-sm"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-lex-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-lex-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Ingresando..." : "Ingresar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
