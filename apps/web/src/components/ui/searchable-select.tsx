"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

export interface Option {
    value: string;
    label: string;
    group?: string;
}

interface SearchableSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Seleccionar...",
    className = "",
    isLoading = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filtered options (memoized)
    const filteredOptions = useMemo(() => {
        if (!query) return options;
        const lowerQuery = query.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerQuery) ||
            (opt.group && opt.group.toLowerCase().includes(lowerQuery))
        );
    }, [options, query]);

    // Limit rendered options for performance (virtualization-lite)
    const displayedOptions = filteredOptions.slice(0, 50);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            {/* Trigger Button */}
            <div
                className="flex items-center justify-between w-full border border-gray-300 rounded-xl px-3 py-3 text-sm bg-white dark:bg-slate-700 dark:border-gray-600 dark:text-white cursor-pointer focus-within:ring-2 focus-within:ring-lex-brand/20 focus-within:border-lex-brand transition-all"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 truncate">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    {selectedOption ? (
                        <span className="truncate">{selectedOption.label}</span>
                    ) : (
                        <span className="text-gray-500">{placeholder}</span>
                    )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-lex-brand"
                                placeholder="Buscar plantilla..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                            {query && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setQuery(""); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-80 p-1">
                        {isLoading && (
                            <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                        )}

                        {!isLoading && displayedOptions.length === 0 && (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No se encontraron resultados para "{query}"
                            </div>
                        )}

                        {!isLoading && displayedOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`
                                    flex flex-col px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors
                                    ${opt.value === value
                                        ? "bg-lex-brand/10 text-lex-brand"
                                        : "hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200"}
                                `}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                    setQuery("");
                                }}
                            >
                                <span className="font-medium truncate">{opt.label}</span>
                                {opt.group && (
                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{opt.group}</span>
                                )}
                            </div>
                        ))}

                        {!isLoading && filteredOptions.length > 50 && (
                            <div className="p-2 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-700">
                                Mostrando 50 de {filteredOptions.length} resultados. Sigue escribiendo para filtrar.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
