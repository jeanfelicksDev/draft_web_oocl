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
    disabled?: boolean;
}

import { SearchableDropdown } from "./SearchableDropdown";

// ─── Main export ─────────────────────────────────────────────────────────────
export function LinkedPortSelector({
    portCountryValue,
    onPortCountryChange,
    portCityValue,
    onPortCityChange,
    portCountryError,
    portCityError,
    disabled = false,
}: LinkedPortSelectorProps) {

    // Countries from DB (fallback to static)
    const [countries, setCountries] = useState<string[]>(MARITIME_COUNTRIES);
    // Ports from DB (fallback to static)
    const [ports, setPorts] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Initial load for countries
    useEffect(() => {
        const loadCountries = async () => {
            try {
                const res = await fetch("/api/globals/countries");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        setCountries(data.map(c => c.name));
                    }
                }
            } catch (e) {
                console.error("Failed to load global countries", e);
            }
        };
        loadCountries();
    }, []);

    // Load ports when country changes
    useEffect(() => {
        if (portCountryValue) {
            const loadPorts = async () => {
                setIsLoading(true);
                try {
                    // Try to get from API
                    const res = await fetch(`/api/globals/ports?country=${encodeURIComponent(portCountryValue)}`);
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data) && data.length > 0) {
                            setPorts(data);
                        } else {
                            // Fallback to static if API returns nothing
                            setPorts(WORLD_PORTS_BY_COUNTRY[portCountryValue] || []);
                        }
                    } else {
                        setPorts(WORLD_PORTS_BY_COUNTRY[portCountryValue] || []);
                    }
                } catch (e) {
                    setPorts(WORLD_PORTS_BY_COUNTRY[portCountryValue] || []);
                } finally {
                    setIsLoading(false);
                }
            };
            loadPorts();
        } else {
            setPorts([]);
        }
    }, [portCountryValue]);

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
                    options={countries}
                    value={portCountryValue}
                    onSelect={handleCountrySelect}
                    placeholder="Sélectionner un pays..."
                    error={portCountryError}
                    disabled={disabled}
                />
            </div>

            <div style={{ position: "relative" }}>
                <SearchableDropdown
                    label="Place of Delivery *"
                    options={ports}
                    value={portCityValue}
                    onSelect={handlePortSelect}
                    placeholder={isLoading ? "Chargement..." : (portCountryValue ? "Sélectionner un port..." : "⬅ Choisir d'abord un pays")}
                    disabled={disabled || !portCountryValue || isLoading}
                    error={portCityError}
                />
            </div>
        </>
    );
}
