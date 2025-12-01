"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/api";
import { Documento } from "@leximetrics/db";

// Extended Template type for DocWorks 2.0
interface DocWorksStyle {
    name?: string;
    writingStyle?: {
        tone?: string;
        voice?: string;
        region?: string;
        extraInstructions?: string;
    };
}

type ParamField = {
    key: string;
    label: string;
    type: 'text' | 'longtext' | 'currency' | 'date' | 'rut' | 'number' | 'select';
    group?: string;
    required?: boolean;
    description?: string;
    aiEnabled?: boolean;
    aiHint?: string;
    defaultValue?: string;
    options?: any;
};

type TemplateWithSchema = Documento & {
    category?: string | null;
    paramSchema?: {
        version: number;
        groups?: { id: string; label: string; icon?: string }[];
        fields: ParamField[];
    } | null;
};

type Step = 1 | 2 | 3 | 4;
type FieldSource = 'empty' | 'ai' | 'manual';

interface AiSummary {
    extractedTextLength: number;
    filledCount: number;
    fromAiCount: number;
}

export default function DocWorksView() {
    // Existing State
    const [templates, setTemplates] = useState<TemplateWithSchema[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateWithSchema | null>(null);
    const [placeholders, setPlaceholders] = useState<string[]>([]);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // New State for DocWorks 2.0
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [fieldSources, setFieldSources] = useState<Record<string, FieldSource>>({});
    const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
    const [selectedTemplateSchema, setSelectedTemplateSchema] = useState<TemplateWithSchema['paramSchema'] | null>(null);
    const [docWorksStyle, setDocWorksStyle] = useState<DocWorksStyle | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [aiLoadingFieldKey, setAiLoadingFieldKey] = useState<string | null>(null);

    // Telemetry Helper
    const sendTelemetry = async (event: {
        feature: string;
        action: string;
        durationMs?: number;
        meta?: Record<string, any>;
        error?: string;
    }) => {
        try {
            await apiClient.post('/telemetry/events', event);
        } catch (e) {
            // Best-effort, no mostrar error al usuario
            console.error('Telemetry error', e);
        }
    };

    // Derived State
    const completionPercent = useMemo(() => {
        if (placeholders.length === 0) return 0;
        const filled = placeholders.filter(k => (formData[k] ?? '').trim().length > 0).length;
        return Math.round((filled / placeholders.length) * 100);
    }, [placeholders, formData]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const data = await apiClient.get<TemplateWithSchema[]>("/templates");
                setTemplates(data);
            } catch (err: any) {
                setError(err.message || "Error al cargar plantillas");
            } finally {
                setLoadingTemplates(false);
            }
        };

        const fetchStyle = async () => {
            try {
                const style = await apiClient.get<DocWorksStyle>(
                    '/tenant-config/docworks-style',
                );
                setDocWorksStyle(style || {});
            } catch (err) {
                console.error('Error al cargar docWorksStyle:', err);
            }
        };

        fetchTemplates();
        fetchStyle();
    }, []);

    const handleTemplateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        if (!templateId) {
            setSelectedTemplate(null);
            setSelectedTemplateSchema(null);
            setPlaceholders([]);
            setFormData({});
            setFieldSources({});
            setAiSummary(null);
            setCurrentStep(1);
            return;
        }

        const template = templates.find((t) => t.id === templateId) || null;
        setSelectedTemplate(template);
        setError("");
        setSuccessMessage("");
        setAiSummary(null);

        if (template) {
            try {
                // Fetch schema if available (DocWorks 2.0)
                let schema = null;
                try {
                    const schemaData = await apiClient.get<any>(`/templates/${template.id}/schema`);
                    if (schemaData && schemaData.paramSchema) {
                        schema = schemaData.paramSchema;
                    }
                } catch (e) {
                    console.warn("Could not fetch schema, falling back to placeholders", e);
                }
                setSelectedTemplateSchema(schema);

                const phs = await apiClient.get<string[]>(`/templates/${template.id}/placeholders`);
                setPlaceholders(phs);

                const initialData: Record<string, string> = {};
                const initialSources: Record<string, FieldSource> = {};

                phs.forEach((ph) => {
                    initialData[ph] = "";
                    initialSources[ph] = 'empty';
                });

                setFormData(initialData);
                setFieldSources(initialSources);

                if (phs.length > 0) {
                    setCurrentStep(2);
                } else {
                    setCurrentStep(4);
                }

            } catch (err: any) {
                setError(err.message || "Error al cargar placeholders");
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        setFieldSources((prev) => ({
            ...prev,
            [name]: value.trim() === '' ? 'empty' : 'manual'
        }));
    };

    const getAIServiceURL = () => {
        if (process.env.NEXT_PUBLIC_AI_SERVICE_URL) {
            return process.env.NEXT_PUBLIC_AI_SERVICE_URL;
        }
        if (typeof window !== "undefined" && window.location.hostname === "localhost") {
            return "http://localhost:8000";
        }
        return "http://localhost:8000"; // Default fallback
    };

    const handleAIFillField = async (field: ParamField) => {
        if (!selectedTemplate || !selectedTemplate.paramSchema) return;

        setAiLoadingFieldKey(field.key);
        try {
            const res = await fetch('/api/jarvis/docworks/fill-field', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    field,
                    values: formValues,
                    style: docWorksStyle,
                    templateName: selectedTemplate.nombre,
                    templateCategory: selectedTemplate.category,
                }),
            });

            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error || 'Error al completar campo');
            }

            const suggestion: string = body.suggestion || '';

            setFormData((prev) => ({
                ...prev,
                [field.key]: prev[field.key]
                    ? `${prev[field.key]}\n\n${suggestion}`
                    : suggestion,
            }));
            setFieldSources((prev) => ({
                ...prev,
                [field.key]: 'ai'
            }));
        } catch (err) {
            console.error('[DocWorks] Error completando campo con JARVIS:', err);
            alert('No se pudo completar el campo con JARVIS. Intenta nuevamente.');
        } finally {
            setAiLoadingFieldKey(null);
        }
    };

    const renderFieldInput = (field: ParamField) => {
        const value = formData[field.key] || '';

        const handleChange = (val: string) => {
            setFormData((prev) => ({
                ...prev,
                [field.key]: val,
            }));
            setFieldSources((prev) => ({
                ...prev,
                [field.key]: val.trim() === '' ? 'empty' : 'manual'
            }));
        };

        return (
            <div key={field.key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'longtext' ? (
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-lex-accent focus:border-lex-accent dark:bg-slate-700 dark:text-white dark:border-gray-600"
                        rows={4}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.description}
                    />
                ) : field.type === 'select' ? (
                    <select
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-lex-accent focus:border-lex-accent dark:bg-slate-700 dark:text-white dark:border-gray-600"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                    >
                        <option value="">Seleccione...</option>
                        {field.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={field.type === 'date' ? 'date' : 'text'}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-lex-accent focus:border-lex-accent dark:bg-slate-700 dark:text-white dark:border-gray-600"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.description}
                    />
                )}

                <div className="flex justify-between items-start mt-1">
                    {field.description && (
                        <p className="text-xs text-gray-500">{field.description}</p>
                    )}

                    {field.aiEnabled && (
                        <button
                            type="button"
                            className="text-xs text-lex-accent underline disabled:opacity-60 ml-2 whitespace-nowrap"
                            onClick={() => handleAIFillField(field)}
                            disabled={aiLoadingFieldKey === field.key}
                        >
                            {aiLoadingFieldKey === field.key
                                ? 'JARVIS está redactando...'
                                : 'Completar con JARVIS'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderField = (key: string, label: string, type: string = 'text', description?: string, aiEnabled?: boolean, fieldObj?: ParamField) => {
        // This renderField is for legacy placeholders or when schema is not used.
        // For schema-driven fields, renderFieldInput is used.
        // The existing renderField logic is kept for backward compatibility if needed,
        // but the instruction implies a full replacement or a new approach.
        // Given the context of `selectedTemplateSchema` being present,
        // the `renderFieldInput` should be used for schema fields.
        // For now, I'll keep the original `renderField` as is, but it won't be called
        // if `selectedTemplateSchema` is present.
        return (
            <div key={key}>
                <div className="flex justify-between mb-1">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                        {fieldObj?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="flex items-center space-x-2">
                        {aiEnabled && (
                            <button
                                type="button"
                                className="text-xs text-lex-accent underline hover:text-lex-primary"
                                onClick={() => handleAIFillField(fieldObj as ParamField)} // Cast to ParamField for compatibility
                            >
                                Completar con IA (JARVIS)
                            </button>
                        )}
                        {fieldSources[key] === 'ai' && (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                ✨ IA
                            </span>
                        )}
                        {fieldSources[key] === 'manual' && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                Manual
                            </span>
                        )}
                    </div>
                </div>
                {type === 'longtext' ? (
                    <textarea
                        name={key}
                        id={key}
                        rows={3}
                        value={formData[key] || ""}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm dark:bg-slate-700 dark:text-white
                            ${fieldSources[key] === 'ai'
                                ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-800'
                                : 'border-gray-300 focus:border-lex-primary focus:ring-lex-primary dark:border-gray-600'
                            }`}
                    />
                ) : (
                    <input
                        type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
                        name={key}
                        id={key}
                        value={formData[key] || ""}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm dark:bg-slate-700 dark:text-white
                            ${fieldSources[key] === 'ai'
                                ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-800'
                                : 'border-gray-300 focus:border-lex-primary focus:ring-lex-primary dark:border-gray-600'
                            }`}
                    />
                )}
                {description && (
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                )}
            </div>
        );
    };

    const handleAnalyzePDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!selectedTemplate) return;

        const startedAt = performance.now();
        const file = e.target.files[0];
        const aiUrl = getAIServiceURL();
        setAnalyzing(true);
        setError("");
        setSuccessMessage("");

        const formDataAI = new FormData();
        formDataAI.append("file", file);
        formDataAI.append("placeholders", placeholders.join(","));

        try {
            const response = await fetch(`${aiUrl}/analyze-document`, {
                method: "POST",
                body: formDataAI,
            });

            if (!response.ok) {
                throw new Error("Error en el servicio de IA");
            }

            const result = await response.json();
            const foundData = result.placeholders_found;
            const extractedTextLength = result.extracted_text_length || 0;

            let fromAiCount = 0;
            let filledCount = 0;

            setFormData((prevData) => {
                const newData = { ...prevData };
                const newSources = { ...fieldSources };

                Object.keys(foundData).forEach((key) => {
                    if (foundData[key] !== null && foundData[key] !== undefined && String(foundData[key]).trim() !== '') {
                        if (newSources[key] !== 'manual') {
                            newData[key] = foundData[key];
                            newSources[key] = 'ai';
                            fromAiCount++;
                        }
                    }
                });

                filledCount = Object.values(newData).filter(v => v.trim().length > 0).length;

                setFieldSources(newSources);
                return newData;
            });

            setAiSummary({
                extractedTextLength,
                filledCount,
                fromAiCount
            });

            setSuccessMessage(`✨ IA completó automáticamente ${fromAiCount} campos. Revisa y ajusta los datos en el Paso 3.`);

            await sendTelemetry({
                feature: 'docworks',
                action: 'ai_analysis',
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    templateId: selectedTemplate.id,
                    placeholdersTotal: placeholders.length,
                    fromAiCount,
                    filledCount,
                },
            });

        } catch (err: any) {
            sendTelemetry({
                feature: 'docworks',
                action: 'ai_analysis',
                error: String(err),
                meta: { templateId: selectedTemplate.id }
            });
            setError(err.message || "Error al analizar el documento con IA");
        } finally {
            setAnalyzing(false);
            e.target.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;
        setGenerating(true);
        setError("");
        setSuccessMessage("");
        const startedAt = performance.now();

        try {
            const finalData = { ...formData };
            placeholders.forEach(ph => {
                if (!(ph in finalData)) finalData[ph] = "";
            });

            const filledCount = Object.values(finalData).filter(v => v.trim().length > 0).length;

            const response = await fetch(`/api/proxy/templates/${selectedTemplate.id}/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(finalData),
            });

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                throw new Error(errJson.message || "Error al generar el documento");
            }

            const blob = await response.blob();
            const disposition = response.headers.get("Content-Disposition");
            let filename = `documento_${selectedTemplate.id}.docx`;
            if (disposition && disposition.indexOf("filename=") !== -1) {
                const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setSuccessMessage("✅ Documento generado correctamente. Revisa tus descargas.");

            await sendTelemetry({
                feature: 'docworks',
                action: 'doc_generate',
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    templateId: selectedTemplate.id,
                    placeholdersTotal: placeholders.length,
                    completedPlaceholders: filledCount,
                },
            });

        } catch (err: any) {
            sendTelemetry({
                feature: 'docworks',
                action: 'doc_generate',
                error: String(err),
                meta: { templateId: selectedTemplate.id }
            });
            setError(err.message || "Error al generar documento");
        } finally {
            setGenerating(false);
        }
    };

    const renderStepIndicator = () => {
        const steps = [
            { num: 1, label: "Plantilla" },
            { num: 2, label: "IA" },
            { num: 3, label: "Datos" },
            { num: 4, label: "Generar" },
        ];

        return (
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    {steps.map((step, idx) => (
                        <div key={step.num} className="flex flex-col items-center relative z-10">
                            <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${currentStep >= step.num
                                    ? "border-lex-primary bg-lex-primary text-white"
                                    : "border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-400"
                                    }`}
                            >
                                {step.num}
                            </div>
                            <span className={`mt-2 text-xs font-medium ${currentStep >= step.num ? "text-lex-primary" : "text-gray-500 dark:text-gray-400"
                                }`}>
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div className={`absolute top-4 left-1/2 h-0.5 w-[calc(100vw/4-2rem)] -z-10 ${currentStep > step.num ? "bg-lex-primary" : "bg-gray-200 dark:bg-gray-700"
                                    }`} style={{ width: 'calc(100% + 4rem)', left: '50%' }} />
                            )}
                        </div>
                    ))}
                </div>
                {placeholders.length > 0 && (
                    <div className="mt-6">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">Progreso de campos</span>
                            <span className="text-gray-500">{completionPercent}% ({placeholders.filter(k => (formData[k] ?? '').trim().length > 0).length}/{placeholders.length})</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                                className="h-2 rounded-full bg-lex-primary transition-all duration-500"
                                style={{ width: `${completionPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">
                DocWorks – Generador de Escritos y Demandas
            </h1>

            {renderStepIndicator()}

            {loadingTemplates ? (
                <div className="text-center text-gray-500 py-12">Cargando DocWorks...</div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/50">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                            {successMessage}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                                <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    Seleccionar Plantilla
                                </label>
                                <select
                                    id="template"
                                    className="block w-full rounded-md border-gray-300 py-3 pl-3 pr-10 text-base focus:border-lex-primary focus:outline-none focus:ring-lex-primary sm:text-sm dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                    value={selectedTemplate?.id || ""}
                                    onChange={handleTemplateChange}
                                >
                                    <option value="">-- Seleccione una plantilla --</option>
                                    {templates.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-slate-800/50">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Ficha Técnica</h3>
                                {selectedTemplate ? (
                                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                        <p><span className="font-medium">Nombre:</span> {selectedTemplate.nombre}</p>
                                        <p><span className="font-medium">Tipo:</span> {selectedTemplate.tipo || 'N/A'}</p>
                                        <p><span className="font-medium">Campos:</span> {placeholders.length}</p>
                                        {selectedTemplateSchema && (
                                            <p className="text-xs text-lex-primary mt-2">✨ Plantilla Parametrizada (DocWorks 2.0)</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Selecciona una plantilla para ver detalles.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && selectedTemplate && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                            <div className="text-center py-8">
                                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                    <span className="text-3xl">✨</span>
                                </div>
                                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Asistencia IA</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    Sube un PDF (ej. demanda, resolución) y J.A.R.V.I.S. extraerá la información para completar la plantilla automáticamente.
                                </p>

                                <div className="flex justify-center mb-8">
                                    <label className={`cursor-pointer inline-flex items-center rounded-md px-6 py-3 text-base font-medium text-white shadow-sm transition-colors ${analyzing ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                        }`}>
                                        {analyzing ? (
                                            <>
                                                <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Analizando...
                                            </>
                                        ) : (
                                            <>
                                                <span>Subir PDF para Análisis</span>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    className="hidden"
                                                    onChange={handleAnalyzePDF}
                                                    disabled={analyzing}
                                                />
                                            </>
                                        )}
                                    </label>
                                </div>

                                {aiSummary && (
                                    <div className="mx-auto max-w-sm rounded-lg bg-gray-50 p-4 text-left dark:bg-slate-800/50">
                                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Resumen del Análisis</h4>
                                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                            <li>• Texto analizado: {aiSummary.extractedTextLength} caracteres</li>
                                            <li>• Campos completados por IA: <span className="font-medium text-green-600 dark:text-green-400">{aiSummary.fromAiCount}</span></li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    ← Volver
                                </button>
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="rounded-md bg-lex-primary px-4 py-2 text-sm font-medium text-white hover:bg-lex-accent"
                                >
                                    Continuar a Datos →
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 3 && selectedTemplate && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                            <div className="mb-6">
                                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Revisar y Completar</h2>
                                <p className="text-sm text-gray-500">Verifica los datos extraídos y completa los campos faltantes.</p>
                            </div>

                            {selectedTemplateSchema ? (
                                <div className="space-y-8">
                                    {(selectedTemplateSchema.groups || [{ id: 'general', label: 'Datos Generales' }]).map((group) => {
                                        const groupFields = selectedTemplateSchema.fields.filter(f => (f.group || 'general') === group.id);
                                        if (groupFields.length === 0) return null;

                                        return (
                                            <section key={group.id} className="space-y-4">
                                                <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                                                    {/* Icon could go here */}
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{group.label}</h3>
                                                </div>
                                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                    {groupFields.map((field) => renderFieldInput(field))}
                                                </div>
                                            </section>
                                        );
                                    })}
                                    {/* Handle fields not in any group or if schema is partial */}
                                    {placeholders.filter(ph => !selectedTemplateSchema.fields.find(f => f.key === ph)).length > 0 && (
                                        <section className="space-y-4">
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Otros Campos</h3>
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                {placeholders.filter(ph => !selectedTemplateSchema.fields.find(f => f.key === ph)).map(ph => renderField(ph, ph))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {placeholders.map((ph) => renderField(ph, ph))}
                                </div>
                            )}

                            <div className="flex justify-between border-t border-gray-200 pt-6 mt-8 dark:border-gray-700">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    ← Volver a IA
                                </button>
                                <button
                                    onClick={() => setCurrentStep(4)}
                                    className="rounded-md bg-lex-primary px-4 py-2 text-sm font-medium text-white hover:bg-lex-accent"
                                >
                                    Continuar a Generar →
                                </button>
                            </div>
                        </div>
                    )}

                    {currentStep === 4 && selectedTemplate && (
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-800">
                            <div className="text-center py-8">
                                <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">Listo para Generar</h2>

                                <div className="mx-auto max-w-sm rounded-lg border border-gray-200 bg-gray-50 p-6 mb-8 dark:border-gray-700 dark:bg-slate-800/50">
                                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">{selectedTemplate.nombre}</h3>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Campos completados:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {placeholders.filter(k => (formData[k] ?? '').trim().length > 0).length} / {placeholders.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Estado:</span>
                                        <span className={`font-medium ${completionPercent === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {completionPercent === 100 ? 'Completo' : 'Incompleto'}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className={`inline-flex items-center rounded-md px-8 py-4 text-lg font-medium text-white shadow-lg transition-all ${generating
                                        ? "bg-lex-primary opacity-75 cursor-wait"
                                        : "bg-lex-primary hover:bg-lex-accent hover:-translate-y-1"
                                        }`}
                                >
                                    {generating ? (
                                        <>
                                            <svg className="mr-3 h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Generando Documento...
                                        </>
                                    ) : (
                                        <>
                                            <span className="mr-2">📄</span> Generar Documento
                                        </>
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-start border-t border-gray-200 pt-6 mt-8 dark:border-gray-700">
                                <button
                                    onClick={() => setCurrentStep(3)}
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                                >
                                    ← Volver a Datos
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
