"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, ChevronDown, Check, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
    label: string;
    items: any[];
    displayKey: string; // The property name to display from the item object (e.g. 'name')
    valueKey: string;   // The property name to use as value (e.g. 'id')
    value: string;
    onChange: (value: string) => void;
    onAddNew?: () => void;
    onEdit?: () => void;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
}

export function Combobox({
    label,
    items,
    displayKey,
    valueKey,
    value,
    onChange,
    onAddNew,
    onEdit,
    placeholder = "",
    error,
    disabled = false,
}: ComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter items based on search term
    const safeItems = Array.isArray(items) ? items : [];
    const filteredItems = safeItems.filter((item) =>
        item?.[displayKey]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Find the currently selected display value
    const selectedItem = safeItems.find((item) => item[valueKey] === value);
    const displayValue = selectedItem ? selectedItem[displayKey] : "";

    return (
        <div className="input-group combobox-wrapper" ref={wrapperRef}>
            <label>{label}</label>

            <div
                className={cn(
                    "cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.8rem 1.2rem',
                    backgroundColor: displayValue
                        ? 'rgba(255, 102, 153, 0.08)'
                        : 'var(--input-bg)',
                    border: `2px solid ${error ? 'var(--danger)' : isOpen ? 'var(--accent-teal)' : displayValue ? 'var(--primary)' : 'var(--border-color)'}`,
                    borderRadius: '16px',
                    color: '#0a1f5c',
                    fontSize: '1.65rem',
                    fontWeight: 600,
                    fontFamily: "'Nunito', sans-serif",
                    transition: 'all 0.2s ease-in-out',
                    textTransform: 'uppercase' as const,
                    boxShadow: isOpen ? '0 0 0 4px rgba(230, 0, 18, 0.2)' : 'none'
                }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") {
                        setIsOpen(!isOpen);
                        e.preventDefault();
                    }
                    if (e.key === "Escape") {
                        setIsOpen(false);
                    }
                }}
            >
                <span style={{
                    opacity: displayValue ? 1 : 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '85%'
                }}>
                    {displayValue || placeholder}
                </span>

                <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    {value && onEdit && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            title="Modifier"
                            style={{ cursor: "pointer", color: "var(--accent-teal)", padding: "0.2rem", display: "flex" }}
                        >
                            <Edit3 size={14} />
                        </div>
                    )}
                    {onAddNew && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onAddNew(); }}
                            title="Ajouter nouveau"
                            style={{ cursor: "pointer", color: "var(--accent-teal)", padding: "0.2rem", display: "flex" }}
                        >
                            <Plus size={16} />
                        </div>
                    )}
                    <ChevronDown
                        size={18}
                        style={{
                            color: "var(--border-color)",
                            transition: "transform 0.2s",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                    />
                </div>
            </div>

            {isOpen && (
                <div className="combobox-dropdown" style={{ position: 'absolute', width: '100%' }}>
                    {/* Search Input */}
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={16} style={{ color: "var(--text-muted)" }} />
                        <input
                            type="text"
                            ref={searchInputRef}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher..."
                            style={{
                                border: 'none',
                                padding: '0.4rem',
                                backgroundColor: 'transparent',
                                width: '100%',
                                boxShadow: 'none'
                            }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing dropdown on input click
                        />
                    </div>

                    {/* List of items */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredItems.length === 0 ? (
                            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <div
                                    key={item[valueKey]}
                                    className="combobox-item"
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        backgroundColor: value === item[valueKey] ? 'rgba(230, 0, 18, 0.1)' : 'transparent',
                                        color: value === item[valueKey] ? 'var(--primary)' : 'inherit'
                                    }}
                                    onClick={() => {
                                        onChange(item[valueKey]);
                                        setIsOpen(false);
                                        setSearchTerm("");
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            onChange(item[valueKey]);
                                            setIsOpen(false);
                                            setSearchTerm("");
                                            e.preventDefault();
                                        }
                                    }}
                                    tabIndex={0}
                                    role="option"
                                >
                                    <span>{item[displayKey]}</span>
                                    {value === item[valueKey] && <Check size={16} />}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add New Button */}
                    {onAddNew && (
                        <div
                            className="combobox-add-new"
                            tabIndex={0}
                            onClick={() => {
                                setIsOpen(false);
                                onAddNew();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    setIsOpen(false);
                                    onAddNew();
                                    e.preventDefault();
                                }
                            }}
                        >
                            <Plus size={18} />
                            <span>Nouveau {label.replace(/Nom du |Nom /g, '')}</span>
                        </div>
                    )}
                </div>
            )}

            {error && <div className="error-msg">{error}</div>}
        </div>
    );
}
