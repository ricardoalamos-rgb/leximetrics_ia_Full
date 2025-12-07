"use client";

import { useEffect, useState, useMemo } from "react";
import { apiClient } from "@/lib/api";
import { Documento } from "@leximetrics/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Sparkles, CheckCircle2, Upload, ArrowRight, ArrowLeft, Download } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

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

    // Causa 360 Integration
    const [causas, setCausas] = useState<any[]>([]);
    const [selectedCausaId, setSelectedCausaId] = useState<string>("");
    const [loadingCausas, setLoadingCausas] = useState(false);

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

        const fetchCausas = async () => {
            try {
                setLoadingCausas(true);
                const data = await apiClient.get<any[]>('/causas');
                setCausas(data || []);
            } catch (err) {
                console.error("Error cargando causas:", err);
            } finally {
                setLoadingCausas(false);
            }
        };

        fetchTemplates();
        fetchStyle();
        fetchCausas();
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
        return "/ai"; // Default fallback to relative proxy
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
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-lex-brand/20 focus:border-lex-brand dark:bg-slate-700 dark:text-white dark:border-gray-600 transition-all"
                        rows={4}
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder={field.description}
                    />
                ) : field.type === 'select' ? (
                    <select
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-lex-brand/20 focus:border-lex-brand dark:bg-slate-700 dark:text-white dark:border-gray-600 transition-all"
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
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-lex-brand/20 focus:border-lex-brand dark:bg-slate-700 dark:text-white dark:border-gray-600 transition-all"
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
                            className="text-xs text-lex-brand font-medium hover:underline disabled:opacity-60 ml-2 whitespace-nowrap flex items-center gap-1"
                            onClick={() => handleAIFillField(field)}
                            disabled={aiLoadingFieldKey === field.key}
                        >
                            <Sparkles className="w-3 h-3" />
                            {aiLoadingFieldKey === field.key
                                ? 'JARVIS pensando...'
                                : 'Completar con IA'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderField = (key: string, label: string, type: string = 'text', description?: string, aiEnabled?: boolean, fieldObj?: ParamField) => {
        return (
            <div key={key}>
                <div className="flex justify-between mb-1">
                    <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                        {fieldObj?.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="flex items-center space-x-2">
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
                        className={`mt-1 block w-full rounded-lg shadow-sm sm:text-sm dark:bg-slate-700 dark:text-white p-3
                            ${fieldSources[key] === 'ai'
                                ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-800'
                                : 'border-gray-300 focus:border-lex-brand focus:ring-lex-brand dark:border-gray-600'
                            }`}
                    />
                ) : (
                    <input
                        type={type === 'date' ? 'date' : type === 'number' ? 'number' : 'text'}
                        name={key}
                        id={key}
                        value={formData[key] || ""}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-lg shadow-sm sm:text-sm dark:bg-slate-700 dark:text-white p-3
                            ${fieldSources[key] === 'ai'
                                ? 'border-green-300 focus:border-green-500 focus:ring-green-500 dark:border-green-800'
                                : 'border-gray-300 focus:border-lex-brand focus:ring-lex-brand dark:border-gray-600'
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

    const handleAnalyzeCausa360 = async () => {
        if (!selectedTemplate || !selectedCausaId) return;

        const startedAt = performance.now();
        setAnalyzing(true);
        setError("");
        setSuccessMessage("");

        try {
            const prompt = `
            Actúa como un asistente legal experto. Analiza TODA la información disponible de la causa (historial, movimientos, documentos, deuda, etc.) y extrae los valores para los siguientes campos: ${placeholders.join(',')}.
            Responde DIRECTAMENTE con un objeto JSON válido donde las claves sean los nombres de los campos y los valores sean la información extraída.
            Si no encuentras información para un campo, usa una cadena vacía "".
            NO incluyas markdown (como \`\`\`json), solo el JSON raw.
            `;

            const response = await apiClient.post<{ reply: string }>('/jarvis/ask-causa', {
                question: prompt,
                causaId: selectedCausaId,
            });

            const answer = response.reply;
            let placeholdersFound: Record<string, string> = {};

            try {
                // Clean markdown code blocks if present (Jarvis api might return markdown)
                const cleanedAnswer = answer.replace(/'''json/g, '').replace(/```json/g, '').replace(/```/g, '').trim();
                // Find JSON object using regex as fallback or direct parse
                const jsonMatch = cleanedAnswer.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    placeholdersFound = JSON.parse(jsonMatch[0]);
                } else {
                    placeholdersFound = JSON.parse(cleanedAnswer);
                }
            } catch (parseError) {
                console.error("Error parsing JSON from 360:", parseError);
                throw new Error("La respuesta de Causa 360 no tuvo el formato esperado.");
            }

            let fromAiCount = 0;
            let filledCount = 0;

            setFormData((prevData) => {
                const newData = { ...prevData };
                const newSources = { ...fieldSources };

                Object.keys(placeholdersFound).forEach((key) => {
                    const val = placeholdersFound[key];
                    if (val !== null && val !== undefined && String(val).trim() !== '') {
                        newData[key] = String(val);
                        newSources[key] = 'ai';
                        fromAiCount++;
                    }
                });

                filledCount = Object.values(newData).filter(v => v.trim().length > 0).length;
                setFieldSources(newSources);
                return newData;
            });

            setAiSummary({
                extractedTextLength: answer.length, // Proxy for complexity
                filledCount,
                fromAiCount
            });

            setSuccessMessage(`✨ Causa 360 completó automáticamente ${fromAiCount} campos.`);

            await sendTelemetry({
                feature: 'docworks',
                action: 'causa_360_analysis',
                durationMs: Math.round(performance.now() - startedAt),
                meta: {
                    templateId: selectedTemplate.id,
                    causaId: selectedCausaId,
                    fromAiCount,
                },
            });

        } catch (err: any) {
            console.error("Error Causa 360:", err);
            setError(err.message || "Error al analizar Causa 360");
        } finally {
            setAnalyzing(false);
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
                        <div key={step.num} className="flex flex-col items-center relative z-10 w-full">
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${currentStep >= step.num
                                    ? "border-lex-brand bg-lex-brand text-white shadow-lg shadow-lex-brand/30"
                                    : "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-slate-800 dark:text-gray-500"
                                    }`}
                            >
                                {step.num}
                            </div>
                            <span className={`mt-2 text-xs font-medium transition-colors ${currentStep >= step.num ? "text-lex-brand font-bold" : "text-gray-400 dark:text-gray-500"
                                }`}>
                                {step.label}
                            </span>
                            {idx < steps.length - 1 && (
                                <div className="absolute top-5 left-1/2 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -z-10">
                                    <div
                                        className="h-full bg-lex-brand transition-all duration-500"
                                        style={{ width: currentStep > step.num ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                {placeholders.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-lex-brand" />
                                Progreso de campos
                            </span>
                            <span className="text-gray-500 font-medium">{completionPercent}% ({placeholders.filter(k => (formData[k] ?? '').trim().length > 0).length}/{placeholders.length})</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-lex-brand to-lex-vibrant-cyan transition-all duration-500"
                                style={{ width: `${completionPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold bg-gradient-to-r from-lex-brand via-lex-primary to-lex-vibrant-cyan bg-clip-text text-transparent mb-2">
                    DocWorks
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Generador inteligente de escritos y demandas judiciales.
                </p>
            </div>

            {renderStepIndicator()}

            {loadingTemplates ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-12 h-12 animate-spin text-lex-brand mb-4" />
                    <p className="text-gray-500 font-medium">Cargando plantillas...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {error && (
                        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-900/50 flex items-center gap-2 animate-shake">
                            <div className="p-1 bg-red-100 rounded-full"><ArrowRight className="w-4 h-4 rotate-180" /></div>
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900/50 flex items-center gap-2 animate-fade-in">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            {successMessage}
                        </div>
                    )}

                    {currentStep === 1 && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 animate-slide-up">
                            <Card className="md:col-span-2 border-t-4 border-t-lex-brand">
                                <CardHeader>
                                    <CardTitle>Seleccionar Plantilla</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                        Elige el tipo de documento a generar
                                    </label>
                                    <div className="relative">
                                        <SearchableSelect
                                            options={templates.map(t => ({
                                                value: t.id,
                                                label: t.nombre,
                                                group: t.category || "General"
                                            }))}
                                            value={selectedTemplate?.id}
                                            onChange={(val) => handleTemplateChange({ target: { value: val } } as any)}
                                            placeholder="Buscar en la biblioteca legal..."
                                        />
                                    </div>
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                        {/* Quick Filters / Chips (Optional enhancement) */}
                                        {['Civil', 'Penal', 'Laboral', 'Familia'].map(cat => (
                                            <button
                                                key={cat}
                                                className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-xs rounded-full hover:bg-lex-brand hover:text-white transition-colors whitespace-nowrap"
                                                onClick={() => {
                                                    // This is a UI hint, for now pure search is powerful enough.
                                                    // Implementing this requires passing filter prop to SearchableSelect or filtering upstream.
                                                    // Let's leave it as visual candy or implement later.
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gray-50 dark:bg-slate-800/50 border-dashed">
                                <CardHeader>
                                    <CardTitle className="text-base">Ficha Técnica</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedTemplate ? (
                                        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                                            <p className="flex justify-between"><span className="font-medium text-gray-900 dark:text-white">Nombre:</span> <span>{selectedTemplate.nombre}</span></p>
                                            <p className="flex justify-between"><span className="font-medium text-gray-900 dark:text-white">Tipo:</span> <span>{selectedTemplate.tipo || 'N/A'}</span></p>
                                            <p className="flex justify-between"><span className="font-medium text-gray-900 dark:text-white">Campos:</span> <span className="bg-gray-200 px-2 py-0.5 rounded-full text-xs font-bold text-gray-700">{placeholders.length}</span></p>
                                            {selectedTemplateSchema && (
                                                <div className="mt-4 p-2 bg-lex-brand/10 rounded-lg text-xs text-lex-brand font-medium flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    Plantilla Parametrizada 2.0
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-center">
                                            <FileText className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-xs">Selecciona una plantilla para ver detalles.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {currentStep === 2 && selectedTemplate && (
                        <Card className="border-t-4 border-t-purple-500 animate-slide-up">
                            <CardContent className="p-8">
                                <div className="text-center">
                                    <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 shadow-lg shadow-purple-500/20 animate-bounce-subtle">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Asistencia J.A.R.V.I.S.</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                                        Sube un PDF (ej. demanda, resolución) y la IA extraerá la información para completar la plantilla automáticamente.
                                    </p>

                                    <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
                                        <div className="flex flex-col items-center gap-4 w-full md:w-1/2 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-slate-800/50 hover:shadow-lg transition-shadow">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-semibold">Subir Documento</h3>
                                            <label className={`cursor-pointer inline-flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-1 w-full justify-center ${analyzing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/30'
                                                }`}>
                                                {analyzing ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Upload className="w-5 h-5" />
                                                )}
                                                <span>{analyzing ? 'Analizando...' : 'Elegir PDF'}</span>
                                                <input
                                                    type="file"
                                                    accept="application/pdf"
                                                    className="hidden"
                                                    onChange={handleAnalyzePDF}
                                                    disabled={analyzing}
                                                />
                                            </label>
                                        </div>

                                        <div className="hidden md:flex items-center justify-center text-gray-400 font-medium">
                                            O
                                        </div>

                                        <div className="flex flex-col items-center gap-4 w-full md:w-1/2 p-6 border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-slate-800/50 hover:shadow-lg transition-shadow">
                                            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full text-emerald-600 dark:text-emerald-400">
                                                <Sparkles className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-semibold">Causa 360</h3>
                                            <select
                                                className="w-full text-sm rounded-lg border-gray-300 dark:bg-slate-700 dark:border-gray-600 dark:text-white mb-2"
                                                value={selectedCausaId}
                                                onChange={(e) => setSelectedCausaId(e.target.value)}
                                                disabled={analyzing || loadingCausas}
                                            >
                                                <option value="">Seleccionar Causa...</option>
                                                {causas.map((c: any) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.rol || c.snumcaso || c.caratulado || 'Sin ROL'} - {c.caratulado || 'Sin Caratula'}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleAnalyzeCausa360}
                                                disabled={analyzing || !selectedCausaId}
                                                className={`cursor-pointer inline-flex items-center gap-3 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-1 w-full justify-center ${analyzing || !selectedCausaId ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/30'
                                                    }`}
                                            >
                                                {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                                <span>Analizar con Causa 360</span>
                                            </button>
                                        </div>
                                    </div>

                                    {aiSummary && (
                                        <div className="mx-auto max-w-md rounded-xl bg-gray-50 p-6 text-left dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 animate-scale-in">
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                Resumen del Análisis
                                            </h4>
                                            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                                <li className="flex justify-between"><span>Texto analizado:</span> <span className="font-mono">{aiSummary.extractedTextLength} chars</span></li>
                                                <li className="flex justify-between"><span>Campos completados por IA:</span> <span className="font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 rounded-full">{aiSummary.fromAiCount}</span></li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-8 mt-8 dark:border-gray-800">
                                    <Button variant="ghost" onClick={() => setCurrentStep(1)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
                                    </Button>
                                    <Button variant="primary" onClick={() => setCurrentStep(3)}>
                                        Continuar a Datos <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 3 && selectedTemplate && (
                        <Card className="animate-slide-up">
                            <CardHeader>
                                <CardTitle>Revisar y Completar</CardTitle>
                                <p className="text-sm text-gray-500">Verifica los datos extraídos y completa los campos faltantes.</p>
                            </CardHeader>
                            <CardContent>
                                {selectedTemplateSchema ? (
                                    <div className="space-y-8">
                                        {(selectedTemplateSchema.groups || [{ id: 'general', label: 'Datos Generales' }]).map((group) => {
                                            const groupFields = selectedTemplateSchema.fields.filter(f => (f.group || 'general') === group.id);
                                            if (groupFields.length === 0) return null;

                                            return (
                                                <section key={group.id} className="space-y-4">
                                                    <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 dark:border-gray-700">
                                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg">{group.label}</h3>
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        {groupFields.map((field) => renderFieldInput(field))}
                                                    </div>
                                                </section>
                                            );
                                        })}
                                        {placeholders.filter(ph => !selectedTemplateSchema.fields.find(f => f.key === ph)).length > 0 && (
                                            <section className="space-y-4">
                                                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg border-b border-gray-200 pb-2">Otros Campos</h3>
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

                                <div className="flex justify-between border-t border-gray-100 pt-8 mt-8 dark:border-gray-800">
                                    <Button variant="ghost" onClick={() => setCurrentStep(2)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a IA
                                    </Button>
                                    <Button variant="primary" onClick={() => setCurrentStep(4)}>
                                        Continuar a Generar <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {currentStep === 4 && selectedTemplate && (
                        <Card className="border-t-4 border-t-green-500 animate-slide-up">
                            <CardContent className="p-12 text-center">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Listo para Generar</h2>

                                <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-gray-50 p-8 mb-10 dark:border-gray-700 dark:bg-slate-800/50 shadow-sm">
                                    <FileText className="w-12 h-12 text-lex-brand mx-auto mb-4" />
                                    <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-6">{selectedTemplate.nombre}</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Campos completados:</span>
                                            <span className="font-bold text-gray-900 dark:text-white bg-white px-3 py-1 rounded-full border border-gray-200">
                                                {placeholders.filter(k => (formData[k] ?? '').trim().length > 0).length} / {placeholders.length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Estado:</span>
                                            <span className={`font-bold px-3 py-1 rounded-full ${completionPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {completionPercent === 100 ? 'Completo' : 'Incompleto'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className={`inline-flex items-center gap-3 rounded-xl px-10 py-5 text-xl font-bold text-white shadow-xl transition-all hover:-translate-y-1 ${generating
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/30"
                                        }`}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            Generando Documento...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-6 h-6" />
                                            Generar Documento
                                        </>
                                    )}
                                </button>
                                <div className="mt-8">
                                    <Button variant="ghost" onClick={() => setCurrentStep(3)}>
                                        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a editar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}
