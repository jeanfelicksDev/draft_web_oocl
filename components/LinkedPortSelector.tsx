"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { MARITIME_COUNTRIES, WORLD_PORTS_BY_COUNTRY } from "@/lib/world-ports-data";

interface LinkedPortSelectorProps {
    // Country (Port of Discharge)
    portCountryValue: string;   // Now holds the actual country name
    onPortCountryChange: (name: string) => void;

    // Port (Place of Delivery)
    portCityValue: string;      // Now holds the actual port name
    onPortCityChange: (name: string) => void;

    portCountryError?: string;
    portCityError?: string;
}

// Generic dropdown with search
function SearchableDropdown({
    label,
    options,
    value,
    onSelect,
    placeholder = "",
    disabled = false,
    error = "",
}: {
    label: string;
    options: string[];
    value: string;
    onSelect: (val: string) => void;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const filtered = options.filter(o =>
        o.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={{ position: "relative" }} ref={wrapperRef}>
            <label>{label}</label>

            {/* Trigger */}
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={(e) => {
                    if (disabled) return;
                    if (e.key === "Enter" || e.key === " ") { setIsOpen(!isOpen); e.preventDefault(); }
                    if (e.key === "Escape") setIsOpen(false);
                }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "0.6rem 1rem",
                    backgroundColor: disabled
                        ? "var(--secondary)"
                        : value
                            ? "rgba(16, 185, 129, 0.05)"
                            : "var(--input-bg)",
                    border: `2px solid ${disabled
                        ? "var(--secondary)"
                        : isOpen
                            ? "var(--border-focus)"
                            : value
                                ? "#10b981"
                                : "var(--border)"
                        }`,
                    borderRadius: "12px",
                    color: disabled ? "var(--text-muted)" : value ? "#0a1f5c" : "#4b4b4b",
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.45 : 1,
                    transition: "all 0.2s ease-in-out",
                    boxShadow: isOpen ? "0 0 0 4px rgba(230, 0, 18, 0.2)" : "none",
                    textTransform: "uppercase",
                }}
            >
                <span style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "88%",
                    fontStyle: value ? "normal" : "italic",
                    opacity: value ? 1 : 0.7,
                }}>
                    {value || placeholder}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    {value && !disabled && (
                        <div
                            onClick={(e) => { e.stopPropagation(); onSelect(""); }}
                            title="Effacer"
                            style={{ cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown
                        size={18}
                        style={{
                            color: disabled ? "var(--text-muted)" : "var(--border-color)",
                            transition: "transform 0.2s",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                    />
                </div>
            </div>


            {/* Dropdown */}
            {isOpen && (
                <div
                    className="combobox-dropdown"
                    style={{ position: "absolute", width: "100%", zIndex: 50 }}
                    role="listbox"
                >
                    {/* Search bar */}
                    <div style={{
                        padding: "0.5rem",
                        borderBottom: "1px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}>
                        <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher..."
                            style={{
                                border: "none",
                                padding: "0.4rem",
                                backgroundColor: "transparent",
                                width: "100%",
                                boxShadow: "none",
                                fontSize: "1rem",
                                textTransform: "none",
                                color: "var(--text-main)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>

                    {/* Items */}
                    <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                        {filtered.length === 0 ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                Aucun résultat
                            </div>
                        ) : (
                            filtered.map((opt) => (
                                <div
                                    key={opt}
                                    className="combobox-item"
                                    role="option"
                                    aria-selected={value === opt}
                                    onClick={() => {
                                        onSelect(opt);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    style={{
                                        backgroundColor: value === opt ? "rgba(230, 0, 0, 0.1)" : "transparent",
                                        color: value === opt ? "var(--accent-teal)" : "#0a1f5c",
                                        fontWeight: value === opt ? 800 : 700,
                                        textTransform: "uppercase",
                                        fontSize: "0.95rem",
                                    }}
                                >
                                    {opt}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {error && <span className="error-msg" style={{ marginTop: '0.25rem', display: 'block' }}>{error}</span>}
        </div>
    );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export function LinkedPortSelector({
    portCountryValue,
    onPortCountryChange,
    portCityValue,
    onPortCityChange,
    portCountryError,
    portCityError,
}: LinkedPortSelectorProps) {

    // Available ports for the selected country
    const availablePorts = portCountryValue
        ? (WORLD_PORTS_BY_COUNTRY[portCountryValue] || [])
        : [];

    // When country is selected
    const handleCountrySelect = (countryName: string) => {
        onPortCountryChange(countryName);
        onPortCityChange(""); // Reset city when country changes
    };

    // When port is selected
    const handlePortSelect = (portName: string) => {
        onPortCityChange(portName);
    };

    return (
        <>
            <div style={{ position: "relative" }}>
                <SearchableDropdown
                    label="Port of Discharge *"
                    options={MARITIME_COUNTRIES}
                    value={portCountryValue}
                    onSelect={handleCountrySelect}
                    placeholder="Sélectionner un pays..."
                    error={portCountryError}
                />
            </div>

            <div style={{ position: "relative" }}>
                <SearchableDropdown
                    label="Place of Delivery *"
                    options={availablePorts}
                    value={portCityValue}
                    onSelect={handlePortSelect}
                    placeholder={portCountryValue ? "Sélectionner un port..." : "⬅ Choisir d'abord un pays"}
                    disabled={!portCountryValue}
                    error={portCityError}
                />
            </div>
        </>
    );
}
