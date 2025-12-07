"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signIn("credentials", {
                email,
                password,
                callbackUrl: "/dashboard",
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        signIn(provider, { callbackUrl: "/dashboard" });
    };

    return (
        <div className="min-h-screen w-full flex bg-gradient-to-br from-lex-brand-dark via-lex-brand to-lex-brand-light overflow-hidden relative">
            {/* Animated Background Elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-lex-vibrant-cyan/10 rounded-full blur-[150px] animate-pulse-slow" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-lex-vibrant-green/10 rounded-full blur-[150px] animate-pulse-slow" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-lex-gold/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

            {/* Left Side - Hero/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 flex-col justify-center items-center relative z-10 text-white p-16">
                <div className="animate-fade-in max-w-lg">
                    <Image
                        src="/logo-landing.png"
                        alt="Leximetrics IA"
                        width={500}
                        height={150}
                        className="mb-10 drop-shadow-2xl object-contain"
                        priority
                    />
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-lex-vibrant-cyan to-lex-vibrant-green animate-glow">
                            Tu Sistema de Gestión Legal y Cobranzas
                        </span>
                    </h1>
                    <p className="text-xl text-gray-100 leading-relaxed font-light">
                        Potencia tu estudio jurídico con Inteligencia Artificial avanzada.
                        Gestión de causas, redacción automatizada y análisis predictivo en una sola plataforma.
                    </p>

                    {/* Feature Pills */}
                    <div className="mt-8 flex flex-wrap gap-3">
                        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
                            ⚡ IA Avanzada
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
                            📊 Analytics en Tiempo Real
                        </div>
                        <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium">
                            🔒 Multi-Tenant Seguro
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 z-10">
                <div className="glass-strong rounded-3xl shadow-2xl w-full max-w-[500px] p-12 animate-scale-in border-2 border-white/30 backdrop-blur-2xl">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <Image
                            src="/logo-header-transparent.png"
                            alt="Leximetrics IA"
                            width={240}
                            height={60}
                            className="object-contain drop-shadow-md"
                        />
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-lex-brand dark:text-white mb-2 tracking-tight">Bienvenido</h2>
                        <p className="text-gray-600 dark:text-gray-300 font-medium">Ingresa a tu espacio de trabajo inteligente</p>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-8">
                        <button
                            onClick={() => handleSocialLogin('google')}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" alt="Google" />
                            Continuar con Google
                        </button>
                        <button
                            onClick={() => handleSocialLogin('azure-ad')}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group"
                        >
                            <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" alt="Microsoft" />
                            Continuar con Microsoft
                        </button>
                        <button
                            onClick={() => handleSocialLogin('apple')}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group"
                        >
                            <img src="https://www.svgrepo.com/show/448234/apple.svg" className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" alt="Apple" />
                            Continuar con Apple
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider text-xs">o ingresa con tu correo</span>
                        </div>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Correo Electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-lex-brand transition-colors duration-300 h-5 w-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-lex-brand focus:ring-4 focus:ring-lex-brand/20 outline-none transition-all duration-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white font-medium text-gray-800 placeholder:text-gray-400"
                                    placeholder="nombre@empresa.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-200 ml-1">Contraseña</label>
                            <div className="relative group">
                                {/* Favicon Integration */}
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                                    <img
                                        src="/favicon.png"
                                        alt="icon"
                                        className="w-full h-full object-contain opacity-40 group-focus-within:opacity-80 transition-all duration-300 rounded-sm"
                                    />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-lex-brand focus:ring-4 focus:ring-lex-brand/20 outline-none transition-all duration-300 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white font-medium text-gray-800 placeholder:text-gray-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-lex-brand via-lex-brand-light to-lex-vibrant-cyan hover:from-lex-vibrant-cyan hover:to-lex-brand text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-lex-brand/30 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center text-lg tracking-wide disabled:hover:translate-y-0"
                        >
                            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : "Iniciar Sesión"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                        ¿No tienes cuenta? <a href="#" className="text-lex-brand dark:text-lex-vibrant-cyan font-bold hover:text-lex-vibrant-cyan transition-colors hover:underline decoration-2 underline-offset-4">Contactar Ventas</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
