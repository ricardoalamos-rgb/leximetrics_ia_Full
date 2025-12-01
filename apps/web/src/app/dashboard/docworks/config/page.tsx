"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";

interface DocWorksStyle {
    tone?: string;
    voice?: string;
    region?: string;
    extraInstructions?: string;
}

export default function DocWorksConfigPage() {
    const [style, setStyle] = useState<DocWorksStyle>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const data = await apiClient.get<DocWorksStyle>("/tenant-config/docworks-style");
                setStyle(data || {});
            } catch (err: any) {
                console.error("Error fetching config", err);
                setMessage({ type: 'error', text: "Error al cargar la configuración." });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setStyle(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await apiClient.patch("/tenant-config/docworks-style", style);
            setMessage({ type: 'success', text: "Configuración guardada correctamente." });
        } catch (err: any) {
            console.error("Error saving config", err);
            setMessage({ type: 'error', text: "Error al guardar la configuración." });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando configuración...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                Configuración de Estilo DocWorks
            </h1>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
                Define el estilo predeterminado para los documentos generados por tu estudio.
            </p>

            {message && (
                <div className={`mb-6 rounded-md p-4 text-sm border ${message.type === 'success'
                    ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800 space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label htmlFor="tone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tono Predeterminado
                        </label>
                        <select
                            id="tone"
                            name="tone"
                            value={style.tone || ""}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lex-primary focus:ring-lex-primary sm:text-sm dark:bg-slate-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="formal">Formal (Jurídico Clásico)</option>
                            <option value="direct">Directo (Moderno)</option>
                            <option value="persuasive">Persuasivo (Argumentativo)</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="voice" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Voz Narrativa
                        </label>
                        <select
                            id="voice"
                            name="voice"
                            value={style.voice || ""}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lex-primary focus:ring-lex-primary sm:text-sm dark:bg-slate-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="first_person">Primera Persona ("Yo/Nosotros")</option>
                            <option value="third_person">Tercera Persona ("El demandante...")</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Región / Jurisdicción
                        </label>
                        <select
                            id="region"
                            name="region"
                            value={style.region || ""}
                            onChange={handleChange}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lex-primary focus:ring-lex-primary sm:text-sm dark:bg-slate-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">-- Seleccionar --</option>
                            <option value="santiago">Santiago</option>
                            <option value="valparaiso">Valparaíso</option>
                            <option value="concepcion">Concepción</option>
                            <option value="antofagasta">Antofagasta</option>
                            <option value="other">Otra</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="extraInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Instrucciones Adicionales de Estilo
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        Ej: "Usar siempre 'S.S.' para referirse al tribunal", "Evitar latinismos innecesarios".
                    </p>
                    <textarea
                        id="extraInstructions"
                        name="extraInstructions"
                        rows={4}
                        value={style.extraInstructions || ""}
                        onChange={handleChange}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-lex-primary focus:ring-lex-primary sm:text-sm dark:bg-slate-700 dark:border-gray-600 dark:text-white"
                        placeholder="Escribe aquí cualquier otra instrucción de estilo para la IA..."
                    />
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center rounded-md border border-transparent bg-lex-primary px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-lex-accent focus:outline-none focus:ring-2 focus:ring-lex-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? "Guardando..." : "Guardar Configuración"}
                    </button>
                </div>
            </div>
        </div>
    );
}
